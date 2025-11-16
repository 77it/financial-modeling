#!/usr/bin/env python3
"""
mc_draws_copula_v5_fixed.py

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
  python mc_draws_copula_v5_fixed.py --input-excel INPUT.xlsx --out draws.csv \
      --engine SOBOL --runs 20000 --seed 12345 --burnin 0

  SOBOL default (keep whole blocks; 20k => 20,480):
    python mc_draws_copula_v5_fixed.py --input-excel INPUT.xlsx --out draws.csv \
      --engine SOBOL --runs 20000
    # uses block_size=4096 by default, keeps all blocks    

  SOBOL exact 20k (cut down):
    python mc_draws_copula_v5_fixed.py --input-excel INPUT.xlsx --out draws.csv \
      --engine SOBOL --runs 20000 --exact-n

  Change block size (e.g., 8192):
    ... --engine SOBOL --runs 20000 --block-size 8192          # default keep full blocks
    ... --engine SOBOL --runs 20000 --block-size 8192 --exact-n # cut to exact N

  LHS (always exact N, no blocks):
    python mc_draws_copula_v5_fixed.py --input-excel INPUT.xlsx --out draws.csv \
      --engine LHS --runs 20000

Output:
  - Wide, stacked table:
      rows = runs * n_variables
      cols = ['run','variable', period1, ..., periodN]
"""
from __future__ import annotations

import argparse
import math
from typing import Dict, List, Tuple, Iterable, Optional

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import qmc
from datetime import date

# =========================
# Utilities
# =========================

def _as_bool_series(x: pd.Series) -> np.ndarray:
    return x.astype(str).str.strip().str.lower().isin(["true", "1", "yes", "y"]).to_numpy()

def _try_int(s: str) -> Optional[int]:
    try:
        return int(s)
    except Exception:
        return None

def _parse_period_label(raw: object) -> Tuple[Optional[str], Optional[str], Optional[Tuple[int,int,int,str]]]:
    """
    Detect and normalize a period label preserving granularity.

    Returns:
      (normalized_label, granularity, sort_key)

    Granularity is one of:
      'Y'  -> 'YYYY'
      'M'  -> 'YYYY-MM'
      'D'  -> 'YYYY-MM-DD'
      'STR'-> unparsed free string (kept as-is)
    sort_key:
      tuples that allow chronological sorting across Y/M/D; 'STR' go last (lexicographic).
    """
    if pd.isna(raw):
        return None, None, None

    s = str(raw).strip()
    if not s:
        return None, None, None

    # Normalize common separators
    t = s.replace(".", "-").replace("/", "-").replace("_", "-")

    # Year-only: "2025"
    if t.isdigit() and len(t) == 4:
        y = _try_int(t)
        if y is not None and 1900 <= y <= 9999:
            lbl = f"{y:04d}"
            return lbl, "Y", (0, y, 0, 0, "")

    # Year-Month: "2025-1" or "2025-01"
    parts = t.split("-")
    if len(parts) == 2:
        y = _try_int(parts[0]); m = _try_int(parts[1])
        if y is not None and m is not None and 1900 <= y <= 9999 and 1 <= m <= 12:
            lbl = f"{y:04d}-{m:02d}"
            return lbl, "M", (0, y, m, 0, "")

    # Year-Month-Day: "2025-01-31"
    if len(parts) == 3:
        y = _try_int(parts[0]); m = _try_int(parts[1]); d = _try_int(parts[2])
        if y is not None and m is not None and d is not None:
            try:
                date(y, m, d)  # validate
                lbl = f"{y:04d}-{m:02d}-{d:02d}"
                return lbl, "D", (0, y, m, d, "")
            except Exception:
                pass

    # Fallback tries: try to infer Y/M first (common Excel inputs like "Jan-25", "2025 Jan")
    try:
        pY = pd.Period(s, freq="Y")
        lbl = f"{pY.year:04d}"
        return lbl, "Y", (0, pY.year, 0, 0, "")
    except Exception:
        pass
    try:
        pM = pd.Period(s, freq="M")
        lbl = f"{pM.year:04d}-{pM.month:02d}"
        return lbl, "M", (0, pM.year, pM.month, 0, "")
    except Exception:
        pass
    # Last resort: full date parse -> Day
    try:
        dt = pd.to_datetime(s)
        lbl = f"{dt.year:04d}-{dt.month:02d}-{dt.day:02d}"
        return lbl, "D", (0, int(dt.year), int(dt.month), int(dt.day), "")
    except Exception:
        # Unrecognized: keep as free string; will sort after dated labels
        return s, "STR", (1, 9999, 99, 99, s)

def _normalize_period_label(s: object) -> Optional[str]:
    lbl, _, _ = _parse_period_label(s)
    return lbl

def _chronological_periods(period_iter: Iterable[object]) -> List[str]:
    """
    Normalize, de-duplicate, and chronologically sort mixed Y/M/D period labels.
    Unparsed strings are kept and sorted after the dated labels, lexicographically.
    """
    seen = set()
    items: List[Tuple[str, Tuple[int,int,int,str]]] = []
    for raw in period_iter:
        lbl, _, key = _parse_period_label(raw)
        if lbl is None or key is None:
            continue
        if lbl not in seen:
            seen.add(lbl)
            items.append((lbl, key))
    items.sort(key=lambda x: x[1])
    return [lbl for (lbl, _) in items]


# =========================
# Explanatory helpers
# =========================

def _summarize_parameters_when_no_cli(engine: str, runs: int, seed: int, burnin: int, block_size: int, exact_n: bool) -> None:
    """
    Print a concise explanation of defaults & effects when no CLI overrides are supplied.
    """
    print("[INFO] Parameter explanation (no CLI overrides detected):")
    print(f"       - engine={engine}:")
    print("         - SOBOL: quasi-random, good space-filling. By default generated in blocks.")
    print("         - LHS  : Latin Hypercube, exactly N points, no blocks.")
    print(f"       - runs={runs}: number of Monte Carlo scenarios (rows per variable).")
    print(f"       - seed={seed}: reproducibility. Same seed => same draws.")
    print(f"       - burnin={burnin}: AR(1) warm-up steps discarded before period 1.")
    print("         - If AR(1) is enabled (rho>0), a positive burn-in reduces initial bias.")
    if engine.upper() == "SOBOL":
        print(f"       - SOBOL blocks: block_size={block_size}, exact_n={exact_n}")
        print("         - Without --exact-n we KEEP whole blocks (effective runs may be > requested).")
        print("         - With    --exact-n we CUT to exactly N.")

def _detect_ar1_usage(variables_df: pd.DataFrame) -> tuple[bool, float]:
    """
    Return (any_ar1_enabled, max_rho_among_enabled).
    """
    if variables_df.empty:
        return False, 0.0
    dist = variables_df.get("dist", pd.Series([], dtype=object)).astype(str).str.lower()
    ar_on = _as_bool_series(variables_df.get("ar1_enabled", pd.Series([], dtype=object)))
    rho = variables_df.get("ar1_rho", 0.0)
    try:
        rho = pd.to_numeric(rho, errors="coerce").fillna(0.0)
    except Exception:
        rho = pd.Series([0.0] * len(variables_df))
    mask = dist.isin(["triangular", "uniform", "discrete"]) & ar_on & (rho > 0)
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
    eps = 1e-10
    if abs(hi - lo) < eps:
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
        
        # Use single Sobol sampler to maintain low-discrepancy properties
        sampler = qmc.Sobol(d=d, scramble=True, seed=seed)
        m_block = int(np.log2(block_size))
        n_blocks = int(np.ceil(n_requested / block_size))
        
        # Generate all blocks at once
        total_samples = n_blocks * block_size
        m_total = int(np.log2(total_samples))
        U = sampler.random_base2(m=m_total)

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
    # Check for empty variables
    if variables.empty:
        raise SystemExit("[ERROR] Variables sheet is empty")
    
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
    params["month"] = params["month"].apply(_normalize_period_label)

    # Discrete optional
    if not discrete.empty:
        for col in ["variable", "month", "value", "prob"]:
            if col not in discrete.columns:
                raise SystemExit(f"[ERROR] Discrete sheet missing column '{col}'")
        discrete["variable"] = discrete["variable"].astype(str).str.strip()
        discrete["month"] = discrete["month"].apply(_normalize_period_label)

    # Build period universe = union(Params.month U Discrete.month)
    periods_params = params["month"].dropna().tolist()
    periods_discr = discrete["month"].dropna().tolist() if not discrete.empty else []
    periods = _chronological_periods(periods_params + periods_discr)
    if not periods:
        raise SystemExit("[ERROR] Could not derive any period labels from Params/Discrete.")

    # Build maps
    key_params = list(zip(params["variable"], params["month"]))
    mm: Dict[Tuple[str, str], Tuple[float, float, float]] = {}

    # Track which variables are triangular to apply mode checks only where needed
    var_is_tri = {
        str(row["variable"]).strip(): str(row["dist"]).strip().lower() == "triangular"
        for _, row in variables.iterrows()
    }

    # Collect triangular warnings to report once
    tri_warnings = []  # list of (variable, period, min, mode_in, max, fix, mode_out)

    for (v, p), (lo, md, hi) in zip(key_params, zip(params["min"], params["mode"], params["max"])):
        # Type checks
        try:
            lo_f = float(lo)
            hi_f = float(hi)
            md_in = md  # keep original for messages
            md_f = float(md) if not pd.isna(md) else float("nan")
        except Exception:
            raise SystemExit(f"[ERROR] Non-numeric min/mode/max for ({v}, {p}).")

        if var_is_tri.get(str(v), False):
            # Validate / fix triangular mode
            if math.isnan(md_f):
                md_out = (lo_f + hi_f) / 2.0
                tri_warnings.append((v, p, lo_f, md_in, hi_f, "mode missing -> using midpoint", md_out))
                md_f = md_out
            if md_f < lo_f:
                tri_warnings.append((v, p, lo_f, md_in, hi_f, "mode < min -> clamped to min", lo_f))
                md_f = lo_f
            if md_f > hi_f:
                tri_warnings.append((v, p, lo_f, md_in, hi_f, "mode > max -> clamped to max", hi_f))
                md_f = hi_f
            if hi_f < lo_f:
                raise SystemExit(f"[ERROR] Triangular params invalid for ({v}, {p}): min={lo_f} > max={hi_f}.")
        mm[(v, p)] = (lo_f, md_f, hi_f)

    if tri_warnings:
        print(f"[WARN] Triangular parameter issues found and auto-corrected ({len(tri_warnings)} case(s)):")
        for (v, p, lo_f, md_in, hi_f, fix, md_out) in tri_warnings[:10]:
            print(f"       ({v}, {p}): min={lo_f}, mode={md_in}, max={hi_f} -> {fix}; mode_used={md_out}")
        if len(tri_warnings) > 10:
            print(f"       ... and {len(tri_warnings) - 10} more.")

    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]] = {}
    if not discrete.empty:
        g = discrete.groupby(["variable", "month"], sort=False)
        for (v, p), df in g:
            vals = pd.to_numeric(df["value"], errors="coerce").to_numpy()
            probs = pd.to_numeric(df["prob"], errors="coerce").to_numpy()
            if np.isnan(vals).any() or np.isnan(probs).any():
                raise SystemExit(f"[ERROR] Non-numeric value/prob in Discrete for ({v}, {p}).")
            s = probs.sum()
            if not np.isfinite(s) or abs(s - 1.0) > 1e-6:
                raise SystemExit(f"[ERROR] Discrete probs for ({v}, {p}) must sum to 1; got {s:.6f}")
            disc_map[(v, p)] = (vals, probs)

    # Coverage validator
    missing = []
    for v, dist in zip(variables["variable"], variables["dist"]):
        for p in periods:
            if dist in ("triangular", "uniform"):
                if (v, p) not in mm:
                    missing.append((v, p, dist, "Params"))
            elif dist == "discrete":
                if (v, p) not in disc_map:
                    missing.append((v, p, dist, "Discrete"))
    if missing:
        dfm = pd.DataFrame(missing, columns=["variable", "period", "dist", "sheet_needed"])
        raise SystemExit("[ERROR] Missing distribution parameters for these (variable, period):\n"
                         + dfm.to_string(index=False))

    # Info about AR(1) on discrete variables (unchanged)
    has_discrete = any(variables["dist"].eq("discrete"))
    if has_discrete:
        ar_on = variables["dist"].eq("discrete") & _as_bool_series(variables["ar1_enabled"])
        if ar_on.any():
            names = ", ".join(variables.loc[ar_on, "variable"].astype(str).tolist())
            print(f"[INFO] AR(1) is enabled for discrete variable(s): {names}. "
                  f"Effect: persistence of categories over time. "
                  f"Marginals per period remain exactly as declared.")

    # Correlation matrix alignment
    corr = corr.copy()
    corr.columns = [str(c).strip() for c in corr.columns]
    corr = corr.set_index(corr.columns[0])
    try:
        corr = corr.loc[var_names, var_names]
    except KeyError:
        raise SystemExit("[ERROR] Correlation sheet must have rows/cols for all variables in 'Variables'.")

    if not np.allclose(np.diag(corr.to_numpy()), 1.0, atol=1e-8):
        raise SystemExit("[ERROR] Correlation diagonal must be 1.0 for all variables.")

    return periods, mm, disc_map, corr.to_numpy(dtype=float)

# =========================
# Core generation
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
        print(f"[WARN] Correlation adjusted to nearest-PD; max |delta| = {max_delta:.3e}")

    # Base uniforms for innovations E (runs, periods, vars)
    U_flat = sample_unit_cube(
        n_requested=runs,
        d=n_periods * n_vars,
        engine=engine,
        seed=seed,
        block_size=block_size,
        exact_n=exact_n,
    )
    actual_runs = U_flat.shape[0]
    U = U_flat.reshape(actual_runs, n_periods, n_vars)
    E = stats.norm.ppf(U)

    # Impose same-period cross-variable correlation: E_corr = E @ L.T
    E_corr = E @ L.T  # shape (runs, periods, vars)

    # Optional burn-in for AR(1): spin Z without recording
    if burnin and burnin > 0:
        Z_b = np.zeros((actual_runs, n_vars), dtype=float)
        for b_iter in range(int(burnin)):
            # Use different seed for each burn-in iteration while maintaining reproducibility
            U_b = sample_unit_cube(actual_runs, n_vars, engine, seed + 999000 + b_iter, block_size, exact_n)
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

    # Map to marginals - pre-allocate with correct dtypes
    data = np.empty((actual_runs * n_vars, n_periods), dtype=float)
    out_run = np.empty(actual_runs * n_vars, dtype=int)
    out_var = np.empty(actual_runs * n_vars, dtype=object)

    row = 0
    for r in range(actual_runs):
        for j, (v, dist) in enumerate(zip(var_names, dists)):
            out_run[row] = r + 1
            out_var[row] = v
            for t, p in enumerate(periods):
                u = U_dep[r, t, j]
                if dist == "uniform":
                    lo, _, hi = mm[(v, p)]
                    data[row, t] = invcdf_uniform(u, float(lo), float(hi))
                elif dist == "triangular":
                    lo, md, hi = mm[(v, p)]
                    data[row, t] = invcdf_triangular(u, float(lo), float(md), float(hi))
                elif dist == "discrete":
                    vals, probs = disc_map[(v, p)]
                    data[row, t] = invcdf_discrete(np.array([u]), vals, probs)[0]
                else:
                    raise SystemExit(f"[ERROR] Unknown dist '{dist}' for variable '{v}'")
            row += 1

    # Build DataFrame efficiently with correct dtypes
    columns = ["run", "variable"] + periods
    df_dict = {"run": out_run, "variable": out_var}
    for i, p in enumerate(periods):
        df_dict[p] = data[:, i]
    
    out = pd.DataFrame(df_dict)
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

    print(f"[INFO] engine={engine} runs={runs} seed={seed} burnin={args.burnin}"
          f" block_size={args.block_size} exact_n={args.exact_n}")
    no_cli_overrides = (
        args.engine is None and args.runs is None and args.seed is None and
        args.burnin == 0 and not args.exact_n and args.block_size == 4096
    )
    if no_cli_overrides:
        print("[INFO] No CLI overrides: using values from 'Settings' sheet (or defaults).")
        if engine == "SOBOL" and not args.exact_n:
            print("[TIP] SOBOL generates samples in blocks of 4096 by default. "
                  "Effective runs may be padded up to the next multiple. "
                  "Use --exact-n to cut to exactly N, or --block-size to change the block size.")

        # Extra explanation so users understand what each parameter does
        _summarize_parameters_when_no_cli(
            engine=engine,
            runs=runs,
            seed=seed,
            burnin=args.burnin,
            block_size=args.block_size,
            exact_n=args.exact_n,
        )

    # Warn if AR(1) is enabled but burnin=0 (risk of biased early periods)
    any_ar1, max_rho = _detect_ar1_usage(variables)
    if any_ar1 and args.burnin == 0:
        print(f"[TIP] AR(1) detected (max rho={max_rho:.2f}) but burn-in=0. "
              "Early periods may be biased. Consider setting --burnin (e.g., 20-100).")

    # Validate & prepare
    periods, mm, disc_map, corr = validate_and_prepare(variables, params, discrete, corr_df)

    # Generate
    out, effective_runs = generate_draws(
        variables_df=variables,
        periods=periods,
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

    if effective_runs != runs:
        print(f"[INFO] Effective runs = {effective_runs} (requested {runs}).")
        if engine == "SOBOL" and not args.exact_n:
            print(f"[TIP] Padded to a multiple of {args.block_size} due to SOBOL blocks. "
                  f"Use --exact-n to cut to exactly {runs} or change --block-size.")

    # Write
    if args.out.lower().endswith(".xlsx"):
        out.to_excel(args.out, sheet_name="Draws", index=False)
    else:
        out.to_csv(args.out, index=False)

    print(f"[OK] Wrote {len(out):,} rows * {len(out.columns):,} cols to {args.out}")

if __name__ == "__main__":
    main()