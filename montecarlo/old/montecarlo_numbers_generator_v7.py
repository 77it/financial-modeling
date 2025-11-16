#!/usr/bin/env python3
"""
montecarlo_numbers_generator_v6_fixed.py

Monte Carlo draw generator with:
  - Per-variable period marginals (triangular, uniform, discrete).
  - Cross-variable dependence via Gaussian copula (Cholesky).
  - Optional AR(1) per variable (serial correlation).
  - Robust period handling (supports Year / Year-Month / Year-Month-Day).

Notes:
  - SOBOL uses a single sampler and pads/cuts to block multiples without requiring power-of-two totals.
  - Burn-in uses an independent RNG stream so it does not consume the main sequence.
  - Logs are ASCII-only.
"""

from __future__ import annotations

import argparse
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from scipy import stats
from scipy.linalg import cholesky as scipy_cholesky, eigh
from scipy.linalg import LinAlgError
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
    sort_key makes year/month/day sort correctly even if mixed.
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
    rho = pd.to_numeric(variables_df.get("ar1_rho", 0.0), errors="coerce").fillna(0.0)
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
        Default (exact_n=False): pad to ceil(N / block_size) * block_size and KEEP THEM ALL.
        With exact_n=True:       generate >=N and CUT DOWN to exactly N.
        Implementation uses Sobol.random(n=...) to allow arbitrary totals (no power-of-two constraint).
    - LHS: exactly N points, no blocks needed.
    """
    engine = engine.upper()
    if engine == "SOBOL":
        # Decide how many points to draw in total
        total = n_requested if exact_n else int(np.ceil(n_requested / block_size) * block_size)
        sampler = qmc.Sobol(d=d, scramble=True, seed=seed)
        U = sampler.random(n=total)
        if exact_n and total > n_requested:
            print(f"[INFO] SOBOL exact: generated {total} and cut to n={n_requested}.")
            U = U[:n_requested, :]
        elif not exact_n and total != n_requested:
            print(f"[INFO] SOBOL blocks: generated {total} (ceil to full blocks) for requested n={n_requested}.")
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

# =========================
# Validation and prep
# =========================

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

    # AR(1) column: create if missing, coerce to numeric, blanks -> 0.0
    if "ar1_rho" not in variables.columns:
        variables["ar1_rho"] = 0.0
    variables["ar1_rho"] = pd.to_numeric(variables["ar1_rho"], errors="coerce").fillna(0.0)

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

    # Correlation matrix (v5 behavior: first col are labels)
    if corr.shape[0] < 1 or corr.shape[1] < 2:
        raise SystemExit("[ERROR] Correlation sheet must have a header row and labeled columns.")

    corr = corr.copy()
    corr.columns = [str(c).strip() for c in corr.columns]
    corr = corr.set_index(corr.columns[0])  # first column is variable names (whatever its header)
    try:
        corr = corr.loc[var_names, var_names]
    except KeyError:
        raise SystemExit("[ERROR] Correlation sheet must have rows/cols for all variables in 'Variables'.")

    # To numeric matrix
    corr_matrix = corr.to_numpy(dtype=float)

    # Symmetrize and bound to [-1, 1]
    corr_matrix = (corr_matrix + corr_matrix.T) / 2
    corr_matrix = np.clip(corr_matrix, -1.0, 1.0)

    # Cholesky is computed later (in generate_draws). Here we only return the clipped/symmetrized matrix.
    return periods, mm, disc_map, corr_matrix

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

    # AR(1) params (coerce blanks to 0.0)
    ar_on = _as_bool_series(variables_df["ar1_enabled"]).to_numpy()
    rho_vec = pd.to_numeric(variables_df.get("ar1_rho", 0.0), errors="coerce").fillna(0.0).to_numpy(dtype=float)
    rho_vec = np.where(ar_on, rho_vec, 0.0)
    rho_vec = np.clip(rho_vec, 0.0, 0.9999).astype(float)
    gain_vec = np.sqrt(1.0 - rho_vec ** 2)  # stationary variance 1 for Z
    rho_eff = rho_vec.reshape(1, n_vars)
    gain_eff = gain_vec.reshape(1, n_vars)

    # Precompute dist list (O(1) lookup in the loop)
    dists = variables_df["dist"].astype(str).str.lower().tolist()

    # Generate unit cube draws
    # SOBOL/LHS should pad/cut at the RUN level, not runs*periods.
    # Request 'runs' points in a space of dimension n_periods * n_vars, then reshape.
    U = sample_unit_cube(
        n_requested=runs,
        d=n_periods * n_vars,
        engine=engine,
        seed=seed,
        block_size=block_size,
        exact_n=exact_n
    )
    actual_runs = U.shape[0]
    U = U.reshape(actual_runs, n_periods, n_vars)

    # Map to standard normals E ~ N(0,1)
    E = stats.norm.ppf(U)

    # Correlation via Cholesky (calcolata UNA volta qui)
    L, _ = cholesky_corr(corr_matrix)
    E_corr = E @ L.T  # shape (runs, periods, vars)

    # Optional burn-in for AR(1): spin Z without recording (independent RNG)
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
            dist = dists[j]
            for t, p in enumerate(periods):
                u = U_dep[run_idx, t, j]
                if dist == "uniform":
                    lo, _, hi = mm[(v, p)]
                    # scalar inverse CDF (avoid tiny array allocations)
                    uu = min(max(u, 1e-12), 1 - 1e-12)
                    data[row, t] = lo + (hi - lo) * uu
                elif dist == "triangular":
                    lo, md, hi = mm[(v, p)]
                    uu = min(max(u, 1e-12), 1 - 1e-12)
                    if not (lo <= md <= hi):
                        raise SystemExit(f"[ERROR] Triangular invalid params for ({v}, {p}): lo={lo}, mode={md}, hi={hi}")
                    if hi == lo or abs(hi - lo) < 1e-12:
                        data[row, t] = float(lo)
                    else:
                        c = (md - lo) / (hi - lo)
                        if uu < c:
                            data[row, t] = lo + np.sqrt(uu * (hi - lo) * (md - lo))
                        else:
                            data[row, t] = hi - np.sqrt((1 - uu) * (hi - lo) * (hi - md))
                elif dist == "discrete":
                    vals, probs = disc_map[(v, p)]
                    uu = min(max(u, 1e-12), 1 - 1e-12)
                    cdf = np.cumsum(probs)
                    idx = int(np.searchsorted(cdf, uu, side="right"))
                    if idx >= len(vals): idx = len(vals) - 1
                    data[row, t] = vals[idx]
                else:
                    raise SystemExit(f"[ERROR] Unknown dist '{dist}' for variable '{v}'")
            row += 1

    # Build DataFrame without temporary object dtype
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
    ap.add_argument("--block-size", type=int, default=4096, help="SOBOL block size for padding (no power-of-two required).")
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
    # Block size is now only used for padding; it doesn't need to be a power of two.

    # Validate & prepare
    periods, mm, disc_map, corr_matrix = validate_and_prepare(variables, params, discrete, corr)

    # Validate that every (variable, period) combo has parameters
    missing_cont, missing_disc = [], []
    for _, r in variables.iterrows():
        v = str(r["variable"]).strip()
        dist = str(r["dist"]).strip().lower()
        for p in periods:
            if dist in ("uniform", "triangular"):
                if (v, p) not in mm:
                    missing_cont.append((v, p))
            elif dist == "discrete":
                if (v, p) not in disc_map:
                    missing_disc.append((v, p))
    if missing_cont or missing_disc:
        if missing_cont:
            print("[ERROR] Missing continuous params for:", missing_cont[:10],
                  "..." if len(missing_cont) > 10 else "")
        if missing_disc:
            print("[ERROR] Missing discrete params for:", missing_disc[:10],
                  "..." if len(missing_disc) > 10 else "")
        raise SystemExit("[ERROR] Incomplete parameter coverage. Fix the gaps and retry.")

    # Settings summary (ASCII)
    print("Settings summary:")
    print(f"       - engine={engine}")
    print(f"       - runs={runs} (rows per variable)")
    print(f"       - seed={seed} (reproducible draws)")
    print(f"       - burnin={burnin} (AR(1) warm-up steps)")
    if engine == "SOBOL":
        print(f"       - SOBOL blocks: block_size={block_size}, exact_n={exact_n}")

    # Detect AR usage for tip
    ar_used, max_rho = _detect_ar1_usage(variables)
    if ar_used and burnin <= 0 and max_rho > 0.0:
        print("[TIP] You have AR(1) enabled but burnin is 0. Early periods may be biased. Consider setting --burnin (e.g., 20-100).")

    # Generate
    out, actual_runs = generate_draws(
        variables_df=variables,
        periods=periods,
        mm=mm,
        disc_map=disc_map,
        corr_matrix=corr_matrix,
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
        # (duplicate message removed)

    # Write
    if args.out.lower().endswith(".xlsx"):
        out.to_excel(args.out, sheet_name="Draws", index=False)
    else:
        out.to_csv(args.out, index=False)

    print(f"[OK] Wrote {len(out):,} rows x {len(out.columns):,} cols to {args.out}")

if __name__ == "__main__":
    main()
