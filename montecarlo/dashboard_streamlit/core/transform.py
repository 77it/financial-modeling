from __future__ import annotations
import pandas as pd
import numpy as np
from typing import Iterable, Tuple, Dict

def compute_percentiles(
    df_long: pd.DataFrame,
    quantiles: Iterable[float] = (0.05, 0.25, 0.5, 0.75, 0.95),
) -> pd.DataFrame:
    """
    df_long columns: scenario, date, kpi, value
    Returns multi-index rows by [kpi, date] and quantile columns.
    """
    q = np.array(list(quantiles))
    grouped = df_long.groupby(["kpi", "date"])["value"]
    out = grouped.quantile(q).unstack(level=-1)
    out.columns = [f"q_{int(x*100):02d}" for x in q]
    out = out.reset_index()
    return out

def exceed_probability(
    df_long: pd.DataFrame,
    threshold_by_kpi: Dict[str, float],
    direction_by_kpi: Dict[str, str] | None = None,
) -> pd.DataFrame:
    """
    Compute probability that a KPI exceeds (or stays below) a threshold per date.
    direction: "above" (default) or "below" for each kpi.
    """
    if direction_by_kpi is None:
        direction_by_kpi = {}
    def cond(k, v):
        thr = threshold_by_kpi.get(k, np.nan)
        if np.isnan(thr):
            return pd.Series(False, index=v.index)
        dirk = direction_by_kpi.get(k, "above")
        return (v >= thr) if dirk == "above" else (v <= thr)
    parts = []
    for (kpi, date), group in df_long.groupby(["kpi", "date"]):
        mask = cond(kpi, group["value"])
        prob = float(mask.mean()) if len(mask) else np.nan
        parts.append({"kpi": kpi, "date": date, "probability": prob})
    return pd.DataFrame(parts)

def to_wide(df_long: pd.DataFrame) -> pd.DataFrame:
    """
    Pivot to wide with index (scenario,date) and columns per KPI.
    """
    wide = df_long.pivot_table(
        index=["scenario", "date"], columns="kpi", values="value", aggfunc="first"
    ).reset_index()
    return wide

def fan_chart_data(df_long: pd.DataFrame, kpi: str, quantile_bands: list[tuple[float, float]]):
    """
    Return a DataFrame with columns: date, median, band_low_<p>, band_high_<p> for each band.
    """
    # Compute full quantiles
    qs = sorted({0.5, *[a for band in quantile_bands for a in band]})
    grp = df_long[df_long["kpi"] == kpi].groupby("date")["value"].quantile(qs).unstack()
    grp = grp.sort_index()  # date order
    out = pd.DataFrame({"date": grp.index, "median": grp[0.5].values})
    for low, high in quantile_bands:
        out[f"low_{int(low*100)}"] = grp[low].values
        out[f"high_{int(high*100)}"] = grp[high].values
    return out
