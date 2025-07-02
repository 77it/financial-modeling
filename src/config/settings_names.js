// default names of Settings; strings values will be used in the Excel/Source File

export { Simulation, Unit };

import { deepFreeze, ensureArrayValuesAreUnique } from '../lib/obj_utils.js';

const Simulation = {
  // immutable: without dates
  $$SCENARIOS: '$$SCENARIOS',
  $$MODULESLOADER_URL: '$$MODULESLOADER_URL',  // URL of the ModulesLoader, used to resolve modules' relative paths
  $$ENGINE_URL: '$$ENGINE_URL',
  $$DEBUG_FLAG: '$$DEBUG_FLAG',
  $$SIMULATION_END_DATE: '$$SIMULATION_END_DATE',  // movements after SIMULATION_END_DATE are not processed by the simulation engine
  // THIS SETTING WAS REMOVED because there are compatibility problems:
  // * when you merge Excel input from other simulations with different decimal settings
  // * with YAML/JSON parsing, because all array with numbers separated with a comma with be split to every comma: e.g.  parseYAML('[1,1]') != [1, 1]
  // REMOVED  //$$NUMBER_STRING_DECIMAL_SEPARATOR: 'REMOVED SETTING',
  $$HISTORICAL_SQUARE_VOICE_BS: '$$HISTORICAL_SQUARE_VOICE_BS',  // if we are in the historical period, each processed line of BS is unbalanced, and we balance it using this accounting entry; balancing writing is done with the description "historical balancing" (square, squaring)
  $$HISTORICAL_SQUARE_VOICE_IS: '$$HISTORICAL_SQUARE_VOICE_IS',  // if we are in the historical period, each processed line of IS is unbalanced, and we balance it using this accounting entry; balancing writing is done with the description "historical balancing" (square, squaring)
  $$DEFAULT_ACCOUNTING_VS_TYPE: '$$DEFAULT_ACCOUNTING_VS_TYPE',  // default type for balancing accounting entries (square, squaring)
  $$SQUARE_TOLERANCE: '$$SQUARE_TOLERANCE',  // tolerance used when squaring some writings; the unbalanced part is squared with $$HISTORICAL_SQUARE_VOICE_BS or $$HISTORICAL_SQUARE_VOICE_IS (historical writings) or $$DEFAULT_ACCOUNTING_VS_TYPE (simulation writings)
  $$CURRENCY: '$$CURRENCY',
  $$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE: '$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE',
  $$END_OF_THE_FISCAL_YEAR__MONTH: '$$END_OF_THE_FISCAL_YEAR__MONTH',
  $$DEFAULT_SPLIT: '$$DEFAULT_SPLIT',
  $$DRIVER_PREFIXES__ZERO_IF_NOT_SET: '$$DRIVER_PREFIXES__ZERO_IF_NOT_SET',
  $$INVENTORY_VALUATION_METHOD: '$$INVENTORY_VALUATION_METHOD',
  // We need $$SIMULATION_COLUMN_PREFIX to be sure that dates wrote in Excel as column headers are treated as strings and not as numbers
  // (using a prefix prevents also conversion - in tables - conversion of Dates as numbers to string written in the current locale, as happens in italian locale;
  // when this happens the dates in tables header are string written in italian format DD-MM-YYYY and not numbers anymore, then JavaScript can't recognize them as dates;
  // for this reason we choose to have dates written in Excel as strings with prefix and converting them during modules execution to dates).
  $$SIMULATION_COLUMN_PREFIX: '$$SIMULATION_COLUMN_PREFIX',
  $$HISTORICAL_COLUMN_PREFIX: '$$HISTORICAL_COLUMN_PREFIX',  // We need $$HISTORICAL_COLUMN_PREFIX to prevent mismatching of historical data with simulation data when changes the Simulation Start Date.
  $$PYTHON_ADVANCED_FORECAST_FLAG: '$$PYTHON_ADVANCED_FORECAST_FLAG',  // if true load python code to calculate advanced forecast

  // immutable: with dates
  $MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE: '$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE',  // if > 1 will be divided by 100
  $DEFAULT_DAY_PAYABLE: '$DEFAULT_DAY_PAYABLE',

  // mutable: active Unit, active VsUnit, etc.; to work correctly should be set without scenario and dates.
  ACTIVE_UNIT: 'ACTIVE_UNIT',
  ACTIVE_VSUNIT: 'ACTIVE_VSUNIT',
  ACTIVE_METADATA: 'ACTIVE_METADATA',
  DEFAULT_INTEREST_ON_DEPOSITS: 'DEFAULT_INTEREST_ON_DEPOSITS',  // if > 1 will be divided by 100
  DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS: 'DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS',  // if > 1 will be divided by 100

  // test settings
  __TEST_ONLY__YAML_PARSE_AND_VALIDATION_TEST: '__TEST_ONLY__YAML_PARSE_AND_VALIDATION_TEST',

  // removed settings
  /*
  // removed because we prefer keeping `ACTIVE_METADATA` as a single setting that defines TYPE, VALUE and PERCENTAGEWEIGHT without settings duplication
  ACTIVE_METADATA_TYPE: 'ACTIVE_METADATA_TYPE',  // string
  ACTIVE_METADATA_VALUE: 'ACTIVE_METADATA_VALUE',  // string
  ACTIVE_METADATA_PERCENTAGEWEIGHT: 'ACTIVE_METADATA_PERCENTAGEWEIGHT',  // number
  */
};
deepFreeze(Simulation);
ensureArrayValuesAreUnique(Object.values(Simulation));

const Unit = {
  // immutable: without dates
  $$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE: '$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE',
  $$END_OF_THE_FISCAL_YEAR__MONTH: '$$END_OF_THE_FISCAL_YEAR__MONTH',

  // immutable: with dates
  $MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE: '$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE',
  $DEFAULT_DAY_PAYABLE: '$DEFAULT_DAY_PAYABLE',
};
deepFreeze(Unit);
ensureArrayValuesAreUnique(Object.values(Unit));
