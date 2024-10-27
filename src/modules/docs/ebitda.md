# module EBITDA & taskLock SIMULATION__EBITDA__DAILY_INFO
#ebitda_const_id

Registra const di simulazione `$.EBITDA` che registra una funzione che restituisce l'EBITDA delle varie Unit dell'anno fiscale (setting di Unit $.END_OF_THE_FISCAL_YEAR__MONTH o altro setting da esso derivato)

Usage: `$.EBITDA(unit)`

Logic: every day reads from Ledger.getSimObjectsMovedYesterday() the last accounting movements of the previous day.

For every found Unit, compute the EBITDA.

Query settings to see if the previous day was the first day of the fiscal year: if it was, reset the EBITDA to 0 and start a new computation.
