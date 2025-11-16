#!/usr/bin/env python3
"""
generate_monte_carlo.py

Monte Carlo sample generator for discrete distributions with optional grouping.
Reads input Excel, validates structure, and generates Monte Carlo draws.

For scenario space analysis, use: analyze_scenario_space.py

# Usage examples

## Normal run with current settings
python generate_monte_carlo.py --input-excel template.xlsx --out output.csv

## Override runs
python generate_monte_carlo.py --input-excel template.xlsx --out output.csv --runs 512

## For analysis first (use separate script)
python analyze_scenario_space.py --input-excel template.xlsx --time-per-run 60
# Then generate based on recommendations
python generate_monte_carlo.py --input-excel template.xlsx --out output.csv --runs 512
"""
from __future__ import annotations

import argparse
from typing import Dict, List, Tuple, Optional, Set
import json

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import qmc
from datetime import datetime

# =========================
# Constants
# =========================
SHEET_VARIABLES: str = "Variables"
SHEET_SETTINGS: str = "Settings"

COL_VARIABLE: str = "variable"
COL_MONTH: str = "month"
COL_VALUES: str = "best <-> worst values"
COL_PROBS: str = "probabilities"
COL_GROUP: str = "group"

SET_KEY: str = "key"
SET_VALUE: str = "value"

ENGINE_SOBOL: str = "SOBOL"
ENGINE_RANDOM: str = "RANDOM"

# Recommended powers of 2 for SOBOL sampling (optimal convergence)
RECOMMENDED_RUNS: List[int] = [64, 128, 256, 512, 1024, 2048, 4096]

DEFAULT_ENGINE: str = ENGINE_SOBOL
DEFAULT_RUNS: int = 256  # Power of 2 for optimal SOBOL performance
DEFAULT_SEED: int = 12345
DEFAULT_BLOCK_SIZE: int = 256  # Match DEFAULT_RUNS to avoid padding
DEFAULT_EXACT_N: bool = False

U_EPS: float = 1e-12
TOL_PROB_SUM: float = 1e-10

# =========================
# Helpers
# =========================

def _try_int(s: str) -> Optional[int]:
    try:
        return int(s)
    except Exception:
        return None

def _parse_period_label(s: str) -> Tuple[str, str, Tuple[int, int, int, int, str]]:
    """Return (normalized_label, type_code, sort_key)"""
    s = str(s).strip()
    
    year = _try_int(s)
    if year is not None and 1 <= year <= 9999:
        return s, "Y", (0, year, 0, 0, s)
    
    try:
        dt = datetime.strptime(s, "%Y-%m")
        lbl = f"{dt.year:04d}-{dt.month:02d}"
        return lbl, "M", (0, dt.year, dt.month, 0, lbl)
    except Exception:
        pass
    
    try:
        dt = datetime.strptime(s, "%Y-%m-%d")
        lbl = f"{dt.year:04d}-{dt.month:02d}-{dt.day:02d}"
        return lbl, "D", (0, dt.year, dt.month, dt.day, lbl)
    except Exception:
        pass
    
    return s, "STR", (1, 9999, 99, 99, s)

def _normalize_period_label(s: str) -> str:
    return _parse_period_label(s)[0]

def _chronological_periods(labels: List[str]) -> List[str]:
    dedup = list(dict.fromkeys([_normalize_period_label(x) for x in labels]))
    parsed = [_parse_period_label(x) for x in dedup]
    parsed.sort(key=lambda t: t[2])
    return [p[0] for p in parsed]

def _parse_json_array(cell) -> Optional[List[float]]:
    """Return list of floats if cell is JSON array; else None."""
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

# =========================
# I/O
# =========================

def read_inputs(xlsx_path: str):
    """Read Variables and Settings sheets."""
    xls = pd.ExcelFile(xlsx_path)
    must = {SHEET_VARIABLES, SHEET_SETTINGS}
    have = set(xls.sheet_names)
    missing = must - have
    if missing:
        raise SystemExit(f"[ERROR] Missing sheets: {sorted(missing)}")
    
    variables = pd.read_excel(xls, SHEET_VARIABLES).fillna("")
    variables.columns = [str(c).strip().lower() for c in variables.columns]
    
    settings_df = pd.read_excel(xls, SHEET_SETTINGS).fillna("")
    settings = {}
    for _, row in settings_df.iterrows():
        k = str(row.get(SET_KEY, "")).strip()
        v = str(row.get(SET_VALUE, "")).strip()
        if k:
            settings[k] = v
    
    return variables, settings

# =========================
# Validation
# =========================

def validate_and_prepare(variables: pd.DataFrame):
    """Validate and prepare discrete variable data with group handling."""
    if variables is None or variables.empty:
        raise SystemExit(f"[ERROR] '{SHEET_VARIABLES}' sheet is empty.")
    
    for col in [COL_VARIABLE, COL_MONTH, COL_VALUES]:
        if col not in variables.columns:
            raise SystemExit(f"[ERROR] {SHEET_VARIABLES} missing column '{col}'")
    
    if COL_PROBS not in variables.columns:
        variables[COL_PROBS] = ""
    if COL_GROUP not in variables.columns:
        variables[COL_GROUP] = ""
    
    variables = variables.copy()
    variables[COL_VARIABLE] = variables[COL_VARIABLE].astype(str).str.strip()
    variables[COL_MONTH] = variables[COL_MONTH].apply(_normalize_period_label)
    variables[COL_GROUP] = variables[COL_GROUP].astype(str).str.strip().str.lower()
    variables[COL_GROUP] = variables[COL_GROUP].replace("", None)
    
    var_names = variables[COL_VARIABLE].unique().tolist()
    
    # Validate Rule 5: consistent grouping
    var_groups: Dict[str, Optional[str]] = {}
    for v in var_names:
        groups_for_v = variables[variables[COL_VARIABLE] == v][COL_GROUP].dropna().unique()
        if len(groups_for_v) > 1:
            raise SystemExit(f"[ERROR] Variable '{v}' appears in multiple groups: {groups_for_v.tolist()}")
        if len(groups_for_v) == 1:
            var_groups[v] = groups_for_v[0]
        else:
            has_group = variables[(variables[COL_VARIABLE] == v) & (variables[COL_GROUP].notna())].shape[0] > 0
            no_group = variables[(variables[COL_VARIABLE] == v) & (variables[COL_GROUP].isna())].shape[0] > 0
            if has_group and no_group:
                raise SystemExit(f"[ERROR] Variable '{v}' appears both grouped and ungrouped")
            var_groups[v] = None
    
    # Parse values and probabilities
    rows_expanded: List[Tuple[str, str, List[float], Optional[List[float]], Optional[str]]] = []
    
    for idx, r in variables.iterrows():
        v = str(r[COL_VARIABLE]).strip()
        p = str(r[COL_MONTH]).strip()
        grp = r[COL_GROUP] if pd.notna(r[COL_GROUP]) else None
        
        raw_vals = r[COL_VALUES]
        raw_probs = r[COL_PROBS]
        
        vals_arr = _parse_json_array(raw_vals)
        if vals_arr is None:
            try:
                vals_arr = [float(raw_vals)]
            except Exception:
                raise SystemExit(f"[ERROR] Invalid value at row {idx+2}: {raw_vals}")
        
        probs_arr = None
        if isinstance(raw_probs, str) and raw_probs.strip():
            probs_arr = _parse_json_array(raw_probs)
            if probs_arr is None:
                raise SystemExit(f"[ERROR] Invalid probabilities at row {idx+2}: {raw_probs}")
        
        rows_expanded.append((v, p, vals_arr, probs_arr, grp))
    
    # Build disc_map and validate groups
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]] = {}
    group_period_data: Dict[Tuple[Optional[str], str], List[Tuple[str, List[float], Optional[List[float]]]]] = {}
    
    for v, p, vals, probs, grp in rows_expanded:
        key = (grp, p)
        if key not in group_period_data:
            group_period_data[key] = []
        group_period_data[key].append((v, vals, probs))
    
    for (grp, period), entries in group_period_data.items():
        lengths = [len(vals) for _, vals, _ in entries]
        if len(set(lengths)) > 1:
            vars_in_group = [v for v, _, _ in entries]
            raise SystemExit(
                f"[ERROR] Group '{grp or 'ungrouped'}', period '{period}': "
                f"arrays have different lengths: {dict(zip(vars_in_group, lengths))}"
            )
        
        arr_len = lengths[0]
        probs_for_group = None
        
        for v, vals, probs in entries:
            if probs is not None:
                if len(probs) != arr_len:
                    raise SystemExit(
                        f"[ERROR] Variable '{v}', period '{period}': "
                        f"len(values)={arr_len} != len(probabilities)={len(probs)}"
                    )
                if probs_for_group is None:
                    probs_for_group = probs
                else:
                    if not np.allclose(probs, probs_for_group, atol=1e-9):
                        raise SystemExit(
                            f"[ERROR] Group '{grp}', period '{period}': "
                            f"inconsistent probabilities"
                        )
        
        if probs_for_group is None:
            probs_for_group = [1.0 / arr_len] * arr_len
        
        probs_arr = np.array(probs_for_group, dtype=float)
        probs_arr = np.maximum(probs_arr, 0.0)
        s = probs_arr.sum()
        if s <= 0:
            raise SystemExit(f"[ERROR] Non-positive probability sum for group '{grp}', period '{period}'")
        if abs(s - 1.0) > TOL_PROB_SUM:
            probs_arr = probs_arr / s
        
        for v, vals, _ in entries:
            vals_arr = np.array(vals, dtype=float)
            disc_map[(v, period)] = (vals_arr, probs_arr)
    
    periods = _chronological_periods([p for _, p, _, _, _ in rows_expanded])
    
    # Build group_map
    group_map: Dict[str, Dict[str, List[str]]] = {}
    for period in periods:
        group_map[period] = {}
        for v in var_names:
            grp = var_groups[v]
            if (v, period) not in disc_map:
                continue
            if grp:
                if grp not in group_map[period]:
                    group_map[period][grp] = []
                group_map[period][grp].append(v)
    
    scenario_info = calculate_scenario_space(var_names, periods, disc_map, group_map, var_groups)
    
    return var_names, periods, disc_map, group_map, var_groups, scenario_info

# =========================
# Scenario Space Calculation (brief)
# =========================

def calculate_scenario_space(
    var_names: List[str],
    periods: List[str],
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]],
    group_map: Dict[str, Dict[str, List[str]]],
    var_groups: Dict[str, Optional[str]]
) -> Dict:
    """Calculate scenario space considering groups."""
    
    all_groups: Set[str] = set()
    for period_groups in group_map.values():
        all_groups.update(period_groups.keys())
    
    independent_vars = [v for v, g in var_groups.items() if g is None]
    
    scenarios_per_period = []
    for period in periods:
        scenarios = 1
        groups_in_period = group_map.get(period, {})
        
        for grp, vars_in_grp in groups_in_period.items():
            if vars_in_grp:
                v = vars_in_grp[0]
                if (v, period) in disc_map:
                    vals, _ = disc_map[(v, period)]
                    scenarios *= len(vals)
        
        for v in independent_vars:
            if (v, period) in disc_map:
                vals, _ = disc_map[(v, period)]
                scenarios *= len(vals)
        
        scenarios_per_period.append(scenarios)
    
    return {
        "total_vars": len(var_names),
        "grouped_vars": len([v for v in var_names if var_groups[v] is not None]),
        "independent_vars": len(independent_vars),
        "num_groups": len(all_groups),
        "num_periods": len(periods),
        "scenarios_per_period": scenarios_per_period,
        "median_scenarios": int(np.median(scenarios_per_period)) if scenarios_per_period else 0,
    }

# =========================
# Sampling
# =========================

def sample_unit_cube(n: int, d: int, engine: str, seed: int, block_size: int, exact_n: bool) -> np.ndarray:
    """Generate U in (0,1)^d."""
    eng = (engine or DEFAULT_ENGINE).upper()
    
    if eng == ENGINE_SOBOL:
        sampler = qmc.Sobol(d=d, scramble=True, seed=seed)
        if exact_n:
            n_sample = n
        else:
            blocks = max(1, int(np.ceil(n / float(block_size))))
            n_sample = blocks * block_size
        U = sampler.random(n=n_sample)
    elif eng == ENGINE_RANDOM:
        rng = np.random.default_rng(seed)
        U = rng.random((n, d))
    else:
        raise ValueError(f"Unknown engine: {engine!r}. Expected '{ENGINE_SOBOL}' or '{ENGINE_RANDOM}'.")
    
    U = np.clip(U, U_EPS, 1.0 - U_EPS)
    return U

# =========================
# Main Generation
# =========================

def generate_draws(
    var_names: List[str],
    periods: List[str],
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]],
    group_map: Dict[str, Dict[str, List[str]]],
    var_groups: Dict[str, Optional[str]],
    runs: int,
    engine: str,
    seed: int,
    block_size: int,
    exact_n: bool,
) -> Tuple[pd.DataFrame, int]:
    """
    Generate Monte Carlo draws for discrete variables with groups.
    
    IMPORTANT: This function intentionally generates DUPLICATE scenarios.
    Duplicates encode probability information - their frequency represents
    the probability of each scenario. Removing duplicates would destroy
    the probability distribution and make all statistics (mean, percentiles,
    VaR, CVaR, etc.) incorrect. A scenario appearing 60 times out of 100
    means it has 60% probability - this is data, not redundancy.
    """
    
    n_vars = len(var_names)
    n_periods = len(periods)
    
    # Calculate dimensions needed
    dims_per_period = []
    for period in periods:
        dims = 0
        groups_in_period = group_map.get(period, {})
        dims += len(groups_in_period)
        for v in var_names:
            if var_groups[v] is None and (v, period) in disc_map:
                dims += 1
        dims_per_period.append(dims)
    
    total_dims = sum(dims_per_period)
    
    if total_dims == 0:
        raise SystemExit("[ERROR] No variables defined for any period")
    
    # Sample unit cube
    U = sample_unit_cube(runs, total_dims, engine, seed, block_size, exact_n)
    actual_runs = U.shape[0]
    
    # Reshape U by period
    U_by_period = []
    dim_idx = 0
    for d in dims_per_period:
        U_by_period.append(U[:, dim_idx:dim_idx+d])
        dim_idx += d
    
    # Generate draws
    X = np.full((actual_runs, n_periods, n_vars), np.nan, dtype=float)
    
    for t, period in enumerate(periods):
        U_period = U_by_period[t]
        groups_in_period = group_map.get(period, {})
        u_idx = 0
        
        # Process groups
        for grp, vars_in_grp in groups_in_period.items():
            if not vars_in_grp:
                continue
            u_grp = U_period[:, u_idx]
            u_idx += 1
            
            for v in vars_in_grp:
                j = var_names.index(v)
                if (v, period) in disc_map:
                    vals, probs = disc_map[(v, period)]
                    cdf = np.cumsum(probs)
                    cdf[-1] = 1.0
                    idx = np.searchsorted(cdf, u_grp, side="right")
                    idx = np.clip(idx, 0, len(vals) - 1)
                    X[:, t, j] = vals[idx]
        
        # Process independent variables
        for v in var_names:
            if var_groups[v] is None and (v, period) in disc_map:
                j = var_names.index(v)
                u_var = U_period[:, u_idx]
                u_idx += 1
                
                vals, probs = disc_map[(v, period)]
                cdf = np.cumsum(probs)
                cdf[-1] = 1.0
                idx = np.searchsorted(cdf, u_var, side="right")
                idx = np.clip(idx, 0, len(vals) - 1)
                X[:, t, j] = vals[idx]
    
    # Generate deterministic runs: base, best, worst
    base_mat = np.full((n_periods, n_vars), np.nan, dtype=float)
    best_mat = np.full((n_periods, n_vars), np.nan, dtype=float)
    worst_mat = np.full((n_periods, n_vars), np.nan, dtype=float)
    
    for t, period in enumerate(periods):
        groups_in_period = group_map.get(period, {})
        
        # Process groups (synchronized)
        for grp, vars_in_grp in groups_in_period.items():
            if not vars_in_grp:
                continue
            v0 = vars_in_grp[0]
            if (v0, period) in disc_map:
                vals, probs = disc_map[(v0, period)]
                base_idx = int(np.argmax(probs))
                best_idx = 0
                worst_idx = len(vals) - 1
                
                for v in vars_in_grp:
                    j = var_names.index(v)
                    if (v, period) in disc_map:
                        v_vals, _ = disc_map[(v, period)]
                        base_mat[t, j] = v_vals[base_idx]
                        best_mat[t, j] = v_vals[best_idx]
                        worst_mat[t, j] = v_vals[worst_idx]
        
        # Process independent variables
        for v in var_names:
            if var_groups[v] is None and (v, period) in disc_map:
                j = var_names.index(v)
                vals, probs = disc_map[(v, period)]
                base_idx = int(np.argmax(probs))
                base_mat[t, j] = vals[base_idx]
                best_mat[t, j] = vals[0]
                worst_mat[t, j] = vals[-1]
    
    # Assemble output DataFrame
    X_rvp = np.transpose(X, (0, 2, 1))
    data_random = X_rvp.reshape(actual_runs * n_vars, n_periods)
    run_random = np.repeat(np.arange(1, actual_runs + 1), n_vars).astype(object)
    var_random = np.tile(var_names, actual_runs)
    
    out_dict_random = {"run": run_random, COL_VARIABLE: var_random}
    for idx_p, p in enumerate(periods):
        out_dict_random[p] = data_random[:, idx_p]
    df_random = pd.DataFrame(out_dict_random)
    
    # Deterministic blocks
    def _mk_block(label: str, mat_np: np.ndarray) -> pd.DataFrame:
        rows = []
        for j, v in enumerate(var_names):
            row = {"run": label, COL_VARIABLE: v}
            for idx_p, p in enumerate(periods):
                row[p] = mat_np[idx_p, j]
            rows.append(row)
        return pd.DataFrame(rows)
    
    df_base = _mk_block("base", base_mat)
    df_best = _mk_block("best", best_mat)
    df_worst = _mk_block("worst", worst_mat)
    
    out = pd.concat([df_base, df_best, df_worst, df_random], axis=0, ignore_index=True)
    
    return out, actual_runs

# =========================
# Main
# =========================

def main():
    ap = argparse.ArgumentParser(
        description="Generate Monte Carlo samples for discrete distributions"
    )
    ap.add_argument("--input-excel", required=True, help="Input Excel file path")
    ap.add_argument("--out", required=True, help="Output path (.csv or .xlsx)")
    ap.add_argument("--engine", choices=[ENGINE_SOBOL, ENGINE_RANDOM], 
                    help=f"Sampling engine (default: {DEFAULT_ENGINE}). SOBOL recommended for better space coverage.")
    ap.add_argument("--runs", type=int,
                    help=f"Number of Monte Carlo runs (default: {DEFAULT_RUNS}). "
                         f"Powers of 2 recommended: {RECOMMENDED_RUNS[:5]}. "
                         f"SOBOL pads to multiples of --block-size unless --exact-n is used.")
    ap.add_argument("--seed", type=int, 
                    help=f"Random seed for reproducibility (default: {DEFAULT_SEED})")
    ap.add_argument("--block-size", type=int, default=DEFAULT_BLOCK_SIZE,
                    help=f"SOBOL block size for padding (default: {DEFAULT_BLOCK_SIZE}). "
                         f"Runs padded to next multiple of this value for efficiency. "
                         f"Powers of 2 (256, 512, 1024) recommended.")
    ap.add_argument("--exact-n", action="store_true",
                    help="Cut to exactly N runs instead of padding to block-size multiples. "
                         "Default: padding enabled for SOBOL efficiency.")
    args = ap.parse_args()
    
    # Read inputs
    print("[INFO] Reading and validating input...")
    variables, settings = read_inputs(args.input_excel)
    
    # Validate and prepare
    var_names, periods, disc_map, group_map, var_groups, scenario_info = validate_and_prepare(variables)
    
    # Get settings
    engine = (args.engine or settings.get("algorithm", DEFAULT_ENGINE)).strip().upper()
    runs = int(args.runs or int(settings.get("runs", str(DEFAULT_RUNS))))
    seed = int(args.seed or int(settings.get("seed", str(DEFAULT_SEED))))
    block_size = int(args.block_size)
    exact_n = bool(args.exact_n or str(settings.get("exact_n", str(DEFAULT_EXACT_N))).strip().lower() 
                   in ["1", "true", "yes", "on"])
    
    # Show startup summary
    print(f"[INFO] Configuration: engine={engine}, runs={runs}, seed={seed}")
    print(f"[INFO] Structure: {scenario_info['total_vars']} variables "
          f"({scenario_info['num_groups']} groups, {scenario_info['independent_vars']} independent), "
          f"{scenario_info['num_periods']} periods")
    
    median_scen = scenario_info['median_scenarios']
    n_periods = scenario_info['num_periods']
    if median_scen > 0 and n_periods > 0:
        log_total = n_periods * np.log10(median_scen)
        if log_total > 15:
            exponent = int(log_total)
            mantissa = 10 ** (log_total - exponent)
            print(f"[INFO] Scenario space: {mantissa:.2f} × 10^{exponent} total paths")
        elif log_total > 9:
            total = 10 ** log_total
            print(f"[INFO] Scenario space: {total:,.0f} total paths")
        else:
            total = median_scen ** n_periods
            print(f"[INFO] Scenario space: {total:,} total paths")
    
    print(f"[TIP] For detailed analysis, use: analyze_scenario_space.py --input-excel {args.input_excel}")
    
    # Generate draws
    print("\n[INFO] Generating Monte Carlo samples...")
    out, final_runs = generate_draws(
        var_names=var_names,
        periods=periods,
        disc_map=disc_map,
        group_map=group_map,
        var_groups=var_groups,
        runs=runs,
        engine=engine,
        seed=seed,
        block_size=block_size,
        exact_n=exact_n,
    )
    
    # Write output
    print(f"[INFO] Writing output to {args.out}...")
    if args.out.lower().endswith(".xlsx"):
        out.to_excel(args.out, sheet_name="Draws", index=False)
    else:
        out.to_csv(args.out, index=False)
    
    print(f"[OK] Successfully wrote {len(out):,} rows × {len(out.columns):,} columns")
    print(f"[OK] Output includes: 3 deterministic runs (base/best/worst) + {final_runs:,} stochastic runs")

if __name__ == "__main__":
    main()