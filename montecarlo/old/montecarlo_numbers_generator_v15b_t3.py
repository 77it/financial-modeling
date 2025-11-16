#!/usr/bin/env python3
"""
montecarlo_numbers_generator_v12.py

Monte Carlo draw generator with:
  - Per-variable period marginals (triangular, uniform, discrete).
  - Cross-variable dependence via Gaussian copula (Cholesky).
  - Optional AR(1) per variable (serial correlation).
  - Robust period handling (supports Year / Year-Month / Year-Month-Day).

Notes:
  - SOBOL uses a single sampler and pads/cuts to block multiples without requiring power-of-two totals.
  - Burn-in uses an independent RNG stream so it does not consume the main sequence.
  - Logs are ASCII-only.

Output:
  - The first deterministic rows are special runs with run labels:
      run = "base", then "best", then "worst"  (3 blocks × all variables)
    followed by all stochastic runs:
      run = 1, 2, 3, ..., (random runs)
"""
from __future__ import annotations

import argparse
from typing import Dict, List, Tuple, Optional
import json

import numpy as np
import pandas as pd
from scipy import stats
from scipy.linalg import cholesky as scipy_cholesky, eigh
from scipy.linalg import LinAlgError
from scipy.stats import qmc
from datetime import datetime

# =========================
# Template / Engine constants (EDITABLE)
# =========================
# Sheet names (strict new template)
SHEET_DRV: str            = "DRV"
SHEET_DRV_TRI: str        = "DRV-triangular"
SHEET_DRV_DISC: str       = "DRV-discrete"
SHEET_CORR: str           = "Correlation"
SHEET_SETTINGS: str       = "Settings"

# DRV columns
COL_VARIABLE: str         = "variable"
COL_DIST: str             = "dist"
COL_AR1_ENABLED: str      = "ar1_enabled"
COL_AR1_RHO: str          = "ar1_rho"

# DRV-triangular columns (best/mode/worst; "step" can exist but is ignored)
COL_MONTH: str            = "month"
COL_BEST: str             = "best"     # acts as min/lo
COL_MODE: str             = "base"     # mode
COL_WORST: str            = "worst"    # acts as max/hi
COL_STEP_IGNORED: str     = "step"     # optional; ignored

# DRV-discrete columns
COL_DISC_VALUE: str       = "value"
COL_DISC_PROB: str        = "prob"

# Settings sheet key/value (keys are free-form, we use these)
SET_KEY: str              = "key"
SET_VALUE: str            = "value"

# Engine string values
ENGINE_SOBOL: str         = "SOBOL"
ENGINE_LHS: str           = "LHS"

# =========================
# Tolerances & policy constants (EDITABLE)
# =========================
# Numeric stability for uniforms (avoid 0/1 hitting inverse CDF infinities)
U_EPS: float = 1e-12

# Degenerate interval threshold for triangular/uniform (treat as constant)
TOL_DEGENERATE_WIDTH: float = 1e-12

# Discrete probabilities must sum to 1 within this tolerance
TOL_PROB_SUM: float = 1e-10

# Allowable tolerance for correlation asymmetry (matrix treated as symmetric)
# If ANY |ρij - ρji| > TOL_ASYMM → ERROR (fail fast).
# If ALL |ρij - ρji| ≤ TOL_ASYMM → silently average (resilient to Excel rounding).
TOL_ASYMM: float = 1e-10

# Notify when clipping correlations to [-1, 1] caused changes above this
TOL_CLIP_NOTIFY: float = 1e-12

# Notify when forcing diagonal to 1.0 changed entries by more than this
TOL_DIAG_NOTIFY: float = 1e-6

# When Cholesky required a nearest-PD projection, notify above this max delta
TOL_CHOL_NOTIFY: float = 1e-8

# Floor for eigenvalues in nearest-PD projection
PSD_EPS: float = 1e-10

# Allowable tolerance for mode proximity to [min, max]
TOL_MODE_RANGE: float = 1e-6

# =========================
# Defaults & UI / logging knobs (EDITABLE)
# =========================
# Default engine and simulation knobs
DEFAULT_ENGINE: str = ENGINE_SOBOL
DEFAULT_RUNS: int = 20000
DEFAULT_SEED: int = 12345
DEFAULT_BURNIN: int = 0
DEFAULT_EXACT_N: bool = False

# How many example rows/pairs to show in TIP/ERROR messages
TIP_SAMPLE_COUNT: int = 10

# Default Sobol block size used when the user doesn't override it
DEFAULT_BLOCK_SIZE: int = 4096

# Max absolute AR(1) rho we allow (to avoid near-singular behavior)
MAX_AR1_ABS_RHO: float = 0.9999


# =========================
# Helpers
# =========================

def _as_bool_series(s) -> pd.Series:
    if s.dtype == bool:
        return s
    return s.astype(str).str.strip().str.lower().isin(["1", "true", "yes", "y", "on"])

def _try_int(s: str) -> Optional[int]:
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
    print(f"[TIP] SOBOL generates samples in blocks of {DEFAULT_BLOCK_SIZE} by default. Effective runs may be padded up to the next multiple. Use --exact-n to cut to exactly N, or --block-size to change the block size.")


def _detect_ar1_usage(variables_df: pd.DataFrame) -> Tuple[bool, float]:
    ar_on = _as_bool_series(variables_df[COL_AR1_ENABLED])
    rho = pd.to_numeric(variables_df.get(COL_AR1_RHO, 0.0), errors="coerce").fillna(0.0)
    mask = (~variables_df[COL_DIST].str.lower().eq("discrete")) & ar_on & (rho > 0)
    if mask.any():
        return True, float(rho[mask].max())
    return False, 0.0

# =========================
# Inverse CDFs
# =========================

def invcdf_uniform(u: np.ndarray, lo: float, hi: float) -> np.ndarray:
    u = np.clip(u, U_EPS, 1 - U_EPS)
    return lo + (hi - lo) * u

# Vectorized form (lo/hi can be arrays)
def invcdf_uniform_vec(u: np.ndarray, lo: np.ndarray, hi: np.ndarray) -> np.ndarray:
    u = np.clip(u, U_EPS, 1 - U_EPS)
    return lo + (hi - lo) * u

def invcdf_triangular(u: np.ndarray, lo: float, mode: float, hi: float) -> np.ndarray:
    # Guarantees [lo, hi]; requires lo <= mode <= hi
    if not (lo <= mode <= hi):
        raise ValueError(f"Triangular invalid params: lo={lo}, mode={mode}, hi={hi}")
    # Guard degenerate or near-degenerate support
    if hi == lo or abs(hi - lo) < TOL_DEGENERATE_WIDTH:
        return np.full_like(u, float(lo), dtype=float)
    u = np.clip(u, U_EPS, 1 - U_EPS)
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

# Vectorized form (lo/mode/hi can be arrays)
def invcdf_triangular_vec(u: np.ndarray, lo: np.ndarray, mode: np.ndarray, hi: np.ndarray) -> np.ndarray:
    """
    Vectorized triangular inverse CDF.
    Accepts u with shape (runs, k) and lo/mode/hi as either (k,) or (runs, k).
    Handles broadcasting internally and avoids invalid indexing.
    """
    u = np.clip(u, U_EPS, 1 - U_EPS)

    lo   = np.asarray(lo,   dtype=float)
    mode = np.asarray(mode, dtype=float)
    hi   = np.asarray(hi,   dtype=float)

    # Promote 1-D parameter arrays (k,) to (1, k), then broadcast to u.shape.
    if lo.ndim == 1:   lo   = lo[None, :]
    if mode.ndim == 1: mode = mode[None, :]
    if hi.ndim == 1:   hi   = hi[None, :]

    lo   = np.broadcast_to(lo,   u.shape)
    mode = np.broadcast_to(mode, u.shape)
    hi   = np.broadcast_to(hi,   u.shape)

    span = hi - lo
    safe = span > 0

    # split point
    c = np.where(safe, (mode - lo) / span, 0.5)
    left = u < c

    out = np.empty_like(u, dtype=float)
    # left branch
    out[left] = lo[left] + np.sqrt(
        u[left] * np.maximum(span[left], 0.0) * np.maximum((mode - lo)[left], 0.0)
    )
    # right branch
    out[~left] = hi[~left] - np.sqrt(
        (1 - u[~left]) * np.maximum(span[~left], 0.0) * np.maximum((hi - mode)[~left], 0.0)
    )

    # degenerate intervals → constant lo
    out[~safe] = lo[~safe]
    return out


def invcdf_discrete(u: np.ndarray, values: np.ndarray, probs: np.ndarray) -> np.ndarray:
    # values/probs already filtered per (variable, period). probs sum to 1.
    u = np.clip(u, U_EPS, 1 - U_EPS)
    cdf = np.cumsum(probs)
    idx = np.searchsorted(cdf, u, side="right")
    idx = np.clip(idx, 0, len(values) - 1)
    return values[idx]

# =========================
# Correlation helpers
# =========================

def nearest_pd(A: np.ndarray, eps: float = PSD_EPS) -> np.ndarray:
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
        C2 = nearest_pd(C, eps=PSD_EPS)
        L = scipy_cholesky(C2, lower=True, overwrite_a=False, check_finite=True)
        delta = float(np.max(np.abs(C2 - C)))
        return L, delta

# =========================
# I/O
# =========================

def read_inputs(xlsx_path: str):
    """
    Template v2:
      - DRV            (was 'Variables')
      - DRV-triangular (was 'Params')      → columns: variable, month, best, mode, worst [, step...]    # step ignored
      - DRV-discrete   (was 'Discrete')    → columns: variable, month, value, prob
        NOTE: In the NEW template, 'value' and 'prob' can be JSON arrays per row
              (e.g., value: "[10, 20, 30]", prob: "[0.2, 0.5, 0.3]" or prob left blank).
      - Correlation
      - Settings
    """
    xls = pd.ExcelFile(xlsx_path)
    must = {SHEET_DRV, SHEET_DRV_TRI, SHEET_CORR, SHEET_SETTINGS}
    have = set(xls.sheet_names)
    missing = must - have
    if missing:
        raise SystemExit(f"[ERROR] Missing sheets: {sorted(missing)}")

    variables = pd.read_excel(xls, SHEET_DRV).fillna("")

    # Read triangular/uniform params from DRV-triangular; new template uses best/mode/worst.
    params_raw = pd.read_excel(xls, SHEET_DRV_TRI).fillna("")
    # Normalize headers (case/space-insensitive) but DO NOT remap legacy names.
    params = params_raw.rename(
        columns={c: str(c).strip().lower() for c in params_raw.columns}
    )
    # Keep only the columns we use; silently ignore 'step' or any extras
    keep = [c for c in [COL_VARIABLE, COL_MONTH, COL_BEST, COL_MODE, COL_WORST] if c in params.columns]
    params = params[keep].copy()

    # Discrete optional
    discrete = (
        pd.read_excel(xls, SHEET_DRV_DISC).fillna("")
        if SHEET_DRV_DISC in have else
        pd.DataFrame(columns=[COL_VARIABLE, COL_MONTH, COL_DISC_VALUE, COL_DISC_PROB])
    )
    if not discrete.empty:
        discrete.columns = [str(c).strip().lower() for c in discrete.columns]

    corr = pd.read_excel(xls, SHEET_CORR).fillna("")
    settings_df = pd.read_excel(xls, SHEET_SETTINGS).fillna("")
    settings = {}
    for _, row in settings_df.iterrows():
        k = str(row.get(SET_KEY, "")).strip()
        v = str(row.get(SET_VALUE, "")).strip()
        if k:
            settings[k] = v

    return variables, params, discrete, corr, settings

# =========================
# Validation and prep
# =========================

def validate_and_prepare(
    variables: pd.DataFrame, params: pd.DataFrame, discrete: pd.DataFrame, corr: pd.DataFrame
) -> Tuple[List[str], Dict[Tuple[str, str], Tuple[float, float, float]], Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray, np.ndarray]], np.ndarray]:
    if variables is None or variables.empty:
        raise SystemExit(f"[ERROR] '{SHEET_DRV}' sheet is empty.")

    # Required cols
    for col in [COL_VARIABLE, COL_DIST, COL_AR1_ENABLED]:
        if col not in variables.columns:
            raise SystemExit(f"[ERROR] {SHEET_DRV} sheet missing column '{col}'")

    # Normalize variable names order & strings
    variables[COL_VARIABLE] = variables[COL_VARIABLE].astype(str).str.strip()
    var_names = variables[COL_VARIABLE].tolist()

    # Dist lower
    variables[COL_DIST] = variables[COL_DIST].astype(str).str.strip().str.lower()
    bad = ~variables[COL_DIST].isin(["triangular", "uniform", "discrete"])
    if bad.any():
        raise SystemExit(f"[ERROR] Unknown dist values: {variables.loc[bad, COL_DIST].unique().tolist()}")

    # ar1_enabled
    variables[COL_AR1_ENABLED] = _as_bool_series(variables[COL_AR1_ENABLED])

    # AR(1) column: create if missing, coerce to numeric, blanks -> 0.0
    if COL_AR1_RHO not in variables.columns:
        variables[COL_AR1_RHO] = 0.0
    variables[COL_AR1_RHO] = pd.to_numeric(variables[COL_AR1_RHO], errors="coerce").fillna(0.0)

    # Params presence for continuous dists
    for col in [COL_VARIABLE, COL_MONTH]:
        if col not in params.columns:
            raise SystemExit(f"[ERROR] {SHEET_DRV_TRI} sheet missing column '{col}'")
    # Ensure best/mode/worst exist (mode can be absent and will be added as NaN)
    if COL_BEST not in params.columns:
        raise SystemExit(f"[ERROR] {SHEET_DRV_TRI} missing column '{COL_BEST}'")
    if COL_WORST not in params.columns:
        raise SystemExit(f"[ERROR] {SHEET_DRV_TRI} missing column '{COL_WORST}'")
    if COL_MODE not in params.columns:
        params[COL_MODE] = np.nan

    params[COL_VARIABLE] = params[COL_VARIABLE].astype(str).str.strip()
    params[COL_MONTH] = params[COL_MONTH].apply(_normalize_period_label)

    # Discrete optional (NEW: supports JSON arrays in 'value' and 'prob' per row)
    disc_equalized_examples: List[Tuple[str, str]] = []
    discrete_expanded = None
    if not discrete.empty:
        # Column presence
        for col in [COL_VARIABLE, COL_MONTH, COL_DISC_VALUE, COL_DISC_PROB]:
            if col not in discrete.columns:
                raise SystemExit(f"[ERROR] {SHEET_DRV_DISC} sheet missing column '{col}'")
        # Normalize keys
        discrete = discrete.copy()
        discrete[COL_VARIABLE] = discrete[COL_VARIABLE].astype(str).str.strip()
        discrete[COL_MONTH] = discrete[COL_MONTH].apply(_normalize_period_label)

        def _parse_json_array(cell) -> Optional[List[float]]:
            """
            Return list of floats if cell looks like a JSON array string; else None.
            We are strict: only JSON arrays are parsed here.
            """
            if isinstance(cell, str):
                s = cell.strip()
                if s.startswith("[") and s.endswith("]"):
                    try:
                        arr = json.loads(s)
                        if not isinstance(arr, list):
                            return None
                        out: List[float] = []
                        for x in arr:
                            xv = float(x)
                            if not np.isfinite(xv):
                                return None
                            out.append(xv)
                        return out
                    except Exception:
                        return None
            return None

        rows: List[Tuple[str, str, float, float]] = []
        # Build a fully expanded table (variable, month, value, prob)
        for _, r in discrete.iterrows():
            v = str(r[COL_VARIABLE]).strip()
            p = str(r[COL_MONTH]).strip()
            raw_vals = r[COL_DISC_VALUE]
            raw_probs = r[COL_DISC_PROB]

            vals_arr = _parse_json_array(raw_vals)
            probs_arr = _parse_json_array(raw_probs)

            # If 'value' is not an array, accept a single numeric
            if vals_arr is None:
                try:
                    vals_arr = [float(raw_vals)]
                except Exception:
                    examples = [(v, p, str(raw_vals))]  # keep ASCII
                    raise SystemExit(f"[ERROR] Discrete.value not numeric or JSON array. Examples: {examples[:TIP_SAMPLE_COUNT]} ...")

            # Determine probabilities policy:
            # - If probs JSON array present and sane length/sum≈1, use as-is.
            # - Else: AVERAGE to equal 1/k (user request).
            k = len(vals_arr)
            use_equal = False
            if probs_arr is None or len(probs_arr) != k:
                use_equal = True
            else:
                s = float(np.sum(probs_arr))
                if not np.isfinite(s) or (abs(s - 1.0) > TOL_PROB_SUM):
                    # AVERAGE everything to 1/k regardless of magnitudes (e.g., 100,100,100,100 → 0.25 each)
                    use_equal = True

            if use_equal:
                probs_arr = [1.0 / k] * k
                # Remember one example per (v,p) for a concise TIP
                if len(disc_equalized_examples) < TIP_SAMPLE_COUNT:
                    disc_equalized_examples.append((v, p))

            # Append expanded rows
            for val, pr in zip(vals_arr, probs_arr):
                rows.append((v, p, float(val), float(pr)))

        discrete_expanded = pd.DataFrame(rows, columns=[COL_VARIABLE, COL_MONTH, COL_DISC_VALUE, COL_DISC_PROB])

        # Final sanity: per (v,p), ensure exact sum-to-1 (tiny float drift allowed → renormalize)
        # We KEEP the user's probs when they already summed to 1; we only normalize minor drift.
        for (v, p), g in discrete_expanded.groupby([COL_VARIABLE, COL_MONTH]):
            probs = g[COL_DISC_PROB].to_numpy(dtype=float)
            s = float(np.sum(probs))
            if not np.isfinite(s) or s <= 0:
                # Should not happen with logic above; fail safely
                raise SystemExit(f"[ERROR] Invalid discrete probabilities for ({v}, {p}).")
            if abs(s - 1.0) > 1e-12:
                discrete_expanded.loc[g.index, COL_DISC_PROB] = probs / s  # harmless normalization

        if disc_equalized_examples:
            print(f"[TIP] Discrete probabilities AVERAGED to equal weights (1/k) for {len(set(disc_equalized_examples))} (variable, month) group(s). Examples: {disc_equalized_examples[:TIP_SAMPLE_COUNT]} ...")

    # Period coverage: union of Params.month and Discrete.month
    per_params = params[COL_MONTH].unique().tolist()
    per_discr = discrete[COL_MONTH].unique().tolist() if not discrete.empty else []
    periods = _chronological_periods(per_params + per_discr)

    # Validate continuous params and build map (best/worst -> lo/hi)
    tri_rows = params.copy()
    tri_rows[COL_BEST] = pd.to_numeric(tri_rows[COL_BEST], errors="coerce")
    tri_rows[COL_MODE] = pd.to_numeric(tri_rows[COL_MODE], errors="coerce")
    tri_rows[COL_WORST] = pd.to_numeric(tri_rows[COL_WORST], errors="coerce")

    # Hard validation for continuous distributions (both uniform & triangular use best/worst)
    cont_needed = tri_rows[[COL_VARIABLE, COL_MONTH, COL_BEST, COL_WORST]].copy()
    bad_nan = cont_needed[cont_needed[[COL_BEST, COL_WORST]].isna().any(axis=1)]
    if not bad_nan.empty:
        examples = bad_nan[[COL_VARIABLE, COL_MONTH]].head(TIP_SAMPLE_COUNT).values.tolist()
        raise SystemExit(f"[ERROR] {SHEET_DRV_TRI} best/worst contain non-numeric values. Examples: {examples} ...")

    # Auto-swap where best > worst (silent)
    mask_swap = tri_rows[COL_BEST] > tri_rows[COL_WORST]
    if mask_swap.any():
        best_before = tri_rows.loc[mask_swap, COL_BEST].values.copy()
        tri_rows.loc[mask_swap, COL_BEST] = tri_rows.loc[mask_swap, COL_WORST].values
        tri_rows.loc[mask_swap, COL_WORST] = best_before

    mm: Dict[Tuple[str, str], Tuple[float, float, float]] = {}
    tri_warnings: List[str] = []
    for _, r in tri_rows.iterrows():
        v = str(r[COL_VARIABLE]).strip()
        p = str(r[COL_MONTH]).strip()
        lo = float(r[COL_BEST])
        hi = float(r[COL_WORST])
        md_in = r[COL_MODE]
        if not np.isfinite(md_in):
            md_out = lo + 0.5 * (hi - lo)
            fix = "base invalid or missing; using midpoint"
        elif md_in < lo - TOL_MODE_RANGE or md_in > hi + TOL_MODE_RANGE:
            raise SystemExit(
                f"[ERROR] Triangular mode out of range for ({v}, {p}): "
                f"best={lo}, mode={md_in}, worst={hi}"
            )
        elif md_in < lo:
            fix = "base slightly < best; clamped"
            md_out = lo
        elif md_in > hi:
            fix = "base slightly > worst; clamped"
            md_out = hi
        else:
            md_out = md_in
            fix = "ok"
        mm[(v, p)] = (lo, md_out, hi)
        if fix != "ok":
            tri_warnings.append(f"({v}, {p}): best={lo}, mode={md_in}, worst={hi} -> {fix}; mode_used={md_out}")

    if tri_warnings:
        for line in tri_warnings[:TIP_SAMPLE_COUNT]:
            print(f"       {line}")
        if len(tri_warnings) > TIP_SAMPLE_COUNT:
            print(f"       ... and {len(tri_warnings) - TIP_SAMPLE_COUNT} more.")

    # Discrete maps (store (vals, probs, cdf) so we don't recompute every time)
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray, np.ndarray]] = {}
    if discrete_expanded is not None and not discrete_expanded.empty:
        for (v, p), g in discrete_expanded.groupby([COL_VARIABLE, COL_MONTH]):
            vals = g[COL_DISC_VALUE].to_numpy(dtype=float)
            probs = g[COL_DISC_PROB].to_numpy(dtype=float)
            # defensive final clip and CDF build
            probs = np.maximum(probs, 0.0)
            s = probs.sum()
            if s <= 0:
                raise SystemExit(f"[ERROR] Non-positive probability mass for ({v}, {p}).")
            if abs(s - 1.0) > 1e-12:
                probs = probs / s
            cdf = np.cumsum(probs)
            cdf[-1] = 1.0
            disc_map[(v, p)] = (vals, probs, cdf)

    # Correlation matrix (first col are labels)
    if corr.shape[0] < 1 or corr.shape[1] < 2:
        raise SystemExit("[ERROR] Correlation sheet must have a header row and labeled columns.")

    corr = corr.copy()
    corr.columns = [str(c).strip() for c in corr.columns]
    corr = corr.set_index(corr.columns[0])  # first column is variable names (whatever its header)
    # Be robust to stray whitespace in the index/columns coming from Excel
    corr.index = corr.index.map(lambda x: str(x).strip())
    corr.columns = [str(c).strip() for c in corr.columns]

    try:
        # IMPORTANT: use bracket form of .loc (not call form)
        corr = corr.loc[var_names, var_names]
    except KeyError:
        # Helpful diagnostics if labels don't match
        missing_rows = [v for v in var_names if v not in corr.index]
        missing_cols = [v for v in var_names if v not in corr.columns]
        details = []
        if missing_rows:
            details.append(f"missing rows: {missing_rows}")
        if missing_cols:
            details.append(f"missing cols: {missing_cols}")
        hint = " " + "; ".join(details) if details else ""
        raise SystemExit(f"[ERROR] Correlation sheet must have rows/cols for all variables in '{SHEET_DRV}'.{hint}")

    # Ensure numeric entries
    corr = corr.apply(pd.to_numeric, errors="coerce")
    if corr.isna().any().any():
        raise SystemExit("[ERROR] Correlation contains non-numeric cells.")
    corr_matrix = corr.to_numpy(dtype=float)

    # Symmetry policy: within tolerance → silently average; beyond tolerance → ERROR
    diff = corr_matrix - corr_matrix.T
    mask_bad = np.triu(np.abs(diff) > TOL_ASYMM, k=1)
    if np.any(mask_bad):
        idxs = np.argwhere(mask_bad)
        print("[ERROR] Correlation matrix not symmetric within tolerance.")
        shown = 0
        for i, j in idxs:
            if i >= j:
                continue
            if shown < TIP_SAMPLE_COUNT:
                print(f"        ρ[{var_names[i]},{var_names[j]}]={corr_matrix[i,j]:.6g} vs ρ[{var_names[j]},{var_names[i]}]={corr_matrix[j,i]:.6g} (Δ={abs(corr_matrix[i,j]-corr_matrix[j,i]):.3g})")
                shown += 1
        remaining = (np.count_nonzero(mask_bad) // 2) - shown
        if remaining > 0:
            print(f"        ... and {remaining} more off-diagonal asymmetric pairs.")
        raise SystemExit("[ERROR] Correlation asymmetry exceeds TOL_ASYMM. Fix your workbook and rerun.")
    # Within tolerance → enforce exact symmetry
    corr_matrix = (corr_matrix + corr_matrix.T) / 2.0

    # Bound to [-1, 1] with a clear notice if corrections occurred
    before_clip = corr_matrix.copy()
    corr_matrix = np.clip(corr_matrix, -1.0, 1.0)
    clip_delta = np.max(np.abs(before_clip - corr_matrix))
    if clip_delta > TOL_CLIP_NOTIFY:
        num_clipped = int(np.sum(np.abs(before_clip - corr_matrix) > TOL_CLIP_NOTIFY))
        print(f"[TIP] Correlation entries clipped to [-1,1]: {num_clipped} cell(s). Max |Delta|={clip_delta:.2e}. Consider reviewing extreme correlations.")

    # Force diagonal to 1.0 (true correlation); warn if large correction
    diag_before = np.diag(corr_matrix).copy()
    np.fill_diagonal(corr_matrix, 1.0)
    diag_err = float(np.max(np.abs(diag_before - 1.0)))
    if diag_err > TOL_DIAG_NOTIFY:
        print(f"[TIP] Correlation diagonal corrected to 1.0. Max |Delta|={diag_err:.2e}. Diagonal must be exactly 1 in a correlation matrix.")

    # Cholesky is computed later (in generate_draws). Here we only return the clipped/symmetrized matrix.
    return periods, mm, disc_map, corr_matrix


# -------------------------
# Unit-cube sampling helper
# -------------------------
def sample_unit_cube(
    n_requested: int,
    d: int,
    engine: str,
    seed: int,
    block_size: int,
    exact_n: bool,
) -> np.ndarray:
    """
    Generate U in (0,1)^d with either SOBOL or LHS.
    - SOBOL: if exact_n==False, pad to ceil(n_requested / block_size)*block_size.
      (No power-of-two requirement; we use Sobol.random which supports arbitrary n.)
    - LHS  : always exactly n_requested.
    Returns an array of shape (n, d) with values strictly inside (0,1)
    (clipped by U_EPS to avoid inverse-CDF infinities).
    """
    eng = (engine or DEFAULT_ENGINE).upper()
    if eng == ENGINE_SOBOL:
        sampler = qmc.Sobol(d=d, scramble=True, seed=seed)
        if exact_n:
            n = int(n_requested)
        else:
            blocks = max(1, int(np.ceil(n_requested / float(block_size))))
            n = blocks * int(block_size)
        U = sampler.random(n=n)
    elif eng == ENGINE_LHS:
        sampler = qmc.LatinHypercube(d=d, seed=seed)
        n = int(n_requested)
        U = sampler.random(n=n)
    else:
        raise ValueError(f"Unknown engine: {engine!r}. Expected '{ENGINE_SOBOL}' or '{ENGINE_LHS}'.")

    # Keep away from 0/1 to protect inverse CDFs (esp. norm.ppf)
    U = np.clip(U, U_EPS, 1.0 - U_EPS)
    return U


# =========================
# Engine
# =========================

def generate_draws(
    variables_df: pd.DataFrame,
    periods: List[str],
    mm: Dict[Tuple[str, str], Tuple[float, float, float]],
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray, np.ndarray]],
    corr_matrix: np.ndarray,
    runs: int,
    engine: str,
    seed: int,
    burnin: int = 0,
    block_size: int = DEFAULT_BLOCK_SIZE,
    exact_n: bool = False,
    warn_verbose: bool = False,
) -> Tuple[pd.DataFrame, int]:
    var_names = variables_df[COL_VARIABLE].astype(str).tolist()
    n_vars = len(var_names)
    n_periods = len(periods)

    # AR(1) params (coerce blanks to 0.0)
    ar_on = _as_bool_series(variables_df[COL_AR1_ENABLED]).to_numpy()
    rho_vec = pd.to_numeric(variables_df.get(COL_AR1_RHO, 0.0), errors="coerce").fillna(0.0).to_numpy(dtype=float)
    rho_vec = np.where(ar_on, rho_vec, 0.0)
    rho_vec = np.clip(rho_vec, 0.0, MAX_AR1_ABS_RHO).astype(float)
    gain_vec = np.sqrt(1.0 - rho_vec ** 2)  # stationary variance 1 for Z
    rho_eff = rho_vec.reshape(1, n_vars)
    gain_eff = gain_vec.reshape(1, n_vars)

    # Precompute dist list (O(1) lookup in the loop)
    dists = variables_df[COL_DIST].astype(str).str.lower().tolist()

    # Generate unit cube draws (RUN-level, not runs*periods)
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

    # Correlation via Cholesky (computed ONCE here)
    L, chol_delta = cholesky_corr(corr_matrix)
    if chol_delta > TOL_CHOL_NOTIFY:
        if warn_verbose:
            print(
                "[TIP] Correlation matrix was NOT positive-definite and was projected to the nearest PD matrix.\n"
                f"      Max element-wise change applied: {chol_delta:.2e}.\n"
                "      What this means: your correlations imply an impossible dependence structure.\n"
                "      How to fix in Excel:\n"
                "        • Ensure exact symmetry (rho[i,j] == rho[j,i]) and diagonal = 1.\n"
                "        • Reduce extreme ±1.00 entries; values near ±1 across many variables often break PD.\n"
                "        • Check for inconsistent blocks (e.g., A strongly with B and C, but B and C weak/negative).\n"
                "        • If you rounded inputs, use more decimals.\n"
                "      We applied a minimal correction so simulation can proceed, but results may differ from your intent."
            )
        else:
            print("[TIP] Correlation required nearest-PD projection (details: --warn-verbose).")
    E_corr = E @ L.T  # shape (runs, periods, vars)

    # Optional burn-in for AR(1): spin Z without recording (independent RNG)
    if burnin and burnin > 0:
        Z_b = np.zeros((actual_runs, n_vars), dtype=float)
        if (engine or DEFAULT_ENGINE).upper() == ENGINE_SOBOL:
            sampler_b = qmc.Sobol(d=n_vars, scramble=True, seed=seed + 0xA5A5)
            for _ in range(int(burnin)):
                U_b = sampler_b.random(n=actual_runs)
                U_b = np.clip(U_b, U_EPS, 1.0 - U_EPS)  # FIX: clip before norm.ppf
                E_b = stats.norm.ppf(U_b) @ L.T
                Z_b = rho_eff * Z_b + gain_eff * E_b
        else:
            rng = np.random.default_rng(seed + 0xBEEF)
            for _ in range(int(burnin)):
                U_b = rng.random((actual_runs, n_vars))
                U_b = np.clip(U_b, U_EPS, 1.0 - U_EPS)  # FIX: clip before norm.ppf
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

    # =========================
    # Vectorized mapping to target marginals
    # =========================
    X = np.empty_like(U_dep, dtype=float)  # (runs, periods, vars)

    # Masks by distribution family
    mask_uni = np.array([d == "uniform" for d in dists])
    mask_tri = np.array([d == "triangular" for d in dists])
    mask_disc = np.array([d == "discrete" for d in dists])

    # Prepare parameter tensors for continuous vars
    LO = np.full((n_periods, n_vars), np.nan, dtype=float)
    MD = np.full_like(LO, np.nan)
    HI = np.full_like(LO, np.nan)
    for j, v in enumerate(var_names):
        for t, p in enumerate(periods):
            if (v, p) in mm:
                lo, md, hi = mm[(v, p)]
                LO[t, j], MD[t, j], HI[t, j] = lo, md, hi

    # Per-period vectorized transforms
    for t in range(n_periods):
        if np.any(mask_uni):
            jsel = np.where(mask_uni)[0]
            X[:, t, jsel] = invcdf_uniform_vec(U_dep[:, t, jsel], LO[t, jsel], HI[t, jsel])
        if np.any(mask_tri):
            jsel = np.where(mask_tri)[0]
            X[:, t, jsel] = invcdf_triangular_vec(U_dep[:, t, jsel], LO[t, jsel], MD[t, jsel], HI[t, jsel])
        if np.any(mask_disc):
            for j in np.where(mask_disc)[0]:
                v = var_names[j]
                p = periods[t]
                vals, probs, cdf = disc_map[(v, p)]
                # FIX: Use side="right" for correct CDF lookup
                idx = np.searchsorted(cdf, np.clip(U_dep[:, t, j], U_EPS, 1 - U_EPS), side="right")
                idx = np.clip(idx, 0, len(vals) - 1)
                X[:, t, j] = vals[idx]

    # ---------- Deterministic special runs: base / best / worst ----------
    # For continuous: base=MD, best=LO, worst=HI.
    # For discrete: base=E[value], best=max(value), worst=min(value).
    base_mat = np.empty((n_periods, n_vars), dtype=float)
    best_mat = np.empty_like(base_mat)
    worst_mat = np.empty_like(base_mat)
    for j, v in enumerate(var_names):
        dist = dists[j]
        for t, p in enumerate(periods):
            if dist in ("uniform", "triangular"):
                lo, md, hi = LO[t, j], MD[t, j], HI[t, j]
                base_mat[t, j] = md
                best_mat[t, j] = lo
                worst_mat[t, j] = hi
            elif dist == "discrete":
                vals, probs, _ = disc_map[(v, p)]
                # Expected value (finite by construction)
                base_mat[t, j] = float(np.sum(vals * probs))
                best_mat[t, j] = float(np.max(vals))
                worst_mat[t, j] = float(np.min(vals))
            else:
                # Should not happen due to earlier validation
                base_mat[t, j] = np.nan
                best_mat[t, j] = np.nan
                worst_mat[t, j] = np.nan

    # ---------- Assemble output: first base/best/worst, then random ----------
    # Random section: reshape to DataFrame rows = runs x n_vars, columns = periods
    X_rvp = np.transpose(X, (0, 2, 1))  # (runs, vars, periods)
    data_random = X_rvp.reshape(actual_runs * n_vars, n_periods)
    run_random = np.repeat(np.arange(1, actual_runs + 1), n_vars).astype(object)  # keep object to mix with strings
    var_random = np.tile(var_names, actual_runs)

    out_dict_random = {"run": run_random, COL_VARIABLE: var_random}
    for idx_p, p in enumerate(periods):
        out_dict_random[p] = data_random[:, idx_p]
    df_random = pd.DataFrame(out_dict_random)

    # Deterministic three blocks (each has n_vars rows)
    def _mk_block(label: str, mat_np: np.ndarray) -> pd.DataFrame:
        rows = []
        for j, v in enumerate(var_names):
            row = {"run": label, COL_VARIABLE: v}
            for idx_p, p in enumerate(periods):
                row[p] = mat_np[idx_p, j]
            rows.append(row)
        return pd.DataFrame(rows)

    df_base  = _mk_block("base",  base_mat)
    df_best  = _mk_block("best",  best_mat)
    df_worst = _mk_block("worst", worst_mat)

    out = pd.concat([df_base, df_best, df_worst, df_random], axis=0, ignore_index=True)

    return out, actual_runs

# =========================
# Main
# =========================

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input-excel", required=True)
    ap.add_argument("--out", required=True, help="Output path (.csv or .xlsx)")
    ap.add_argument("--engine", choices=[ENGINE_SOBOL, ENGINE_LHS], help="Override Settings.engine")
    ap.add_argument("--runs", type=int, help="Override Settings.runs")
    ap.add_argument("--seed", type=int, help="Override Settings.seed")
    ap.add_argument("--burnin", type=int, help="AR(1) warm-up steps (discarded).")
    ap.add_argument("--block-size", type=int, default=DEFAULT_BLOCK_SIZE, help="SOBOL block size for padding (no power-of-two required).")
    ap.add_argument("--exact-n", action="store_true", help="For SOBOL, cut to exactly N instead of keeping full blocks.")
    ap.add_argument("--warn-verbose", action="store_true", help="Print detailed multi-line PD warnings.")
    args = ap.parse_args()

    variables, params, discrete, corr, settings = read_inputs(args.input_excel)

    # Settings defaults (now surfaced as constants)
    engine = (args.engine or settings.get("engine", DEFAULT_ENGINE)).strip().upper()
    runs = int(args.runs or int(settings.get("runs", str(DEFAULT_RUNS))))
    seed = int(args.seed or int(settings.get("seed", str(DEFAULT_SEED))))
    burnin = int(args.burnin or int(settings.get("burnin", str(DEFAULT_BURNIN))))
    block_size = int(args.block_size)
    exact_n = bool(args.exact_n or str(settings.get("exact_n", str(DEFAULT_EXACT_N))).strip().lower() in ["1", "true", "yes", "on"])

    print(f"[INFO] engine={engine} runs={runs} seed={seed} burnin={burnin} block_size={block_size} exact_n={exact_n}")
    if args.engine is None and args.runs is None and args.seed is None and args.burnin is None:
        _summarize_parameters_when_no_cli(settings)

    # Validate & prepare
    periods, mm, disc_map, corr_matrix = validate_and_prepare(variables, params, discrete, corr)

    # Validate that every (variable, period) combo has parameters
    missing_cont, missing_disc = [], []
    for _, r in variables.iterrows():
        v = str(r[COL_VARIABLE]).strip()
        dist = str(r[COL_DIST]).strip().lower()
        for p in periods:
            if dist in ("uniform", "triangular"):
                if (v, p) not in mm:
                    missing_cont.append((v, p))
            elif dist == "discrete":
                if (v, p) not in disc_map:
                    missing_disc.append((v, p))
    if missing_cont or missing_disc:
        if missing_cont:
            print("[ERROR] Missing continuous params for:", missing_cont[:TIP_SAMPLE_COUNT],
                  "..." if len(missing_cont) > TIP_SAMPLE_COUNT else "")
        if missing_disc:
            print("[ERROR] Missing discrete params for:", missing_disc[:TIP_SAMPLE_COUNT],
                  "..." if len(missing_disc) > TIP_SAMPLE_COUNT else "")
        raise SystemExit("[ERROR] Incomplete parameter coverage. Fix the gaps and retry.")

    # Settings summary (ASCII)
    print("Settings summary:")
    print(f"       - engine={engine}")
    print(f"       - runs={runs} (rows per variable, not counting base/best/worst blocks)")
    print(f"       - seed={seed} (reproducible draws)")
    print(f"       - burnin={burnin} (AR(1) warm-up steps)")
    if engine == ENGINE_SOBOL:
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
        warn_verbose=args.warn_verbose,
    )

    if engine == ENGINE_SOBOL:
        if not exact_n and actual_runs != runs:
            print(f"[TIP] SOBOL padded to full blocks: requested runs={runs}, effective runs={actual_runs}. Use --exact-n to cut to exactly N or change --block-size.")

    # Write
    if args.out.lower().endswith(".xlsx"):
        out.to_excel(args.out, sheet_name="Draws", index=False)
    else:
        out.to_csv(args.out, index=False)

    print(f"[OK] Wrote {len(out):,} rows x {len(out.columns):,} cols to {args.out}")

if __name__ == "__main__":
    main()