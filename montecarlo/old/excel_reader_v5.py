#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel → JSON records exporter with YAML mapping (directory mode, scenario=filename).

CHANGES
-------
- Reads a folder of Excel files via --excel-dir (non-recursive).
- For each Excel file, sets scenario = file name without extension.
- Meta fields (company, currency, periodicity) are read from YAML (no CLI flags).
- No meta.kpis in output.
- No scaling. YAML `unit` is informational only.
- Verbose guardrails retained (warnings for missing labels/sheets/headers).

USAGE
-----
    python excel_to_records_dir.py \
        --excel-dir path/to/folder \
        --yaml      path/to/mapping.yaml \
        --out       output.json

The script will include *.xlsx and *.xlsm files in the directory (not recursive).

YAML EXAMPLE
------------
meta:
  company: "ACME S.p.A."
  currency: "EUR"
  periodicity: "annual"

balance_sheet:
  sheet_name: "SP"
  start_row: 3
  labels_column: 1
  data_columns_start: 2
  unit: "EUR_thousands"  # informational only
  labels:
    cash: "Cassa"
    financial_debts_line_of_credits: "Fidi di conto"
    financial_debts_loans: "Finanziamenti bancari"
    total_assets: "Totale attivo"

income_statement:
  sheet_name: "CE"
  start_row: 3
  labels_column: 1
  data_columns_start: 2
  unit: "EUR_thousands"
  labels:
    revenue: "Ricavi"
    ebitda: "MOL"
    net_income: "Utile di esercizio"

cash_flow:
  sheet_name: "CF"
  start_row: 3
  labels_column: 1
  data_columns_start: 2
  unit: "EUR_thousands"
  labels:
    cfo: "Flusso di cassa operativo"
    cfi: "Flusso di cassa investimenti"
    cff: "Flusso di cassa finanziamento"
    capex: "Capex"

OUTPUT SHAPE
------------
{
  "version": "1.0",
  "meta": {
    "company": "...",
    "currency": "EUR",
    "periodicity": "annual"
  },
  "records": [
    { "scenario": "WorkbookA", "date": "2025-12-31", "kpi": "revenue", "value": 123.45 },
    ...
  ]
}

DEPENDENCIES
------------
pip install pandas openpyxl pyyaml python-dateutil
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import pandas as pd
import yaml
from dateutil import parser as dateparser


# ----------------------------- Logging ----------------------------------------


def warn(msg: str) -> None:
    print(f"[WARN] {msg}")


def info(msg: str) -> None:
    print(f"[INFO] {msg}")


# ----------------------------- Utilities --------------------------------------


def normalize_label(s: str) -> str:
    """Normalize a label for robust matching (trim, lower, collapse spaces)."""
    if s is None:
        return ""
    return " ".join(str(s).strip().lower().split())


def try_parse_date(cell: Any) -> Optional[str]:
    """
    Try to parse a cell into ISO date (YYYY-MM-DD).
    Accepts pandas Timestamp, datetime, or string (e.g., '31/12/2025', '2025-12-31').
    Returns None if unparseable or empty.
    """
    if pd.isna(cell) or cell == "":
        return None
    # Fast path for real datetime-like objects
    if isinstance(cell, (pd.Timestamp, dt.datetime, dt.date)):
        try:
            d = cell.date() if hasattr(cell, "date") else cell
            return d.isoformat()
        except Exception:
            pass
    try:
        dt = dateparser.parse(str(cell), dayfirst=True, yearfirst=False, fuzzy=True)
        return dt.date().isoformat()
    except Exception:
        return None


def safe_float(x: Any) -> Optional[float]:
    """Convert to float if finite; return None for NaN/inf/empty/non-numeric."""
    if x is None:
        return None
    try:
        f = float(x)
        if math.isfinite(f):
            return f
        return None
    except Exception:
        return None


# ----------------------------- YAML Specs -------------------------------------


class MetaSpec:
    """Top-level meta specification loaded from YAML (no scenario here)."""
    def __init__(self, data: Dict[str, Any]):
        self.company: str = str(data.get("company", "")).strip()
        self.currency: str = str(data.get("currency", "")).strip()
        self.periodicity: str = str(data.get("periodicity", "")).strip()

        missing = [k for k in ("company", "currency", "periodicity") if not str(data.get(k, "")).strip()]
        if missing:
            raise ValueError(f"YAML meta is missing required fields: {', '.join(missing)}")


class SectionSpec:
    """Per-section spec parsed from YAML."""
    def __init__(self, name: str, spec: Dict[str, Any]):
        self.name = name
        try:
            self.sheet_name: str = spec["sheet_name"]
            self.start_row: int = int(spec["start_row"])
            self.labels_column: int = int(spec["labels_column"])
            self.data_columns_start: int = int(spec["data_columns_start"])
        except KeyError as e:
            raise ValueError(f"Section '{name}' missing required key: {e}") from e

        # unit is informational; no scaling performed
        self.unit: str = str(spec.get("unit", "")).strip()
        self.labels_map: Dict[str, str] = spec.get("labels", {}) or {}
        if not isinstance(self.labels_map, dict):
            raise ValueError(f"Section '{name}': 'labels' must be a mapping of kpi -> label_text.")
        if not self.labels_map:
            warn(f"Section '{name}' has empty 'labels' mapping.")


def load_yaml_mapping(path: Path) -> Tuple[MetaSpec, Dict[str, SectionSpec]]:
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not isinstance(data, dict) or not data:
        raise ValueError("YAML mapping must be a non-empty mapping.")

    if "meta" not in data or not isinstance(data["meta"], dict):
        raise ValueError("YAML must contain a 'meta' mapping with company, currency, periodicity.")

    meta = MetaSpec(data["meta"])

    sections: Dict[str, SectionSpec] = {}
    for sec_name, sec_spec in data.items():
        if sec_name == "meta":
            continue
        if not isinstance(sec_spec, dict):
            raise ValueError(f"Section '{sec_name}' spec must be a mapping.")
        sections[sec_name] = SectionSpec(sec_name, sec_spec)

    if not sections:
        raise ValueError("YAML contains no data sections (e.g., 'income_statement', 'balance_sheet', ...).")

    return meta, sections


# ---------------------------- Extraction Helpers ------------------------------


def build_label_index(df: pd.DataFrame, row_start: int, labels_col: int) -> Dict[str, int]:
    """
    Build an index: normalized label text → row index (0-based in DataFrame).
    Scans from start_row to the end in the given labels column.
    """
    labels_row_start_0 = row_start - 1  # convert 1-based to 0-based
    labels_col_0 = labels_col - 1

    label_to_row: Dict[str, int] = {}
    for r0 in range(labels_row_start_0, len(df)):
        cell = df.iat[r0, labels_col_0] if labels_col_0 < df.shape[1] else None
        if pd.isna(cell) or (str(cell).strip() == ""):
            continue
        norm = normalize_label(str(cell))
        if norm:
            label_to_row[norm] = r0
    return label_to_row


def extract_dates_from_header(
    df: pd.DataFrame,
    header_row_index_1based: int,
    first_data_col_1based: int
) -> List[Tuple[int, str]]:
    """
    Read dates from the header row (1-based), starting at first_data_col_1based.
    Returns list of tuples: (0-based column index, ISO date).
    Skips blank/unparseable headers.
    """
    header_r0 = header_row_index_1based - 1
    start_c0 = first_data_col_1based - 1
    out: List[Tuple[int, str]] = []

    if header_r0 < 0 or header_r0 >= len(df):
        warn(f"Header row {header_row_index_1based} is outside the sheet range.")
        return out

    for c0 in range(start_c0, df.shape[1]):
        hdr = df.iat[header_r0, c0] if c0 < df.shape[1] else None
        iso = try_parse_date(hdr)
        if iso is None:
            # Skip sparsely; do not stop at first empty.
            continue
        out.append((c0, iso))

    if not out:
        warn(f"No parseable date headers found on row {header_row_index_1based} starting col {first_data_col_1based}.")
    return out


def section_records(
    wb: pd.ExcelFile,
    sec: SectionSpec,
    scenario: str
) -> List[Dict[str, Any]]:
    """Extract records for a single section."""
    try:
        # Engine is bound to ExcelFile; do not pass it here
        df = wb.parse(sec.sheet_name, header=None, dtype=object)
    except ValueError as e:
        # Typical error when a sheet doesn't exist
        warn(f"Sheet '{sec.sheet_name}' not found or unreadable: {e}")
        return []
    except Exception as e:
        warn(f"Error reading sheet '{sec.sheet_name}': {e}")
        return []

    # Dates row: start_row - 1
    header_row_1b = sec.start_row - 1
    date_cols = extract_dates_from_header(df, header_row_1b, sec.data_columns_start)

    # Index labels
    label_idx = build_label_index(df, sec.start_row, sec.labels_column)

    out: List[Dict[str, Any]] = []
    skipped_cells = 0
    for kpi, label_text in sec.labels_map.items():
        norm_label = normalize_label(label_text)
        if norm_label not in label_idx:
            warn(f"[{sec.name}] Label not found for KPI '{kpi}': '{label_text}'")
            continue

        row0 = label_idx[norm_label]
        for c0, iso_date in date_cols:
            # c0 is already <= df.shape[1] by construction; guard kept cheap
            if c0 >= df.shape[1]:
                continue
            raw_val = df.iat[row0, c0]
            val = safe_float(raw_val)
            if val is None:
                # Count and skip empty/non-numeric cells; summarize later
                skipped_cells += 1
                continue

            out.append({
                "scenario": scenario,
                "date": iso_date,
                "kpi": kpi,
                "value": float(val),
            })

    if skipped_cells:
        warn(f"[{sec.name}] Skipped {skipped_cells} empty/non-numeric cell(s) across mapped KPIs.")

    return out


def extract_from_workbook(
    xlsx_path: Path,
    sections: Dict[str, SectionSpec]
) -> List[Dict[str, Any]]:
    """
    Open one workbook and extract records for all sections.
    scenario is the workbook filename (without extension).
    """
    scenario = xlsx_path.stem
    try:
        with pd.ExcelFile(xlsx_path, engine="openpyxl") as wb:
            all_records: List[Dict[str, Any]] = []
            for sec in sections.values():
                all_records.extend(section_records(wb=wb, sec=sec, scenario=scenario))
            return all_records
    except Exception as e:
        warn(f"Cannot open Excel file '{xlsx_path}': {e}")
        return []


# ------------------------------- CLI / Main -----------------------------------


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Extract KPI records from all Excel files in a directory using a YAML mapping (meta from YAML)."
    )
    p.add_argument("--excel-dir", required=True, type=Path, help="Directory containing Excel files (.xlsx, .xlsm).")
    p.add_argument("--yaml", required=True, type=Path, help="Path to the YAML mapping file (with top-level 'meta').")
    p.add_argument("--out", required=True, type=Path, help="Output JSON file path.")
    return p.parse_args()


def main() -> None:
    args = parse_args()

    if not args.excel_dir.exists() or not args.excel_dir.is_dir():
        raise FileNotFoundError(f"Excel directory not found or not a directory: {args.excel_dir}")
    if not args.yaml.exists():
        raise FileNotFoundError(f"YAML mapping not found: {args.yaml}")

    meta, sections = load_yaml_mapping(args.yaml)

    # Collect Excel files (non-recursive): .xlsx and .xlsm
    excel_files = sorted(list(args.excel_dir.glob("*.xlsx")) + list(args.excel_dir.glob("*.xlsm")))
    if not excel_files:
        raise FileNotFoundError(f"No .xlsx/.xlsm files found in: {args.excel_dir}")

    info(f"Found {len(excel_files)} workbook(s) in {args.excel_dir}.")

    # Extract from each workbook
    all_records: List[Dict[str, Any]] = []
    for x in excel_files:
        info(f"Processing: {x.name}")
        recs = extract_from_workbook(x, sections)
        info(f"  → {len(recs)} record(s).")
        all_records.extend(recs)

    output = {
        "version": "1.0",
        "meta": {
            "company": meta.company,
            "currency": meta.currency,
            "periodicity": meta.periodicity,
        },
        "records": all_records,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    info(f"Wrote {len(all_records)} records to: {args.out}")


if __name__ == "__main__":
    main()
