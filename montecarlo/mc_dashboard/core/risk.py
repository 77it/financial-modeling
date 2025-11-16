from __future__ import annotations
import pandas as pd
import numpy as np

def breach_probability(df_long: pd.DataFrame, kpi: str, threshold: float, direction: str = "below") -> pd.DataFrame:
    """
    Probability of breaching a covenant threshold for a KPI per date.
    direction: "below" (default) flags values < threshold as breach; "above" flags values > threshold.
    Returns DataFrame with columns: date, breach_prob.
    """
    sub = df_long[df_long["kpi"] == kpi].copy()
    if sub.empty:
        return pd.DataFrame(columns=["date", "breach_prob"])
    if direction == "below":
        cond = sub["value"] < threshold
    else:
        cond = sub["value"] > threshold
    probs = sub.assign(breach=cond).groupby("date")["breach"].mean().reset_index(name="breach_prob")
    return probs

def var_like(df_long: pd.DataFrame, kpi: str, alpha: float = 0.05) -> pd.DataFrame:
    """
    Left-tail quantile per date for the KPI (e.g., 5% quantile for loss-like metrics).
    Returns DataFrame with columns: date, var_alpha.
    """
    sub = df_long[df_long["kpi"] == kpi]
    if sub.empty:
        return pd.DataFrame(columns=["date", "var_alpha"])
    out = sub.groupby("date")["value"].quantile(alpha).reset_index(name="var_alpha")
    return out
