//#region engine config
// Number of the years from today to set Simulation End Date, if no other value to set this date is provided
export const DEFAULT_NUMBER_OF_YEARS_FROM_TODAY = 5;
// Rounding mode to use when storing numbers in the ledger; if true, use Math.round(), otherwise use Math.floor()
export const ROUNDING_MODE = true;
// Decimal places to use when storing numbers in the ledger
export const DECIMAL_PLACES = 4;

export const SIMULATION_NAME = '$';
export const SCENARIO_BASE = 'base';

export const IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES = '$$';
export const IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES = '$';
//#endregion engine config

//#region modules config
export const SIMULATION_COLUMN_PREFIX = '#';
export const HISTORICAL_COLUMN_PREFIX = 'H#';

export const BS_CASH__BANKACCOUNT_FINANCIALACCOUNT__NAME = 'cash_account_1';
//#endregion modules config
