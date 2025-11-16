#!/usr/bin/env python3
"""
mc_draws_copula_v4.py

Monte Carlo draw generator with:
  - Per-variable period marginals (triangular, uniform, discrete).
  - Cross-variable dependence via Gaussian copula (Cholesky).
  - Optional AR(1) per variable (serial correlation).
  - Robust input validation and *period* handling (supports Year / Year-Month / Year-Month-Day).

Key points vs previous version:
  - Periods are detected as:
      - Year-only (YYYY)
      - Year+Month (YYYY-MM)
      - Year+Month+Day (YYYY-MM-DD)
    They are normalized, de-duplicated, and chronologically sorted without collapsing granularity.
  - Your Excel labels in Params/Discrete drive the periods. No aggregation is performed.
  - Coverage validator still enforces that every (variable, period) has parameters.

Sheets expected in INPUT.xlsx:
  - Variables:  variable | dist | ar1_enabled | ar1_rho
  - Params:     variable | month | min | mode | max       (for triangular/uniform)
  - Discrete:   variable | month | value | prob           (for discrete)
  - Correlation: square matrix with header row+col labeling variables (same order as Variables)
  - Settings:   key | value     (e.g., runs, engine, seed)

CLI:
  python mc_draws_copula_v4.py --input-excel INPUT.xlsx --out draws.csv \
      --engine SOBOL --runs 20000 --seed 12345 --burnin 0

  SOBOL default (keep whole blocks; 20k => 20,480):
    python mc_draws_copula_v2.py --input-excel INPUT.xlsx --out draws.csv \
      --engine SOBOL --runs 20000
    # uses block_size=4096 by default, keeps all blocks

  SOBOL exact 20k (cut down):
    python mc_draws_copula_v2.py --input-excel INPUT.xlsx --out draws.csv \
      --engine SOBOL --runs 20000 --exact-n

  Change block size (e.g., 8192):
    ... --engine SOBOL --runs 20000 --block-size 8192          # default keep full blocks
    ... --engine SOBOL --runs 20000 --block-size 8192 --exact-n # cut to exact N

  LHS (always exact N, no blocks):
    python mc_draws_copula_v2.py --input-excel INPUT.xlsx --out draws.csv \
      --engine LHS --runs 20000

"""

from __future__ import annotations

import argparse
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from scipy import stats
from scipy.linalg import cholesky as scipy_cholesky
from scipy.spatial.distance import pdist, squareform
from scipy.linalg import eigh
from numpy.linalg import LinAlgError
from scipy.stats import qmc
from datetime import datetime

# =========================
# Helpers
# =========================

def _as_bool_series(s) -> pd.Series:
    if s.dtype == bool:
        return s
    return s.astype(str).str.strip().str.lower().isin(["1", "true", "yes", "y", "on"])

def _try_int(s: str) -> int | None:
    try:
        return int(s)
    except Exception:
        return None

def _parse_period_label(s: str) -> Tuple[str, str, Tuple[int, int, int, int, str]]:
    """
    Return (normalized_label, type_code, sort_key)

    Types: "Y" (YYYY), "M" (YYYY-MM), "D" (YYYY-MM-DD), else "STR".
    sort_key is a tuple to make year/month/day sort correctly even if mixed.
    """
    s = str(s).strip()

    # Try YYYY
    year = _try_int(s)
    if year is not None and 1 <= year <= 9999:
        return s, "Y", (0, year, 0, 0, s)

    # Try YYYY-MM
    try:
        dt = datetime.strptime(s, "%Y-%m")
        lbl = f"{dt.year:04d}-{dt.month:02d}"
        return lbl, "M", (0, dt.year, dt.month, 0, lbl)
    except Exception:
        pass

    # Try YYYY-MM-DD
    try:
        dt = datetime.strptime(s, "%Y-%m-%d")
        lbl = f"{dt.year:04d}-{dt.month:02d}-{dt.day:02d}"
        return lbl, "D", (0, dt.year, dt.month, dt.day, lbl)
    except Exception:
        pass

    # Fallback: keep as string; push after dated items when sorting
    return s, "STR", (1, 9999, 99, 99, s)

def _normalize_period_label(s: str) -> str:
    return _parse_period_label(s)[0]

def _chronological_periods(labels: List[str]) -> List[str]:
    dedup = list(dict.fromkeys([_normalize_period_label(x) for x in labels]))
    parsed = [_parse_period_label(x) for x in dedup]
    parsed.sort(key=lambda t: t[2])
    return [p[0] for p in parsed]

def _summarize_parameters_when_no_cli(settings: Dict[str, str]) -> None:
    print("[INFO] No CLI overrides: using values from 'Settings' sheet (or defaults).")
    print("[TIP] SOBOL generates samples in blocks of 4096 by default. Effective runs may be padded up to the next multiple. Use --exact-n to cut to exactly N, or --block-size to change the block size.")

def _detect_ar1_usage(variables_df: pd.DataFrame) -> Tuple[bool, float]:
    ar_on = _as_bool_series(variables_df["ar1_enabled"])
    rho = variables_df["ar1_rho"].astype(float)
    mask = (~variables_df["dist"].str.lower().eq("discrete")) & ar_on & (rho > 0)
    if mask.any():
        return True, float(rho[mask].max())
    return False, 0.0


# =========================
# Inverse CDFs
# =========================

def invcdf_uniform(u: np.ndarray, lo: float, hi: float) -> np.ndarray:
    u = np.clip(u, 1e-12, 1 - 1e-12)
    return lo + (hi - lo) * u

def invcdf_triangular(u: np.ndarray, lo: float, mode: float, hi: float) -> np.ndarray:
    # Guarantees [lo, hi]; requires lo <= mode <= hi
    if not (lo <= mode <= hi):
        raise ValueError(f"Triangular invalid params: lo={lo}, mode={mode}, hi={hi}")
    # Guard degenerate or near-degenerate support
    if hi == lo or abs(hi - lo) < 1e-12:
        return np.full_like(u, float(lo), dtype=float)
    u = np.clip(u, 1e-12, 1 - 1e-12)
    c = (mode - lo) / (hi - lo)
    out = np.empty_like(u, dtype=float)
    left = (u < c)
    if c > 0:
        out[left] = lo + np.sqrt(u[left] * (hi - lo) * (mode - lo))
    else:
        out[left] = lo
    if c < 1:
        out[~left] = hi - np.sqrt((1 - u[~left]) * (hi - lo) * (hi - mode))
    else:
        out[~left] = hi
    return out

def invcdf_discrete(u: np.ndarray, values: np.ndarray, probs: np.ndarray) -> np.ndarray:
    # values/probs already filtered per (variable, period). probs sum to 1.
    u = np.clip(u, 1e-12, 1 - 1e-12)
    cdf = np.cumsum(probs)
    idx = np.searchsorted(cdf, u, side="right")
    idx = np.clip(idx, 0, len(values) - 1)
    return values[idx]

# =========================
# Correlation helpers
# =========================

def nearest_pd(A: np.ndarray, eps: float = 1e-10) -> np.ndarray:
    """
    Higham's algorithm to find the nearest positive semidefinite matrix.
    """
    B = (A + A.T) / 2
    _, s, V = np.linalg.svd(B)
    H = (V.T * s) @ V
    A2 = (B + H) / 2
    A3 = (A2 + A2.T) / 2

    # Projection to the nearest PSD
    eigvals, eigvecs = eigh(A3)
    eigvals[eigvals < eps] = eps
    return (eigvecs * eigvals) @ eigvecs.T

def cholesky_corr(C: np.ndarray) -> Tuple[np.ndarray, float]:
    """
    Return lower-triangular L with C approx L L^T. If C not PD, project to nearest PD.
    """
    try:
        L = scipy_cholesky(C, lower=True, overwrite_a=False, check_finite=True)
        return L, 0.0
    except LinAlgError:
        C2 = nearest_pd(C)
        L = scipy_cholesky(C2, lower=True, overwrite_a=False, check_finite=True)
        delta = float(np.max(np.abs(C2 - C)))
        return L, delta

def _is_power_of_two(n: int) -> bool:
    return (n > 0) and (n & (n - 1) == 0)

def sample_unit_cube(
    n_requested: int,
    d: int,
    engine: str,
    seed: int,
    block_size: int = 4096,
    exact_n: bool = False,
) -> np.ndarray:
    """
    Generate U[0,1] points.
    - SOBOL (scrambled):
        Default (exact_n=False): generate ceil(N / block_size) full blocks of size 'block_size'
                                 and KEEP THEM ALL (so runs may be > N).
        With exact_n=True:       generate the same blocks but CUT DOWN to exactly N.
        Note: block_size must be a power of two (default 4096).
    - LHS: exactly N points, no blocks needed.
    """
    engine = engine.upper()
    if engine == "SOBOL":
        if not _is_power_of_two(block_size):
            raise ValueError(f"block_size must be a power of two; got {block_size}")
        m_block = int(np.log2(block_size))

        n_blocks = int(np.ceil(n_requested / block_size))
        sampler = qmc.Sobol(d=d, scramble=True, seed=seed)
        parts = [sampler.random_base2(m=m_block) for _ in range(n_blocks)]
        U = np.vstack(parts)  # shape: (n_blocks*block_size, d)

        if exact_n and U.shape[0] > n_requested:
            print(f"[INFO] SOBOL blocks exact: generated {U.shape[0]} and cut to n={n_requested}.")
            U = U[:n_requested, :]
        else:
            if U.shape[0] != n_requested:
                print(f"[INFO] SOBOL blocks: generated {U.shape[0]} (ceil to full blocks) "
                      f"for requested n={n_requested}.")
        return np.clip(U, 1e-12, 1 - 1e-12)

    elif engine == "LHS":
        sampler = qmc.LatinHypercube(d=d, seed=seed)
        U = sampler.random(n=n_requested)
        return np.clip(U, 1e-12, 1 - 1e-12)
    else:
        raise ValueError("engine must be SOBOL or LHS")

# =========================
# I/O
# =========================

def read_inputs(xlsx_path: str):
    xls = pd.ExcelFile(xlsx_path)
    must = {"Variables", "Params", "Correlation", "Settings"}
    opt = {"Discrete"}
    have = set(xls.sheet_names)
    missing = must - have
    if missing:
        raise SystemExit(f"[ERROR] Missing sheets: {sorted(missing)}")

    variables = pd.read_excel(xls, "Variables").fillna("")
    params = pd.read_excel(xls, "Params").fillna("")
    corr = pd.read_excel(xls, "Correlation").fillna("")
    discrete = pd.read_excel(xls, "Discrete").fillna("") if "Discrete" in have else pd.DataFrame(columns=["variable", "month", "value", "prob"])
    settings_df = pd.read_excel(xls, "Settings").fillna("")
    settings = {}
    for _, row in settings_df.iterrows():
        k = str(row.get("key", "")).strip()
        v = str(row.get("value", "")).strip()
        if k:
            settings[k] = v

    return variables, params, discrete, corr, settings

def validate_and_prepare(
    variables: pd.DataFrame, params: pd.DataFrame, discrete: pd.DataFrame, corr: pd.DataFrame
) -> Tuple[List[str], Dict[Tuple[str, str], Tuple[float, float, float]], Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]], np.ndarray]:
    if variables is None or variables.empty:
        raise SystemExit("[ERROR] 'Variables' sheet is empty.")
    # Required cols
    for col in ["variable", "dist", "ar1_enabled"]:
        if col not in variables.columns:
            raise SystemExit(f"[ERROR] Variables sheet missing column '{col}'")

    # Normalize variable names order & strings
    variables["variable"] = variables["variable"].astype(str).str.strip()
    var_names = variables["variable"].tolist()

    # Dist lower
    variables["dist"] = variables["dist"].astype(str).str.strip().str.lower()
    bad = ~variables["dist"].isin(["triangular", "uniform", "discrete"])
    if bad.any():
        raise SystemExit(f"[ERROR] Unknown dist values: {variables.loc[bad, 'dist'].unique().tolist()}")

    # ar1_enabled
    variables["ar1_enabled"] = _as_bool_series(variables["ar1_enabled"])

    # AR(1)
    if "ar1_rho" not in variables.columns:
        variables["ar1_rho"] = 0.0

    # Params presence for continuous dists
    for col in ["variable", "month", "min", "max"]:
        if col not in params.columns:
            raise SystemExit(f"[ERROR] Params sheet missing column '{col}'")
    if "mode" not in params.columns:
        params["mode"] = np.nan

    params["variable"] = params["variable"].astype(str).str.strip()
    params["month"] = params["month"].apply(_normalize_period_label)

    # Discrete optional
    if not discrete.empty:
        for col in ["variable", "month", "value", "prob"]:
            if col not in discrete.columns:
                raise SystemExit(f"[ERROR] Discrete sheet missing column '{col}'")
        discrete["variable"] = discrete["variable"].astype(str).str.strip()
        discrete["month"] = discrete["month"].apply(_normalize_period_label)
        # normalize prob
        discrete["prob"] = pd.to_numeric(discrete["prob"], errors="coerce")
        if discrete["prob"].isna().any():
            raise SystemExit("[ERROR] Discrete.prob contains non-numeric values.")
        # per (variable, month) must sum to 1
        sums = discrete.groupby(["variable", "month"])["prob"].sum().round(12)
        bad = (np.abs(sums - 1) > 1e-10)
        if bad.any():
            raise SystemExit(f"[ERROR] Discrete probs for some (variable, month) do not sum to 1: {sums[bad].index.tolist()}")

    # Period coverage: union of Params.month and Discrete.month
    per_params = params["month"].unique().tolist()
    per_discr = discrete["month"].unique().tolist() if not discrete.empty else []
    periods = _chronological_periods(per_params + per_discr)

    # Validate continuous params and build map
    tri_rows = params.copy()
    tri_rows["min"] = pd.to_numeric(tri_rows["min"], errors="coerce")
    tri_rows["mode"] = pd.to_numeric(tri_rows["mode"], errors="coerce")
    tri_rows["max"] = pd.to_numeric(tri_rows["max"], errors="coerce")

    mm: Dict[Tuple[str, str], Tuple[float, float, float]] = {}
    tri_warnings = []
    for _, r in tri_rows.iterrows():
        v = str(r["variable"]).strip()
        p = str(r["month"]).strip()
        lo = float(r["min"])
        hi = float(r["max"])
        md_in = r["mode"]
        if np.isnan(md_in):
            md_out = lo + 0.5 * (hi - lo)
            fix = "mode missing; using midpoint"
        else:
            md_out = float(md_in)
            fix = "ok"
            if md_out < lo:
                fix = "mode < min; clamped to min"
                md_out = lo
            elif md_out > hi:
                fix = "mode > max; clamped to max"
                md_out = hi
        mm[(v, p)] = (lo, md_out, hi)
        # Collect warnings for user visibility
        if fix != "ok":
            tri_warnings.append((v, p, lo, md_in, hi, fix, md_out))

    if tri_warnings:
        for v, p, lo_f, md_in, hi_f, fix, md_out in tri_warnings:
            print(f"       ({v}, {p}): min={lo_f}, mode={md_in}, max={hi_f} -> {fix}; mode_used={md_out}")

    # Discrete maps
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]] = {}
    if not discrete.empty:
        for (v, p), g in discrete.groupby(["variable", "month"]):
            vals = g["value"].to_numpy()
            probs = g["prob"].to_numpy()
            disc_map[(v, p)] = (vals, probs)

    # Correlation matrix
    if corr.shape[0] < 1 or corr.shape[1] < 2:
        raise SystemExit("[ERROR] Correlation sheet must have a header row and labeled columns.")

    # First column is variable names; header row includes them too.
    corr = corr.copy()
    header = corr.columns.tolist()
    if header[0].strip().lower() != "variable":
        raise SystemExit("[ERROR] Correlation first column must be 'variable'.")

    # Reorder correlation to match variables order
    corr.index = corr["variable"].astype(str).str.strip()
    corr = corr.drop(columns=[header[0]])
    corr.columns = [str(c).strip() for c in corr.columns]
    # Ensure same order as variables
    corr = corr.loc[var_names, var_names]
    corr_matrix = corr.to_numpy(dtype=float)

    # Symmetrize and bound to [-1, 1]
    corr_matrix = (corr_matrix + corr_matrix.T) / 2
    corr_matrix = np.clip(corr_matrix, -1.0, 1.0)

    # Cholesky
    L, max_delta = cholesky_corr(corr_matrix)
    if max_delta > 1e-8:
        print(f"[WARN] Correlation adjusted to nearest-PD; max |delta| = {max_delta:.3e}")

    return periods, mm, disc_map, L

# =========================
# Engine
# =========================

def generate_draws(
    variables_df: pd.DataFrame,
    periods: List[str],
    mm: Dict[Tuple[str, str], Tuple[float, float, float]],
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]],
    corr_matrix: np.ndarray,
    runs: int,
    engine: str,
    seed: int,
    burnin: int = 0,
    block_size: int = 4096,
    exact_n: bool = False,
) -> Tuple[pd.DataFrame, int]:
    var_names = variables_df["variable"].astype(str).tolist()
    n_vars = len(var_names)
    n_periods = len(periods)

    # AR(1) params
    ar_on = _as_bool_series(variables_df["ar1_enabled"]).to_numpy()
    rho_vec = variables_df["ar1_rho"].astype(float).to_numpy()
    rho_vec = np.where(ar_on, rho_vec, 0.0)
    rho_vec = np.clip(rho_vec, 0.0, 0.9999).astype(float)
    gain_vec = np.sqrt(1.0 - rho_vec ** 2)  # to keep stationary variance 1 for Z

    # Generate unit cube draws
    U = sample_unit_cube(n_requested=runs * n_periods, d=n_vars, engine=engine, seed=seed, block_size=block_size, exact_n=exact_n)
    actual_runs = U.shape[0] // n_periods
    if actual_runs * n_periods != U.shape[0]:
        raise SystemExit("[ERROR] Internal: U shape inconsistent with periods.")
    U = U.reshape(actual_runs, n_periods, n_vars)

    # Map to standard normals E ~ N(0,1)
    E = stats.norm.ppf(U)

    # Correlation via Cholesky
    L, _ = cholesky_corr(corr_matrix)
    E_corr = E @ L.T  # shape (runs, periods, vars)

    # Optional burn-in for AR(1): spin Z without recording
    if burnin and burnin > 0:
        Z_b = np.zeros((actual_runs, n_vars), dtype=float)
        if engine.upper() == "SOBOL":
            sampler_b = qmc.Sobol(d=n_vars, scramble=True, seed=seed + 0xA5A5)
            for _ in range(int(burnin)):
                U_b = sampler_b.random(n=actual_runs)
                E_b = stats.norm.ppf(U_b) @ L.T
                Z_b = rho_eff * Z_b + gain_eff * E_b
        else:
            rng = np.random.default_rng(seed + 0xBEEF)
            for _ in range(int(burnin)):
                U_b = rng.random((actual_runs, n_vars))
                E_b = stats.norm.ppf(U_b) @ L.T
                Z_b = rho_eff * Z_b + gain_eff * E_b
        Z0 = Z_b
    else:
        Z0 = E_corr[:, 0, :]

    # Build Z over periods with AR(1)
    rho_eff = rho_vec.reshape(1, n_vars)
    gain_eff = gain_vec.reshape(1, n_vars)
    Z = np.empty_like(E_corr)
    Z[:, 0, :] = Z0
    for t in range(1, n_periods):
        Z[:, t, :] = rho_eff * Z[:, t - 1, :] + gain_eff * E_corr[:, t, :]

    # Back to uniforms with dependence
    U_dep = stats.norm.cdf(Z)

    # Allocate outputs: rows = runs x n_variables
    rows = actual_runs * n_vars
    data = np.zeros((rows, n_periods), dtype=float)
    out_run = np.repeat(np.arange(1, actual_runs + 1), n_vars)
    out_var = np.tile(var_names, actual_runs)
    row = 0

    for run_idx in range(actual_runs):
        for j, v in enumerate(var_names):
            for t, p in enumerate(periods):
                dist = variables_df.loc[variables_df["variable"] == v, "dist"].iloc[0].lower()
                u = U_dep[run_idx, t, j]

                if dist == "uniform":
                    lo, _, hi = mm[(v, p)]
                    data[row, t] = invcdf_uniform(np.array([u]), lo, hi)[0]
                elif dist == "triangular":
                    lo, md, hi = mm[(v, p)]
                    data[row, t] = invcdf_triangular(np.array([u]), lo, md, hi)[0]
                elif dist == "discrete":
                    vals, probs = disc_map[(v, p)]
                    data[row, t] = invcdf_discrete(np.array([u]), vals, probs)[0]
                else:
                    raise SystemExit(f"[ERROR] Unknown dist '{dist}' for variable '{v}'")
            row += 1

    columns = ["run", "variable"] + periods
    out_dict = {"run": out_run, "variable": out_var}
    for idx_p, p in enumerate(periods):
        out_dict[p] = data[:, idx_p]
    out = pd.DataFrame(out_dict)
    out["run"] = out["run"].astype(int)
    return out, actual_runs

# =========================
# Main
# =========================

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input-excel", required=True)
    ap.add_argument("--out", required=True, help="Output path (.csv or .xlsx)")
    ap.add_argument("--engine", choices=["SOBOL", "LHS"], help="Override Settings.engine")
    ap.add_argument("--runs", type=int, help="Override Settings.runs")
    ap.add_argument("--seed", type=int, help="Override Settings.seed")
    ap.add_argument("--burnin", type=int, help="AR(1) warm-up steps (discarded).")
    ap.add_argument("--block-size", type=int, default=4096, help="SOBOL block size (power of two).")
    ap.add_argument("--exact-n", action="store_true", help="For SOBOL, cut to exactly N instead of keeping full blocks.")
    args = ap.parse_args()

    variables, params, discrete, corr, settings = read_inputs(args.input_excel)

    # Settings defaults
    engine = (args.engine or settings.get("engine", "SOBOL")).strip().upper()
    runs = int(args.runs or int(settings.get("runs", "20000")))
    seed = int(args.seed or int(settings.get("seed", "12345")))
    burnin = int(args.burnin or int(settings.get("burnin", "0")))
    block_size = int(args.block_size)
    exact_n = bool(args.exact_n or str(settings.get("exact_n", "false")).strip().lower() in ["1", "true", "yes", "on"])

    print(f"[INFO] engine={engine} runs={runs} seed={seed} burnin={burnin} block_size={block_size} exact_n={exact_n}")
    if args.engine is None and args.runs is None and args.seed is None and args.burnin is None:
        _summarize_parameters_when_no_cli(settings)
    if engine == "SOBOL" and not _is_power_of_two(block_size):
        raise SystemExit("[ERROR] SOBOL requires block_size to be a power of two.")

    # Validate & prepare
    periods, mm, disc_map, L = validate_and_prepare(variables, params, discrete, corr)

    # Print a summary of changed triangular params
    print("Settings summary:")
    print("       - engine={engine}:")
    print("       - runs={runs}: number of Monte Carlo scenarios (rows per variable).")
    print("       - seed={seed}: reproducibility. Same seed => same draws.")
    print("       - burnin={burnin}: AR(1) warm-up steps discarded before period 1.")
    if engine == "SOBOL":
        print(f"       - SOBOL blocks: block_size={block_size}, exact_n={exact_n}")

    # Detect AR usage for user tip
    ar_used, max_rho = _detect_ar1_usage(variables)
    if ar_used and burnin <= 0 and max_rho > 0.0:
        print("[TIP] You have AR(1) enabled but burnin is 0. Early periods may be biased. Consider setting --burnin (e.g., 20-100).")

    # Generate
    out, actual_runs = generate_draws(
        variables_df=variables,
        periods=periods,
        mm=mm,
        disc_map=disc_map,
        corr_matrix=L @ L.T,
        runs=runs,
        engine=engine,
        seed=seed,
        burnin=burnin,
        block_size=block_size,
        exact_n=exact_n,
    )

    if engine == "SOBOL":
        if not exact_n and actual_runs != runs:
            print(f"[TIP] SOBOL padded to full blocks: requested runs={runs}, effective runs={actual_runs}. Use --exact-n to cut to exactly N or change --block-size.")
        if engine == "SOBOL" and not args.exact_n:
            print(f"[TIP] Padded to a multiple of {args.block_size} due to SOBOL blocks. "
                  f"Use --exact-n to cut to exactly {runs} or change --block-size.")

    # Write
    if args.out.lower().endswith(".xlsx"):
        out.to_excel(args.out, sheet_name="Draws", index=False)
    else:
        out.to_csv(args.out, index=False)

    print(f"[OK] Wrote {len(out):,} rows x {len(out.columns):,} cols to {args.out}")

if __name__ == "__main__":
    main()
