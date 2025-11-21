from __future__ import annotations
import json
from pathlib import Path
import streamlit as st
import pandas as pd
import numpy as np

# --- make project root importable ---
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]  # mc_dashboard/
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
# ------------------------------------

from core.loader import load_forecast_json
from core.transform import compute_percentiles, exceed_probability, to_wide, fan_chart_data
from core.risk import breach_probability, var_like
from core.charts import hist_kde, box_by_year, violin_by_year, fan_chart, heatmap_prob
from core.config import KPI_LABELS, FAN_CHART_BANDS, HIST_BINS

st.set_page_config(page_title="Monte Carlo Financial Dashboard", layout="wide")

st.title("📊 Monte Carlo Financial Dashboard")
st.caption("Visualizzazione probabilistica per 10.000+ simulazioni – SP, CE, Rendiconto")

# Sidebar: data source
st.sidebar.header("Dati in input")
uploaded = st.sidebar.file_uploader("Carica JSON (version 1.0)", type=["json"])
default_path = Path(__file__).resolve().parents[1] / "data" / "example.json"

@st.cache_data(show_spinner=False)
def _load(path_str: str):
    df, meta, raw = load_forecast_json(Path(path_str))
    return df, meta, raw

if uploaded:
    df, meta, raw = load_forecast_json(Path(uploaded.name))
    # Workaround: Streamlit gives a BytesIO, write temp
    tmp = Path(st.session_state.get("_tmp_path", "uploaded.json"))
    tmp.write_bytes(uploaded.getvalue())
    st.session_state["_tmp_path"] = str(tmp)
    df, meta, raw = _load(str(tmp))
else:
    df, meta, raw = _load(str(default_path))

kpis = sorted(df["kpi"].unique())
years = sorted(df["date"].dt.year.unique())

st.sidebar.subheader("Filtri")
kpi_sel = st.sidebar.selectbox("KPI", kpis, index=0)
year_sel = st.sidebar.selectbox("Anno", years, index=0)
bins = st.sidebar.slider("Bins istogramma", min_value=10, max_value=120, value=HIST_BINS, step=5)
show_violin = st.sidebar.checkbox("Mostra violin plot", value=True)
st.sidebar.divider()
st.sidebar.subheader("Fan chart")
bands_default = FAN_CHART_BANDS
st.sidebar.caption("Bande di confidenza predefinite 50% e 90%")
st.sidebar.divider()
st.sidebar.subheader("Soglie & Rischio")
threshold = st.sidebar.number_input("Soglia KPI (per probabilità di superamento)", value=float(df[df["kpi"]==kpi_sel]["value"].median()))
direction = st.sidebar.selectbox("Direzione", options=["above","below"], index=0 if kpi_sel.lower()=="dscr" else 0)

# Top KPI cards (percentili rapidi)
perc = compute_percentiles(df)
perc_year = perc[perc["date"].dt.year == year_sel]
row = perc_year[perc_year["kpi"] == kpi_sel].squeeze()
c1, c2, c3, c4, c5 = st.columns(5)
for c, label in zip([c1,c2,c3,c4,c5], ["q_05","q_25","q_50","q_75","q_95"]):
    val = row[label] if label in row else np.nan
    c.metric(label.replace("q_","P") + f" – {year_sel}", f"{val:,.2f}")

st.markdown("### Distribuzione scenario singolo anno")
col1, col2 = st.columns([2,2])
with col1:
    st.plotly_chart(hist_kde(df, kpi_sel, pd.Timestamp(year_sel,12,31), bins=bins), use_container_width=True)
with col2:
    if show_violin:
        st.plotly_chart(violin_by_year(df, kpi_sel), use_container_width=True)
    else:
        st.plotly_chart(box_by_year(df, kpi_sel), use_container_width=True)

st.markdown("### Fan chart")
bands_df = fan_chart_data(df, kpi_sel, bands_default)
st.plotly_chart(fan_chart(bands_df, kpi_sel), use_container_width=True)

st.markdown("### Probabilità di superamento soglia")
prob_df = exceed_probability(df, {kpi_sel: threshold}, {kpi_sel: "above" if direction=="above" else "below"})
st.plotly_chart(heatmap_prob(prob_df), use_container_width=True)

st.sidebar.divider()
st.sidebar.subheader("Esporta")
if st.sidebar.button("Esporta percentili (CSV)"):
    st.sidebar.download_button("Scarica percentili.csv", data=perc.to_csv(index=False).encode("utf-8"), file_name="percentiles.csv")
