#!/usr/bin/env python3
"""
montecarlo_discrete_generator.py

Simplified Monte Carlo draw generator for discrete distributions with:
  - Per-variable per-period discrete marginals (JSON arrays or single values).
  - Optional variable grouping for synchronized sampling.
  - Independent periods (no temporal correlation).
  - SOBOL or RANDOM sampling engines.

Output:
  - First 3 blocks are deterministic runs: "base", "best", "worst"
  - Followed by stochastic runs: 1, 2, 3, ..., N
  
# Usage examples

## Analyze scenario space and get recommendations
python montecarlo_discrete_generator.py --input-excel template.xlsx --out output.csv   --recommend-runs --time-per-run 60

## Normal run with current settings
python montecarlo_discrete_generator.py --input-excel template.xlsx --out output.csv

## Override runs and see time estimate
python montecarlo_discrete_generator.py --input-excel template.xlsx --out output.csv --runs 1000   --time-per-run 60

## recommend-runs sample
python montecarlo_discrete_generator.py --input-excel my_forecast.xlsx --out output.csv  --recommend-runs --time-per-run 60

"""
from __future__ import annotations

import argparse
from typing import Dict, List, Tuple, Optional, Set
import json
import sys

import numpy as np
import pandas as pd
from scipy import stats
from scipy.stats import qmc
from datetime import datetime

# =========================
# Template constants (EDITABLE)
# =========================
SHEET_VARIABLES: str = "Variables"
SHEET_SETTINGS: str = "Settings"

# Variables sheet columns
COL_VARIABLE: str = "variable"
COL_MONTH: str = "month"
COL_VALUES: str = "best <-> worst values"
COL_PROBS: str = "probabilities"
COL_GROUP: str = "group"

# Settings sheet
SET_KEY: str = "key"
SET_VALUE: str = "value"

# Engine options
ENGINE_SOBOL: str = "SOBOL"
ENGINE_RANDOM: str = "RANDOM"

# =========================
# Defaults (EDITABLE)
# =========================
DEFAULT_ENGINE: str = ENGINE_SOBOL
DEFAULT_RUNS: int = 500
DEFAULT_SEED: int = 12345
DEFAULT_BLOCK_SIZE: int = 256
DEFAULT_EXACT_N: bool = False

# Tolerances
U_EPS: float = 1e-12
TOL_PROB_SUM: float = 1e-10

# UI
TIP_SAMPLE_COUNT: int = 10

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
    
    # Fallback
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
    """
    Validate and prepare discrete variable data with group handling.
    Returns: (var_names, periods, disc_map, group_map, scenario_info)
    """
    if variables is None or variables.empty:
        raise SystemExit(f"[ERROR] '{SHEET_VARIABLES}' sheet is empty.")
    
    # Check required columns
    for col in [COL_VARIABLE, COL_MONTH, COL_VALUES]:
        if col not in variables.columns:
            raise SystemExit(f"[ERROR] {SHEET_VARIABLES} missing column '{col}'")
    
    # Ensure probabilities and group columns exist
    if COL_PROBS not in variables.columns:
        variables[COL_PROBS] = ""
    if COL_GROUP not in variables.columns:
        variables[COL_GROUP] = ""
    
    # Normalize
    variables = variables.copy()
    variables[COL_VARIABLE] = variables[COL_VARIABLE].astype(str).str.strip()
    variables[COL_MONTH] = variables[COL_MONTH].apply(_normalize_period_label)
    variables[COL_GROUP] = variables[COL_GROUP].astype(str).str.strip().str.lower()
    variables[COL_GROUP] = variables[COL_GROUP].replace("", None)
    
    # Get unique var names in order
    var_names = variables[COL_VARIABLE].unique().tolist()
    
    # Validate Rule 5: Each variable consistently in same group (or ungrouped)
    var_groups: Dict[str, Optional[str]] = {}
    for v in var_names:
        groups_for_v = variables[variables[COL_VARIABLE] == v][COL_GROUP].dropna().unique()
        if len(groups_for_v) > 1:
            raise SystemExit(f"[ERROR] Variable '{v}' appears in multiple groups: {groups_for_v.tolist()}")
        if len(groups_for_v) == 1:
            var_groups[v] = groups_for_v[0]
        else:
            # Check if it appears both with and without group
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
        
        # Parse values
        vals_arr = _parse_json_array(raw_vals)
        if vals_arr is None:
            try:
                vals_arr = [float(raw_vals)]
            except Exception:
                raise SystemExit(f"[ERROR] Invalid value at row {idx+2}: {raw_vals}")
        
        # Parse probabilities (optional)
        probs_arr = None
        if isinstance(raw_probs, str) and raw_probs.strip():
            probs_arr = _parse_json_array(raw_probs)
            if probs_arr is None:
                raise SystemExit(f"[ERROR] Invalid probabilities at row {idx+2}: {raw_probs}")
        
        rows_expanded.append((v, p, vals_arr, probs_arr, grp))
    
    # Group by (group, period) and (variable, period) to validate and inherit probabilities
    # Build disc_map: (variable, period) -> (values, probs)
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]] = {}
    
    # First pass: collect by (group, period) for validation
    group_period_data: Dict[Tuple[Optional[str], str], List[Tuple[str, List[float], Optional[List[float]]]]] = {}
    for v, p, vals, probs, grp in rows_expanded:
        key = (grp, p)
        if key not in group_period_data:
            group_period_data[key] = []
        group_period_data[key].append((v, vals, probs))
    
    # Process each (group, period)
    for (grp, period), entries in group_period_data.items():
        # Rule 6: All arrays in same (group, period) must have equal length
        lengths = [len(vals) for _, vals, _ in entries]
        if len(set(lengths)) > 1:
            vars_in_group = [v for v, _, _ in entries]
            raise SystemExit(
                f"[ERROR] Group '{grp or 'ungrouped'}', period '{period}': "
                f"arrays have different lengths: {dict(zip(vars_in_group, lengths))}"
            )
        
        arr_len = lengths[0]
        
        # Rule 4 & 7: Find probabilities (first row with probs, or inherit)
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
                    # Validate consistency
                    if not np.allclose(probs, probs_for_group, atol=1e-9):
                        raise SystemExit(
                            f"[ERROR] Group '{grp}', period '{period}': "
                            f"inconsistent probabilities specified"
                        )
        
        # If no probabilities specified, use equal weights
        if probs_for_group is None:
            probs_for_group = [1.0 / arr_len] * arr_len
            if grp:  # Only warn for grouped variables
                print(f"[TIP] Group '{grp}', period '{period}': no probabilities specified, using equal weights")
        
        # Normalize probabilities
        probs_arr = np.array(probs_for_group, dtype=float)
        probs_arr = np.maximum(probs_arr, 0.0)
        s = probs_arr.sum()
        if s <= 0:
            raise SystemExit(f"[ERROR] Non-positive probability sum for group '{grp}', period '{period}'")
        if abs(s - 1.0) > TOL_PROB_SUM:
            probs_arr = probs_arr / s
        
        # Store in disc_map for each variable
        for v, vals, _ in entries:
            vals_arr = np.array(vals, dtype=float)
            disc_map[(v, period)] = (vals_arr, probs_arr)
    
    # Get periods
    periods = _chronological_periods([p for _, p, _, _, _ in rows_expanded])
    
    # Build group_map: period -> {group_name: [var_names]}
    group_map: Dict[str, Dict[str, List[str]]] = {}
    for period in periods:
        group_map[period] = {}
        for v in var_names:
            grp = var_groups[v]
            if (v, period) not in disc_map:
                continue  # Variable not defined for this period
            if grp:
                if grp not in group_map[period]:
                    group_map[period][grp] = []
                group_map[period][grp].append(v)
    
    # Calculate scenario space info
    scenario_info = calculate_scenario_space(var_names, periods, disc_map, group_map, var_groups)
    
    return var_names, periods, disc_map, group_map, var_groups, scenario_info

# =========================
# Scenario Space Analysis
# =========================

def calculate_scenario_space(
    var_names: List[str],
    periods: List[str],
    disc_map: Dict[Tuple[str, str], Tuple[np.ndarray, np.ndarray]],
    group_map: Dict[str, Dict[str, List[str]]],
    var_groups: Dict[str, Optional[str]]
) -> Dict:
    """Calculate scenario space considering groups."""
    
    # Count unique groups (across all periods)
    all_groups: Set[str] = set()
    for period_groups in group_map.values():
        all_groups.update(period_groups.keys())
    
    # Count independent variables
    independent_vars = [v for v, g in var_groups.items() if g is None]
    
    # Calculate scenarios per period
    scenarios_per_period = []
    for period in periods:
        scenarios = 1
        groups_in_period = group_map.get(period, {})
        
        # Multiply scenarios from each group
        for grp, vars_in_grp in groups_in_period.items():
            if vars_in_grp:
                # All vars in group have same array length (validated earlier)
                v = vars_in_grp[0]
                if (v, period) in disc_map:
                    vals, _ = disc_map[(v, period)]
                    scenarios *= len(vals)
        
        # Multiply scenarios from independent variables
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
        "min_scenarios": min(scenarios_per_period) if scenarios_per_period else 0,
        "max_scenarios": max(scenarios_per_period) if scenarios_per_period else 0,
        "median_scenarios": int(np.median(scenarios_per_period)) if scenarios_per_period else 0,
    }

def print_scenario_analysis(info: Dict, runs: int, time_per_run: Optional[int] = None):
    """Print detailed scenario space analysis."""
    print("\n" + "="*70)
    print("SCENARIO SPACE ANALYSIS")
    print("="*70)
    
    print(f"\nVariables: {info['total_vars']} total")
    print(f"  - Grouped: {info['grouped_vars']} variables in {info['num_groups']} groups")
    print(f"  - Independent: {info['independent_vars']} variables")
    print(f"Periods: {info['num_periods']}")
    
    print(f"\nScenarios per period:")
    if info['min_scenarios'] == info['max_scenarios']:
        print(f"  - Constant: {info['median_scenarios']:,} per period")
    else:
        print(f"  - Range: {info['min_scenarios']:,} to {info['max_scenarios']:,}")
        print(f"  - Median: {info['median_scenarios']:,} per period")
    
    median_scen = info['median_scenarios']
    n_periods = info['num_periods']
    
    # Calculate total scenario space (product across periods)
    # Use geometric mean for varying scenarios per period
    if info['min_scenarios'] == info['max_scenarios']:
        # Simple case: constant scenarios
        if median_scen > 0 and n_periods > 0:
            # Check if we can calculate it without overflow
            log_total = n_periods * np.log10(median_scen)
            if log_total > 100:  # Would overflow
                total_space_str = f"{median_scen}^{n_periods} (astronomically large)"
                total_space = None
            elif log_total > 15:  # Very large but representable
                exponent = int(log_total)
                mantissa = 10 ** (log_total - exponent)
                total_space_str = f"{mantissa:.2f} × 10^{exponent}"
                total_space = 10 ** log_total
            else:
                total_space = median_scen ** n_periods
                total_space_str = f"{total_space:,.0f}"
        else:
            total_space = 0
            total_space_str = "0"
    else:
        # Varying scenarios: use geometric mean as estimate
        geom_mean = np.exp(np.mean(np.log([s for s in info['scenarios_per_period'] if s > 0])))
        log_total = n_periods * np.log10(geom_mean)
        if log_total > 100:
            total_space_str = f"~{geom_mean:.1f}^{n_periods} (astronomically large)"
            total_space = None
        elif log_total > 15:
            exponent = int(log_total)
            mantissa = 10 ** (log_total - exponent)
            total_space_str = f"~{mantissa:.2f} × 10^{exponent}"
            total_space = 10 ** log_total
        else:
            total_space = geom_mean ** n_periods
            total_space_str = f"~{total_space:,.0f}"
    
    print(f"\nTotal scenario space (across all {n_periods} periods):")
    print(f"  - {total_space_str}")
    
    # Determine scenario regime
    if total_space is not None and total_space < 1000:
        regime = "tiny"
    elif total_space is not None and total_space < 100000:
        regime = "small"
    elif total_space is not None and total_space < 10000000:
        regime = "medium"
    else:
        regime = "astronomical"
    
    print(f"\n" + "-"*70)
    print("RUN RECOMMENDATIONS")
    print("-"*70)
    
    # Recommendations based on regime, not coverage
    if regime == "tiny":  # < 1K scenarios
        quick = (50, 100)
        standard = (100, 300)
        rigorous = (300, 1000)
        rec_type = "exhaustive"
    elif regime == "small":  # 1K-100K
        quick = (100, 300)
        standard = (300, 1000)
        rigorous = (1000, 3000)
        rec_type = "high-coverage"
    elif regime == "medium":  # 100K-10M
        quick = (300, 1000)
        standard = (1000, 3000)
        rigorous = (3000, 10000)
        rec_type = "space-filling"
    else:  # astronomical
        quick = (100, 500)
        standard = (500, 2000)
        rigorous = (2000, 5000)
        rec_type = "statistical"
    
    def show_level(name: str, run_range: Tuple[int, int], use: str):
        r_min, r_max = run_range
        print(f"\n{name}:")
        print(f"  - Runs: {r_min:,} to {r_max:,}")
        
        # Show coverage only if meaningful
        if regime in ["tiny", "small"]:
            if total_space and total_space > 0:
                cov_min = (r_min / total_space * 100)
                cov_max = (r_max / total_space * 100)
                if cov_min > 100:
                    print(f"  - Coverage: Full space + {cov_min/100:.1f}x to {cov_max/100:.1f}x oversampling")
                else:
                    print(f"  - Coverage: {cov_min:.1f}% to {cov_max:.1f}%")
        else:
            # For large spaces, show actual coverage in scientific notation
            if total_space and total_space > 0:
                cov_min_pct = (r_min / total_space * 100)
                cov_max_pct = (r_max / total_space * 100)
                print(f"  - Coverage: {cov_min_pct:.2e}% to {cov_max_pct:.2e}%")
            else:
                print(f"  - Coverage: negligible (space is astronomical)")
        
        if time_per_run:
            t_min = r_min * time_per_run / 3600
            t_max = r_max * time_per_run / 3600
            print(f"  - Time: {t_min:.1f} to {t_max:.1f} hours")
        print(f"  - Use for: {use}")
    
    show_level("Quick (testing)", quick, "rapid iteration, sanity checks")
    show_level("Standard (typical)", standard, "regular forecasts, reliable statistics")
    show_level("Rigorous (final)", rigorous, "final reports, maximum confidence")
    
    if runs > 0:
        print(f"\n" + "-"*70)
        print(f"CURRENT CONFIGURATION: {runs:,} runs")
        
        if regime in ["tiny", "small"]:
            if total_space and total_space > 0:
                coverage = (runs / total_space * 100)
                if coverage > 100:
                    print(f"  - Coverage: Full space + {coverage/100:.1f}x oversampling")
                else:
                    print(f"  - Coverage: {coverage:.1f}%")
        else:
            if total_space and total_space > 0:
                coverage_pct = (runs / total_space * 100)
                print(f"  - Coverage: {coverage_pct:.2e}%")
                print(f"  - Sampled paths: {runs:,} out of {total_space_str} possible")
            else:
                print(f"  - Coverage: negligible (space is astronomical)")
                print(f"  - Sampled paths: {runs:,} out of {total_space_str} possible")
        
        if time_per_run:
            runtime = runs * time_per_run / 3600
            print(f"  - Estimated runtime: {runtime:.1f} hours")
    
    print("\n" + "="*70)
    print("INTERPRETATION")
    print("="*70)
    
    if regime == "tiny":
        print(f"Your scenario space is TINY ({total_space_str} total paths).")
        print(f"With {runs:,} runs, you can achieve near-exhaustive coverage.")
        print("Consider reducing runs to 50-100 for faster iteration.")
    elif regime == "small":
        print(f"Your scenario space is SMALL ({total_space_str} total paths).")
        print(f"Monte Carlo sampling will provide good coverage of the space.")
        if info['num_groups'] > 0:
            print(f"Grouping keeps the space manageable ({info['num_groups']} synchronized groups).")
    elif regime == "medium":
        print(f"Your scenario space is MEDIUM-SIZED ({total_space_str} total paths).")
        print("Monte Carlo focuses on space-filling rather than exhaustive coverage.")
        print(f"SOBOL sampling ensures runs are well-distributed across {n_periods} periods.")
    else:
        print(f"Your scenario space is ASTRONOMICAL ({total_space_str} possible paths).")
        print("This is NORMAL for multi-period forecasts with independent periods.")
        print(f"Example: {median_scen} scenarios/period × {n_periods} periods = {median_scen}^{n_periods}")
        print("\nWhy small coverage % is OK:")
        print("  • Monte Carlo doesn't need exhaustive coverage")
        print("  • SOBOL sampling distributes runs systematically across the space")
        print("  • More runs → better statistics, not more coverage")
        print(f"  • With {runs:,} runs, you get reliable statistical estimates")
        if info['num_groups'] > 0:
            print(f"\nGrouping helps: {info['num_groups']} groups enforce realistic co-movements")
            print("(Without groups, space would be even larger)")
    
    print("="*70 + "\n")

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
    """Generate Monte Carlo draws for discrete variables with groups."""
    
    n_vars = len(var_names)
    n_periods = len(periods)
    
    # Calculate total dimensions needed (considering groups)
    # Each group needs 1 U per period, each independent var needs 1 U per period
    dims_per_period = []
    for period in periods:
        dims = 0
        groups_in_period = group_map.get(period, {})
        dims += len(groups_in_period)  # One U per group
        # Count independent vars in this period
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
    
    # Reshape U: (runs, total_dims) -> list of period arrays
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
        
        # Assign U indices
        u_idx = 0
        
        # Process groups first
        for grp, vars_in_grp in groups_in_period.items():
            if not vars_in_grp:
                continue
            u_grp = U_period[:, u_idx]
            u_idx += 1
            
            # All vars in group use same U
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
            # Use first var in group to determine indices
            v0 = vars_in_grp[0]
            if (v0, period) in disc_map:
                vals, probs = disc_map[(v0, period)]
                base_idx = int(np.argmax(probs))
                best_idx = 0
                worst_idx = len(vals) - 1
                
                # Apply same indices to all vars in group
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
                best_mat[t, j] = vals[0]  # leftmost
                worst_mat[t, j] = vals[-1]  # rightmost
    
    # Assemble output DataFrame
    X_rvp = np.transpose(X, (0, 2, 1))  # (runs, vars, periods)
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
        description="Monte Carlo generator for discrete distributions with optional grouping"
    )
    ap.add_argument("--input-excel", required=True, help="Input Excel file path")
    ap.add_argument("--out", required=True, help="Output path (.csv or .xlsx)")
    ap.add_argument("--engine", choices=[ENGINE_SOBOL, ENGINE_RANDOM], 
                    help="Override Settings.engine")
    ap.add_argument("--runs", type=int, help="Override Settings.runs")
    ap.add_argument("--seed", type=int, help="Override Settings.seed")
    ap.add_argument("--block-size", type=int, default=DEFAULT_BLOCK_SIZE,
                    help="SOBOL block size for padding")
    ap.add_argument("--exact-n", action="store_true",
                    help="For SOBOL, cut to exactly N instead of padding to blocks")
    ap.add_argument("--recommend-runs", action="store_true",
                    help="Analyze scenario space and recommend run counts, then exit")
    ap.add_argument("--time-per-run", type=int,
                    help="Time per forecast run in seconds (for time estimates)")
    args = ap.parse_args()
    
    # Read inputs
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
    
    # If --recommend-runs, show analysis and exit
    if args.recommend_runs:
        print_scenario_analysis(scenario_info, runs, args.time_per_run)
        sys.exit(0)
    
    # Show startup summary
    print(f"[INFO] engine={engine}, runs={runs}, seed={seed}, block_size={block_size}, exact_n={exact_n}")
    print(f"[INFO] Variables: {scenario_info['total_vars']} total "
          f"({scenario_info['num_groups']} groups, {scenario_info['independent_vars']} independent)")
    print(f"[INFO] Periods: {scenario_info['num_periods']}, "
          f"Per-period scenarios: {scenario_info['median_scenarios']:,} (median)")
    
    # Calculate total space for startup summary
    median_scen = scenario_info['median_scenarios']
    n_periods = scenario_info['num_periods']
    if median_scen > 0 and n_periods > 0:
        log_total = n_periods * np.log10(median_scen)
        if log_total > 15:
            exponent = int(log_total)
            mantissa = 10 ** (log_total - exponent)
            print(f"[INFO] Total scenario space: {mantissa:.2f} × 10^{exponent} paths")
        elif log_total > 9:
            total = 10 ** log_total
            print(f"[INFO] Total scenario space: {total:,.0f} paths")
        else:
            total = median_scen ** n_periods
            print(f"[INFO] Total scenario space: {total:,} paths")
    
    if args.time_per_run:
        runtime = runs * args.time_per_run / 3600
        print(f"[INFO] Estimated runtime: {runtime:.1f} hours")
    print(f"[TIP] Use --recommend-runs --time-per-run 60 for detailed analysis")
    
    # Generate draws
    print("\n[INFO] Generating draws...")
    out, actual_runs = generate_draws(
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
    
    if engine == ENGINE_SOBOL and not exact_n and actual_runs != runs:
        print(f"[TIP] SOBOL padded to blocks: requested={runs:,}, actual={actual_runs:,}. "
              f"Use --exact-n to cut to exactly N")
    
    # Write output
    if args.out.lower().endswith(".xlsx"):
        out.to_excel(args.out, sheet_name="Draws", index=False)
    else:
        out.to_csv(args.out, index=False)
    
    print(f"\n[OK] Wrote {len(out):,} rows × {len(out.columns):,} cols to {args.out}")

if __name__ == "__main__":
    main()