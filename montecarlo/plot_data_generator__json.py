import json
from random import randint, uniform

meta = {
    "version": "1.0",
    "meta": {
        "company": "ACME S.p.A.",
        "currency": "EUR",
        "periodicity": "annual"
    },
    "records": []
}

scenarios = 50   # number of scenarios
years = [2025, 2026, 2027, 2028]
kpis = ["revenue", "ebitda", "net_income"]

for s in range(1, scenarios + 1):
    scenario = f"Sim_{s:05d}"
    for y in years:
        for kpi in kpis:
            meta["records"].append({
                "scenario": scenario,
                "date": f"{y}-12-31",
                "kpi": kpi,
                "value": round(uniform(80000, 2000000), 2)
            })

with open("plot_data.json", "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2, ensure_ascii=False)
