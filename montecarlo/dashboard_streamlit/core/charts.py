from __future__ import annotations
import pandas as pd
import plotly.express as px
from .config import KPI_LABELS

def hist_kde(df_long: pd.DataFrame, kpi: str, date: pd.Timestamp, bins: int = 40):
    sub = df_long[(df_long["kpi"] == kpi) & (df_long["date"] == date)]
    fig = px.histogram(sub, x="value", nbins=bins, marginal="violin", opacity=0.85)
    fig.update_layout(title=f"Distribuzione – {KPI_LABELS.get(kpi,kpi)} – {date.date()}",
                      xaxis_title="Valore", yaxis_title="Frequenza")
    return fig

def box_by_year(df_long: pd.DataFrame, kpi: str):
    sub = df_long[df_long["kpi"] == kpi].copy()
    sub["year"] = sub["date"].dt.year
    fig = px.box(sub, x="year", y="value", points=False)
    fig.update_layout(title=f"Boxplot per anno – {KPI_LABELS.get(kpi,kpi)}",
                      xaxis_title="Anno", yaxis_title="Valore")
    return fig

def violin_by_year(df_long: pd.DataFrame, kpi: str):
    sub = df_long[df_long["kpi"] == kpi].copy()
    sub["year"] = sub["date"].dt.year
    fig = px.violin(sub, x="year", y="value", box=True, points=False)
    fig.update_layout(title=f"Violin plot per anno – {KPI_LABELS.get(kpi,kpi)}",
                      xaxis_title="Anno", yaxis_title="Valore")
    return fig

def fan_chart(df_bands: pd.DataFrame, kpi: str):
    # Expect columns: date, median, low_x, high_x, ... with ascending band widths
    fig = px.line(df_bands, x="date", y="median", markers=True,
                  title=f"Fan chart – {KPI_LABELS.get(kpi,kpi)}")
    # Add bands as filled areas (plot the widest first)
    band_cols = sorted(
        [(c.replace("low_",""), c) for c in df_bands.columns if c.startswith("low_")],
        key=lambda t: int(t[0])
    )
    for _, low_col in band_cols[::-1]:  # widest first
        p = low_col.split("_")[1]
        high_col = f"high_{p}"
        fig.add_traces(px.area(df_bands, x="date", y=[low_col, high_col]).data)
        fig.data[-2].name = f"Banda {p}%"
        fig.data[-1].name = f"Banda {p}%"
    fig.update_layout(showlegend=False, xaxis_title="Data", yaxis_title="Valore")
    return fig

def heatmap_prob(prob_df: pd.DataFrame):
    # columns: kpi, date, probability
    df = prob_df.copy()
    df["year"] = df["date"].dt.year
    pivot = df.pivot_table(index="kpi", columns="year", values="probability")
    fig = px.imshow(pivot, aspect="auto", color_continuous_scale="RdYlGn",
                    origin="lower", labels=dict(color="Probabilità"))
    fig.update_layout(title="Probabilità di superamento soglia")
    return fig
