#!/usr/bin/env python3
"""
analyze_scenario_space.py

Fast analysis tool for Monte Carlo scenario space.
Reads input Excel, validates structure, and provides run recommendations.
Does NOT generate samples - use generate_monte_carlo.py for that.
"""
from __future__ import annotations

import argparse
from typing import Dict, List, Tuple, Optional, Set
import json

import numpy as np
import pandas as pd
from datetime import datetime

# =========================
# Constants
# =========================
SHEET_VARIABLES: str = "Variables"
SHEET_SETTINGS: str = "Settings"

COL_VARIABLE: str = "variable"
COL_MONTH: str = "date"
COL_VALUES: str = "best <-> worst values"
COL_PROBS: str = "probabilities"
COL_GROUP: str = "group"

SET_KEY: str = "key"
SET_VALUE: str = "value"

# Recommended powers of 2 for SOBOL sampling (optimal convergence)
RECOMMENDED_RUNS: List[int] = [64, 128, 256, 512, 1024, 2048, 4096]

DEFAULT_TIME_PER_RUN: int = 60  # seconds
DEFAULT_RUNS: int = 256  # Power of 2 for optimal SOBOL performance
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
    
    # Calculate total scenario space
    if info['min_scenarios'] == info['max_scenarios']:
        if median_scen > 0 and n_periods > 0:
            log_total = n_periods * np.log10(median_scen)
            if log_total > 100:
                total_space_str = f"{median_scen}^{n_periods} (astronomically large)"
                total_space = None
            elif log_total > 15:
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
    
    # Calculate dimensions: groups + independent vars (effective sampling dimensions)
    dimensions = info['num_groups'] + info['independent_vars']
    
    # Base recommendations on actual problem characteristics
    # Rule 1: For statistics, need minimum samples
    stat_min = 100  # Minimum for percentiles
    
    # Rule 2: For space-filling, scale with dimensionality
    # SOBOL benefits from 10-20 samples per dimension
    dim_based = max(128, dimensions * 15)  # 15 samples per dimension
    
    # Rule 3: For small spaces, target coverage percentage
    if total_space is not None and total_space < 10000:
        # Small space: aim for significant coverage
        coverage_based_min = int(total_space * 0.5)  # 50% coverage
        coverage_based_max = int(total_space * 2.0)  # 200% oversampling
    elif total_space is not None and total_space < 1000000:
        # Medium space: aim for reasonable coverage
        coverage_based_min = int(total_space * 0.01)  # 1% coverage
        coverage_based_max = int(total_space * 0.10)  # 10% coverage
    else:
        # Large/astronomical space: coverage irrelevant, use dimension-based
        coverage_based_min = dim_based
        coverage_based_max = dim_based * 4
    
    # Combine rules: max(stat_min, dim_based, coverage_based) then round to power of 2
    def round_to_power_of_2(n: int) -> int:
        """Round to nearest power of 2 from RECOMMENDED_RUNS."""
        if n <= 64:
            return 64
        for r in RECOMMENDED_RUNS:
            if n <= r:
                return r
        return 4096  # Cap at max recommended
    
    # Calculate recommendations
    base_min = max(stat_min, dim_based, coverage_based_min)
    base_max = max(base_min * 2, coverage_based_max)
    
    quick_min = round_to_power_of_2(int(base_min * 0.5))
    quick_max = round_to_power_of_2(int(base_min))
    
    standard_min = round_to_power_of_2(base_min)
    standard_max = round_to_power_of_2(int(base_min * 2))
    
    rigorous_min = round_to_power_of_2(int(base_min * 2))
    rigorous_max = round_to_power_of_2(min(int(base_max), 4096))
    
    quick = (quick_min, quick_max)
    standard = (standard_min, standard_max)
    rigorous = (rigorous_min, rigorous_max)
    
    # Show calculation rationale
    print(f"\nCalculation basis:")
    print(f"  - Dimensions: {dimensions} (groups + independent vars)")
    print(f"  - Scenarios per period: {median_scen:,}")
    if total_space and total_space < 1000000:
        print(f"  - Total space: {total_space:,.0f}")
        print(f"  - Strategy: Coverage-focused")
    else:
        print(f"  - Total space: {total_space_str}")
        print(f"  - Strategy: Dimension-based space-filling")
    print(f"  - Minimum for statistics: {stat_min} samples")
    
    def show_level(name: str, run_range: Tuple[int, int], use: str):
        r_min, r_max = run_range
        print(f"\n{name}:")
        print(f"  - Runs: {r_min:,} to {r_max:,}")
        
        if regime in ["tiny", "small"]:
            if total_space and total_space > 0:
                cov_min = (r_min / total_space * 100)
                cov_max = (r_max / total_space * 100)
                if cov_min > 100:
                    print(f"  - Coverage: Full space + {cov_min/100:.1f}x to {cov_max/100:.1f}x oversampling")
                else:
                    print(f"  - Coverage: {cov_min:.1f}% to {cov_max:.1f}%")
        else:
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
# Main
# =========================

def main():
    ap = argparse.ArgumentParser(
        description="Analyze Monte Carlo scenario space and provide run recommendations"
    )
    ap.add_argument("--input-excel", required=True, help="Input Excel file path")
    ap.add_argument("--runs", type=int, default=DEFAULT_RUNS,
                    help=f"Number of runs to evaluate (default: {DEFAULT_RUNS}). "
                         f"Powers of 2 recommended: {RECOMMENDED_RUNS[:5]}")
    ap.add_argument("--time-per-run", type=int, default=DEFAULT_TIME_PER_RUN,
                    help=f"Time per forecast run in seconds (default: {DEFAULT_TIME_PER_RUN}; use 0 to disable time estimates)")
    args = ap.parse_args()
    
    print("[INFO] Reading and validating input...")
    variables, settings = read_inputs(args.input_excel)
    var_names, periods, disc_map, group_map, var_groups, scenario_info = validate_and_prepare(variables)
    
    # Get runs from args or settings
    runs = args.runs if args.runs != DEFAULT_RUNS else int(settings.get("runs", str(DEFAULT_RUNS)))
    time_per_run = args.time_per_run if args.time_per_run > 0 else None
    
    print("[OK] Input validated successfully\n")
    
    # Show analysis
    print_scenario_analysis(scenario_info, runs, time_per_run)
    
    print("[TIP] To generate samples, use: generate_monte_carlo.py --input-excel <file> --out <output>")

if __name__ == "__main__":
    main()