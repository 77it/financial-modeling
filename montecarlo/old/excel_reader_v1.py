#!/usr/bin/env python3
import pandas as pd
import yaml
from pathlib import Path

def load_config(yaml_path):
    with open(yaml_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def read_excel_with_template(excel_path: Path, config: dict):
    wb = pd.ExcelFile(excel_path, engine="openpyxl")
    records = []

    for section_name, section in config.items():
        sheet_name = section["sheet_name"]
        start_row = section["start_row"] - 1      # YAML usa 1-based, pandas 0-based
        label_col = section["labels_column"] - 1
        data_start = section["data_columns_start"] - 1
        unit = section.get("unit", "EUR")

        if sheet_name not in wb.sheet_names:
            continue

        df = wb.parse(sheet_name, header=None, skiprows=start_row)
        df = df.dropna(how="all")   # elimina righe completamente vuote

        # colonna etichette
        labels = df.iloc[:, label_col].astype(str).str.strip()

        # intestazioni date (prima riga disponibile da data_start in poi)
        date_headers = df.iloc[0, data_start:]
        date_headers = [str(x).strip() for x in date_headers]

        # iterazione sulle voci mappate
        for kpi_key, label_text in section["labels"].items():
            # trova la riga con l'etichetta richiesta
            mask = labels == label_text
            if not mask.any():
                continue

            row = df.loc[mask].iloc[0]
            values = row[data_start:].tolist()

            # genera record tidy: uno per data
            for col_idx, val in enumerate(values):
                date = date_headers[col_idx] if col_idx < len(date_headers) else f"col{col_idx}"
                try:
                    val_float = float(val)
                except Exception:
                    continue
                if unit == "EUR_thousands":
                    val_float *= 1000
                records.append({
                    "section": section_name,
                    "kpi": kpi_key,
                    "date": date,
                    "value": val_float
                })

    return records

if __name__ == "__main__":
    import argparse, json
    ap = argparse.ArgumentParser(description="Read Excel using YAML template and output JSON flat records.")
    ap.add_argument("--excel", required=True, help="Path to Excel file")
    ap.add_argument("--yaml", required=True, help="Path to YAML config")
    ap.add_argument("--out", required=True, help="Output JSON file")
    args = ap.parse_args()

    cfg = load_config(args.yaml)
    recs = read_excel_with_template(Path(args.excel), cfg)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"records": recs}, f, indent=2, ensure_ascii=False)

    print(f"[OK] Wrote {len(recs)} records to {args.out}")
