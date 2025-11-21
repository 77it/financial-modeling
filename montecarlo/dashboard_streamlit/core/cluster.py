from __future__ import annotations
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

def build_feature_matrix(df_long: pd.DataFrame, include_kpis: list[str], years: list[int]) -> pd.DataFrame:
    sub = df_long[df_long["kpi"].isin(include_kpis)].copy()
    sub["year"] = sub["date"].dt.year
    sub = sub[sub["year"].isin(years)]
    # features: KPI-year columns
    sub["col"] = sub["kpi"] + "_" + sub["year"].astype(str)
    wide = sub.pivot_table(index="scenario", columns="col", values="value", aggfunc="first")
    wide = wide.dropna(axis=0, how="any")  # use complete cases
    return wide

def kmeans_cluster(features: pd.DataFrame, n_clusters: int = 3, random_state: int = 42):
    scaler = StandardScaler()
    X = scaler.fit_transform(features.values)
    model = KMeans(n_clusters=n_clusters, n_init="auto", random_state=random_state)
    labels = model.fit_predict(X)
    centers = scaler.inverse_transform(model.cluster_centers_)
    centers_df = pd.DataFrame(centers, columns=features.columns)
    out_labels = pd.Series(labels, index=features.index, name="cluster")
    return out_labels, centers_df
