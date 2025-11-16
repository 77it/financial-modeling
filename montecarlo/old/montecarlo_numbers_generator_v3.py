#!/usr/bin/env python3
"""
mc_draws_copula_v2.py

Monte Carlo draw generator with:
  - Per-variable monthly marginals (triangular, uniform, discrete).
  - Cross-variable dependence via Gaussian copula (Cholesky).
  - Optional AR(1) per variable (serial correlation).
  - Robust input validation and month handling.

Key improvements vs v1:
  • Months = union(Params, Discrete), normalized and chronologically sorted (YYYY-MM).
  • Validator checks coverage for every (variable, month) according to its dist.
  • Correlation matrix: symmetry/diag checks, nearest-PD projection with max|Δ| warning.
  • Optional AR(1) burn-in (for closer-to-stationary starts).
  • Minor performance/clarity tweaks.

Sheets expected in INPUT.xlsx:
  - Variables:  variable | dist | ar1_enabled | ar1_rho
  - Params:     variable | month | min | mode | max       (for triangular/uniform)
  - Discrete:   variable | month | value | prob           (for discrete)
  - Correlation: square matrix with header row+col labeling variables (same order as Variables)
  - Settings:   key | value     (e.g., runs, engine, seed)

CLI:
  python mc_draws_copula_v2.py --input-excel INPUT.xlsx --out draws.csv \
      --engine SOBOL --runs 20000 --seed 12345 --burnin 0

  SOBOL default (keep whole blocks; 20k ⇒ 20,480):
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


Output:
  - Wide, stacked table:
      rows = runs × n_variables
      cols = ['run','variable', month1, ..., monthN]
"""
from __future__ import annotations

import argparse
import math
from typing import Dict, List, Tuple, Iterable

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import qmc


# =========================
# Utilities
# =========================

def _as_bool_series(x: pd.Series) -> np.ndarray:
    return x.astype(str).str.strip().str.lower().isin(["true", "1", "yes", "y"]).to_numpy()


def _normalize_month_label(s: str) -> str:
    """
    Normalize a month label to 'YYYY-MM'.
    Accepts strings like '2025-1', '2025-01', '2025/01', or Excel datetimes/periods.
    """
    if pd.isna(s):
        return None  # caller will handle
    # Try datetime-like first
    try:
        dt = pd.to_datetime(s)
        return f"{dt.year:04d}-{dt.month:02d}"
    except Exception:
        pass
    t = str(s).strip()
    t = t.replace("/", "-")
    parts = t.split("-")
    if len(parts) >= 2:
        try:
            y = int(parts[0])
            m = int(parts[1])
            if 1 <= m <= 12 and 1900 <= y <= 9999:
                return f"{y:04d}-{m:02d}"
        except Exception:
            pass
    # last resort: try pandas Period
    try:
        p = pd.Period(str(s), freq="M")
        return f"{p.year:04d}-{p.month:02d}"
    except Exception:
        return str(s)


def _chronological_months(month_iter: Iterable[str]) -> List[str]:
    # Normalize and de-duplicate while preserving insertion order (no pandas)
    normed = [_normalize_month_label(x) for x in month_iter if x is not None]
    seen = set()
    uniq = []
    for mm in normed:
        if mm not in seen:
            seen.add(mm)
            uniq.append(mm)
    # sort by (year, month) if possible; fall back to lexical consistent with YYYY-MM
    def key(mm: str):
        try:
            y, m = mm.split("-")
            return (int(y), int(m))
        except Exception:
            return (9999, 99, mm)
    return sorted(uniq, key=key)


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
    if hi == lo:
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
    # values/probs already filtered per (variable, month). probs sum to 1.
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
    Project symmetric A to nearest positive definite matrix (Higham).
    Returns a correlation-like matrix with unit diagonal.
    """
    B = (A + A.T) / 2.0
    vals, vecs = np.linalg.eigh(B)
    vals[vals < eps] = eps
    Apd = vecs @ np.diag(vals) @ vecs.T
    # Normalize to unit diagonal
    d = np.diag(Apd).copy()
    d[d <= 0] = eps
    Dinv = np.diag(1.0 / np.sqrt(d))
    C = Dinv @ Apd @ Dinv
    np.fill_diagonal(C, 1.0)
    return C


def cholesky_corr(corr: np.ndarray) -> Tuple[np.ndarray, float]:
    """
    Ensure correlation-like matrix (sym, unit diag, PD). Return (L, max_delta)
    where L is Cholesky lower and max_delta is the max absolute change applied.
    """
    C = corr.copy().astype(float)
    # enforce symmetry & unit diag
    C = (C + C.T) / 2.0
    np.fill_diagonal(C, 1.0)

    max_delta = 0.0
    try:
        L = np.linalg.cholesky(C)
        return L, max_delta
    except np.linalg.LinAlgError:
        C_pd = nearest_pd(C)
        max_delta = float(np.max(np.abs(C_pd - C)))
        L = np.linalg.cholesky(C_pd)
        return L, max_delta


# =========================
# Sampling engines
# =========================

def _is_power_of_two(x: int) -> bool:
    return x > 0 and (x & (x - 1)) == 0

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
        parts = []
        for b in range(n_blocks):
            # independent scrambles via different seeds
            sampler_b = qmc.Sobol(d=d, scramble=True, seed=seed + b)
            parts.append(sampler_b.random_base2(m=m_block))  # (block_size, d)
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
    missing = must - set(xls.sheet_names)
    if missing:
        raise SystemExit(f"[ERROR] Missing sheets: {', '.join(sorted(missing))}")

    variables = pd.read_excel(xlsx_path, sheet_name="Variables")
    params = pd.read_excel(xlsx_path, sheet_name="Params")
    corr = pd.read_excel(xlsx_path, sheet_name="Correlation")
    settings = pd.read_excel(xlsx_path, sheet_name="Settings")
    discrete = pd.read_excel(xlsx_path, sheet_name="Discrete") if "Discrete" in xls.sheet_names else pd.DataFrame()

    # Normalize column names
    for df in (variables, params, discrete, corr, settings):
        df.columns = [str(c).strip() for c in df.columns]

    settings_dict = {str(k).strip().lower(): str(v).strip() for k, v in zip(settings["key"], settings["value"])}

    return variables, params, discrete, corr, settings_dict


# =========================
# Validation
# =========================

def validate_and_prepare(
    variables: pd.DataFrame, params: pd.DataFrame, discrete: pd.DataFrame, corr: pd.DataFrame
) -> Tuple[List[str], Dict[Tuple[str, str], Tuple[float, float, float]], Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]], np.ndarray]:
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
        bad_rows = variables.loc[bad, ["variable", "dist"]]
        raise SystemExit(f"[ERROR] Unknown dist in Variables:\n{bad_rows.to_string(index=False)}")

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
    params["month"] = params["month"].apply(_normalize_month_label)

    # Discrete optional
    if not discrete.empty:
        for col in ["variable", "month", "value", "prob"]:
            if col not in discrete.columns:
                raise SystemExit(f"[ERROR] Discrete sheet missing column '{col}'")
        discrete["variable"] = discrete["variable"].astype(str).str.strip()
        discrete["month"] = discrete["month"].apply(_normalize_month_label)

    # Build month universe = union(Params.month ∪ Discrete.month)
    months_params = params["month"].dropna().tolist()
    months_discr = discrete["month"].dropna().tolist() if not discrete.empty else []
    months = _chronological_months(months_params + months_discr)
    if not months:
        raise SystemExit("[ERROR] Could not derive any month labels from Params/Discrete.")

    # Build maps
    key_params = list(zip(params["variable"], params["month"]))
    mm: Dict[Tuple[str, str], Tuple[float, float, float]] = {}

    # Track which variables are triangular to apply mode checks only where needed
    var_is_tri = {
        str(row["variable"]).strip(): str(row["dist"]).strip().lower() == "triangular"
        for _, row in variables.iterrows()
    }

    # Collect triangular warnings to report once
    tri_warnings = []  # list of (variable, month, min, mode_in, max, fix, mode_out)

    for (v, m), (lo, md, hi) in zip(key_params, zip(params["min"], params["mode"], params["max"])):
        # Type checks
        try:
            lo_f = float(lo)
            hi_f = float(hi)
            md_in = md  # keep original for messages
            md_f = float(md) if not pd.isna(md) else float("nan")
        except Exception:
            raise SystemExit(f"[ERROR] Non-numeric min/mode/max for ({v}, {m}).")

        if var_is_tri.get(str(v), False):
            # Validate / fix triangular mode
            if math.isnan(md_f):
                # No mode provided: default to midpoint with warning
                md_out = (lo_f + hi_f) / 2.0
                tri_warnings.append((v, m, lo_f, md_in, hi_f, "mode missing → using midpoint", md_out))
                md_f = md_out
            if md_f < lo_f:
                tri_warnings.append((v, m, lo_f, md_in, hi_f, "mode < min → clamped to min", lo_f))
                md_f = lo_f
            if md_f > hi_f:
                tri_warnings.append((v, m, lo_f, md_in, hi_f, "mode > max → clamped to max", hi_f))
                md_f = hi_f
            # Optional: enforce lo <= hi; if not, bail early
            if hi_f < lo_f:
                raise SystemExit(f"[ERROR] Triangular params invalid for ({v}, {m}): min={lo_f} > max={hi_f}.")
        # Store final tuple (lo, mode, hi)
        mm[(v, m)] = (lo_f, md_f, hi_f)

    # Print triangular warnings once (non-fatal). To make fatal, replace print with raise and aggregate.
    if tri_warnings:
        print(f"[WARN] Triangular parameter issues found and auto-corrected ({len(tri_warnings)} case(s)):")
        # Show up to first 10 for brevity
        for (v, m, lo_f, md_in, hi_f, fix, md_out) in tri_warnings[:10]:
            print(f"       ({v}, {m}): min={lo_f}, mode={md_in}, max={hi_f} → {fix}; mode_used={md_out}")
        if len(tri_warnings) > 10:
            print(f"       ... and {len(tri_warnings) - 10} more.")

    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]] = {}
    if not discrete.empty:
        g = discrete.groupby(["variable", "month"], sort=False)
        for (v, m), df in g:
            vals = pd.to_numeric(df["value"], errors="coerce").to_numpy()
            probs = pd.to_numeric(df["prob"], errors="coerce").to_numpy()
            if np.isnan(vals).any() or np.isnan(probs).any():
                raise SystemExit(f"[ERROR] Non-numeric value/prob in Discrete for ({v}, {m}).")
            s = probs.sum()
            if not np.isfinite(s) or abs(s - 1.0) > 1e-6:
                raise SystemExit(f"[ERROR] Discrete probs for ({v}, {m}) must sum to 1; got {s:.6f}")
            disc_map[(v, m)] = (vals, probs)

    # Coverage validator
    missing = []
    for v, dist in zip(variables["variable"], variables["dist"]):
        for m in months:
            if dist in ("triangular", "uniform"):
                if (v, m) not in mm:
                    missing.append((v, m, dist, "Params"))
            elif dist == "discrete":
                if (v, m) not in disc_map:
                    missing.append((v, m, dist, "Discrete"))
    if missing:
        dfm = pd.DataFrame(missing, columns=["variable", "month", "dist", "sheet_needed"])
        raise SystemExit("[ERROR] Missing distribution parameters for these (variable, month):\n"
                         + dfm.to_string(index=False))

    # Informational note about AR(1) on discrete variables
    # (kept ON if user set ar1_enabled=TRUE; this is purely a user-facing reminder)
    has_discrete = any(variables["dist"].eq("discrete"))
    if has_discrete:
        # Which discrete variables have AR enabled?
        ar_on = variables["dist"].eq("discrete") & _as_bool_series(variables["ar1_enabled"])
        if ar_on.any():
            names = ", ".join(variables.loc[ar_on, "variable"].astype(str).tolist())
            print(f"[INFO] AR(1) is enabled for discrete variable(s): {names}. "
                  f"Effect: persistence of categories over months (e.g., staying longer in the same bucket). "
                  f"Marginals per month remain exactly as declared.")

    # Correlation matrix alignment
    # corr has a label column in col[0]
    corr = corr.copy()
    corr.columns = [str(c).strip() for c in corr.columns]
    if corr.shape[0] + 1 != corr.shape[1]:
        # Expect a square with header row/col; allow both styles: first col is names
        pass
    corr = corr.set_index(corr.columns[0])
    # Reindex to variables order
    try:
        corr = corr.loc[var_names, var_names]
    except KeyError:
        raise SystemExit("[ERROR] Correlation sheet must have rows/cols for all variables in 'Variables', "
                         "in any order (will be realigned).")

    # Basic checks
    if not np.allclose(np.diag(corr.to_numpy()), 1.0, atol=1e-8):
        raise SystemExit("[ERROR] Correlation diagonal must be 1.0 for all variables.")

    return months, mm, disc_map, corr.to_numpy(dtype=float)


# =========================
# Core generation
# =========================

def generate_draws(
    variables_df: pd.DataFrame,
    months: List[str],
    mm: Dict[Tuple[str, str], Tuple[float, float, float]],
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]],
    corr_matrix: np.ndarray,
    runs: int,
    engine: str,
    seed: int,
    burnin: int = 0,
    block_size: int = 4096,
    exact_n: bool = False,    
) -> pd.DataFrame:
    var_names = variables_df["variable"].astype(str).tolist()
    n_vars = len(var_names)
    n_months = len(months)

    # Dist map & AR(1)
    dists = variables_df["dist"].astype(str).str.lower().tolist()
    ar1_on = _as_bool_series(variables_df["ar1_enabled"])
    ar1_rho = variables_df.get("ar1_rho", 0.0).fillna(0.0).to_numpy(dtype=float)
    ar1_rho = np.clip(ar1_rho, 0.0, 0.98)
    rho_eff = np.where(ar1_on, ar1_rho, 0.0)
    gain_eff = np.where(ar1_on, np.sqrt(1.0 - rho_eff * rho_eff), 1.0)

    # Correlation -> Cholesky
    L, max_delta = cholesky_corr(corr_matrix)
    if max_delta > 1e-8:
        print(f"[WARN] Correlation adjusted to nearest-PD; max |Δ| = {max_delta:.3e}")

    # Base uniforms for innovations E (runs, months, vars)
    U_flat = sample_unit_cube(
        n_requested=runs,
        d=n_months * n_vars,
        engine=engine,
        seed=seed,
        block_size=block_size,
        exact_n=exact_n,
    )
    actual_runs = U_flat.shape[0]
    U = U_flat.reshape(actual_runs, n_months, n_vars)    
    E = stats.norm.ppf(U)

    # Impose same-month cross-variable correlation: E_corr = E @ L.T
    E_corr = E @ L.T  # shape (runs, months, vars)

    # Optional burn-in for AR(1): spin Z without recording, to reach stationarity faster
    if burnin and burnin > 0:
        Z_b = np.zeros((runs, n_vars), dtype=float)
        for _ in range(int(burnin)):
            # fresh innovations for burn-in, same correlation structure
            U_b = sample_unit_cube(runs, n_vars, engine, seed + 123456)  # deterministic offset
            E_b = stats.norm.ppf(U_b) @ L.T  # (runs, vars)
            Z_b = rho_eff * Z_b + gain_eff * E_b  # broadcast (runs, vars)
        Z0 = Z_b
    else:
        Z0 = E_corr[:, 0, :]  # unbiased, non-stationary start acceptable for most use-cases

    # Build Z over months with AR(1)
    Z = np.empty_like(E_corr)
    Z[:, 0, :] = Z0
    for t in range(1, n_months):
        Z[:, t, :] = rho_eff * Z[:, t - 1, :] + gain_eff * E_corr[:, t, :]

    # Back to uniforms with dependence
    U_dep = stats.norm.cdf(Z)

    # Map to marginals
    data = np.empty((runs * n_vars, n_months), dtype=float)
    out_run = np.empty(runs * n_vars, dtype=int)
    out_var = np.empty(runs * n_vars, dtype=object)

    row = 0
    for r in range(runs):
        for j, (v, dist) in enumerate(zip(var_names, dists)):
            out_run[row] = r + 1
            out_var[row] = v
            for t, m in enumerate(months):
                u = U_dep[r, t, j]
                if dist == "uniform":
                    lo, _, hi = mm[(v, m)]
                    data[row, t] = invcdf_uniform(u, float(lo), float(hi))
                elif dist == "triangular":
                    lo, md, hi = mm[(v, m)]
                    data[row, t] = invcdf_triangular(u, float(lo), float(md), float(hi))
                elif dist == "discrete":
                    vals, probs = disc_map[(v, m)]
                    data[row, t] = invcdf_discrete(np.array([u]), vals, probs)[0]
                else:
                    raise SystemExit(f"[ERROR] Unknown dist '{dist}' for variable '{v}'")
            row += 1

    columns = ["run", "variable"] + months
    out = pd.DataFrame(np.column_stack([out_run, out_var, data]), columns=columns)
    out["run"] = out["run"].astype(int)
    for m in months:
        out[m] = pd.to_numeric(out[m], errors="coerce")
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
    ap.add_argument("--burnin", type=int, default=0, help="AR(1) burn-in steps (optional)")
    ap.add_argument("--block-size", type=int, default=4096,
                    help="SOBOL block size (power of two). Default: 4096")
    ap.add_argument("--exact-n", action="store_true",
                    help="SOBOL only: keep exactly the requested N (cut down the last block).")    
    args = ap.parse_args()

    variables, params, discrete, corr_df, settings = read_inputs(args.input_excel)

    # Resolve settings with CLI overrides
    engine = (args.engine or settings.get("engine", "SOBOL")).upper()
    runs = int(args.runs or settings.get("runs", "20000"))
    seed = int(args.seed or settings.get("seed", "12345"))

    print(f"[INFO] engine={engine} runs={runs} seed={seed} burnin={args.burnin} "
          f"block_size={args.block_size} exact_n={args.exact_n}")    

    # Validate & prepare
    months, mm, disc_map, corr = validate_and_prepare(variables, params, discrete, corr_df)

    # Generate
    out, effective_runs = generate_draws(
        variables_df=variables,
        months=months,
        mm=mm,
        disc_map=disc_map,
        corr_matrix=corr,
        runs=runs,
        engine=engine,
        seed=seed,
        burnin=args.burnin,
        block_size=args.block_size,
        exact_n=args.exact_n,        
    )

    # Log effective runs if Sobol blocks padded/cut the sample
    if effective_runs != runs:
        print(f"[INFO] Effective runs = {effective_runs} (requested {runs}).")

    # Write
    if args.out.lower().endswith(".xlsx"):
        out.to_excel(args.out, sheet_name="Draws", index=False)
    else:
        out.to_csv(args.out, index=False)

    print(f"[OK] Wrote {len(out):,} rows × {len(out.columns):,} cols to {args.out}")


if __name__ == "__main__":
    main()
