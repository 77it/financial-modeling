import { deepFreeze } from '../lib/obj_utils.js';
import { GlobalImmutableValue } from '../lib/global_immutable_value.js';

//#region config used by engine and Excel UI
export const SIMULATION_NAME = '$';
export const SCENARIO_BASE = 'base';
export const FML_PREFIX = ['`'];  // prefix to mark formulas in the Excel UI and in the engine
deepFreeze(FML_PREFIX);
export const ARRAY_ARITHMETIC_PREFIX = '<';  // prefix to mark formulas in the Excel UI and in the engine
//#endregion config used by engine and Excel UI

//#region modules config, used by engine and Excel UI
export const SIMULATION_COLUMN_PREFIX = '#';
export const HISTORICAL_COLUMN_PREFIX = 'H#';

export const DEFAULT_UNIT_ID = 'CompanyA';

export const BS_CASH__BANKACCOUNT_FINANCIALACCOUNT__NAME = 'cash_account_1';
//#endregion modules config, used by engine and Excel UI

//#region internal engine config
// Number of the years from today to set Simulation End Date, if no other value to set this date is provided
export const DEFAULT_NUMBER_OF_YEARS_FROM_TODAY = 5;
// Rounding mode to use when storing numbers in the ledger; if true, use Math.round(), otherwise use Math.floor()
export const ROUNDING_MODE = true;
// Decimal places to use when storing numbers in the ledger
export const DECIMAL_PLACES = 4;

// config used during init of Settings and Drivers classes
export const IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES = '$$';
export const IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES = '$';
// This value is replaced, during engine execution, with value of simulation setting `$$DRIVER_PREFIXES__ZERO_IF_NOT_SET`.
export const DRIVER_PREFIXES__ZERO_IF_NOT_SET = new GlobalImmutableValue();

// Formula and YAML cache size
export const FML_CACHE_SIZE = 10_000;
export const YAML_CACHE_SIZE = 10_000;
//#endregion internal engine config

//#region other config
// If true, the validation of the data is disabled in 'schema_validation_utils.js/validate()';
// not recommended to set this to true, is usable for testing purposes or (maybe) to speed up the execution of the engine, thanks to the absence of validation
export const DISABLE_VALIDATION = false;
//#endregion other config
