from __future__ import annotations

# Human labels for KPIs (extend as needed)
KPI_LABELS = {
    "revenue": "Ricavi",
    "ebitda": "EBITDA",
    "net_income": "Utile Netto",
    "dscr": "DSCR",
    "net_debt": "Posizione Finanziaria Netta",
}

# Default percentile bands for fan charts (expressed as quantiles 0..1)
FAN_CHART_BANDS = [(0.05, 0.95), (0.25, 0.75)]  # 90% and 50% bands

# Default histogram bin count
HIST_BINS = 40

# Number of clusters for optional scenario clustering
DEFAULT_N_CLUSTERS = 3
