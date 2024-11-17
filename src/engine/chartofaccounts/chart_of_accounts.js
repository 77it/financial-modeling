/*
Se Chart Of Accounts ha date Historical e di simulazione, come distinguerle?
Non serve, perché Chart Of Accounts non memorizza (come fa `agenda.js`):
colonne di date di simulazione (che iniziano per SIMULATION_COLUMN_PREFIX) se hanno una data precedente a $$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE della Unit
colonne di date di simulazione (che iniziano per HISTORICAL_COLUMN_PREFIX) se hanno una data successiva o uguale a $$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE della Unit
 */

class ChartOfAccounts {
}
