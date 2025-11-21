from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd
from dateutil import parser as dateparser

@dataclass
class Meta:
    company: str
    currency: str
    periodicity: str

def _normalize_date(s: str) -> pd.Timestamp:
    # robust parsing, normalize to period-end date
    dt = dateparser.parse(s)
    return pd.Timestamp(dt)

def load_forecast_json(path: Path) -> Tuple[pd.DataFrame, Meta, Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        obj = json.load(f)
    version = obj.get("version")
    if version != "1.0":
        raise ValueError(f"Unsupported version: {version!r}. Expected '1.0'.")
    meta_obj = obj.get("meta") or {}
    meta = Meta(
        company=meta_obj.get("company", "N/A"),
        currency=meta_obj.get("currency", "EUR"),
        periodicity=meta_obj.get("periodicity", "annual"),
    )
    records = obj.get("records") or []
    if not records:
        raise ValueError("No 'records' found in JSON.")
    df = pd.DataFrame.from_records(records)
    required = {"scenario", "date", "kpi", "value"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in records: {missing}")
    # Normalize types
    df["scenario"] = df["scenario"].astype(str)
    df["kpi"] = df["kpi"].astype(str)
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df["date"] = df["date"].apply(_normalize_date)
    df = df.dropna(subset=["value"])
    return df, meta, obj
