# Monte Carlo Financial Dashboard

Dashboard interattivo (Streamlit + Plotly) per visualizzare simulazioni Monte Carlo di KPI finanziari.

## Requisiti & Installazione

### 1) Creare e attivare un ambiente (consigliato)
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

### 2) Installare le librerie
```bash
pip install -r requirements.txt
```

## Avvio (interattivo)
```bash
streamlit run app_streamlit/app.py
```
Poi apri il browser all'URL mostrato in console (tipicamente http://localhost:8501).

## Dati in input
Il file JSON deve avere la forma:
```json
{
  "version": "1.0",
  "meta": { "company": "ACME S.p.A.", "currency": "EUR", "periodicity": "annual" },
  "records": [
    { "scenario": "Sim_00001", "date": "2025-12-31", "kpi": "revenue", "value": 1234567.89 }
  ]
}
```
Metti i file in `data/` oppure caricali dall'app via upload.

## Funzionalità
- Istogrammi/KDE, box/violin plot
- Fan chart (bande 50% e 90%)
- Probabilità di superamento soglia
- Esportazioni CSV/PNG
- (Opzionale) clustering scenari

## Note
- Le date sono normalizzate a `Timestamp` e raggruppate per anno nella UI.
- Estendi `core/config.py` per etichette KPI e bande predefinite.
