// default names of Settings; strings values will be used in the Excel/Source File

export { Simulation, Unit };

import { deepFreeze, ensureArrayValuesAreUnique } from '../lib/obj_utils.js';

const Simulation = {
  // immutable: without dates
  $$SCENARIOS: '$$SCENARIOS',
  $$MODULESLOADER_URL: '$$MODULESLOADER',  // URL of the ModulesLoader, used to resolve modules' relative paths
  $$ENGINE_URL: '$$ENGINE',
  $$DEBUG_FLAG: '$$DEBUG_FLAG',
  $$SIMULATION_END_DATE: '$$SIMULATION_END_DATE',  // movements after SIMULATION_END_DATE are not processed by the simulation engine
  $$NUMBER_STRING_DECIMAL_SEPARATOR: '$$NUMBER_STRING_DECIMAL_SEPARATOR',  // dot as decimal separator | comma as decimal separator; used to interpret, on columns that should contain numbers, strings that need to be converted to numbers
  $$HISTORICAL_VOICE_BALANCING: '$$HISTORICAL_VOICE_BALANCING',  // if we are in the historical period, each processed line of IS and BS is unbalanced, and we balance it using this accounting entry; balancing writing is done with the description "historical balancing"
  $$DEFAULT_ACCOUNTING_VS_TYPE: '$$DEFAULT_ACCOUNTING_VS_TYPE',  // default type for balancing accounting entries
  $$CURRENCY: '$$CURRENCY',
  $$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE: '$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE',
  $$END_OF_THE_FISCAL_YEAR__MONTH: '$$END_OF_THE_FISCAL_YEAR__MONTH',

  // immutable: with dates
  $MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE: '$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE',  // if > 1 will be divided by 100
  $DEFAULT_DAY_PAYABLE: '$DEFAULT_DAY_PAYABLE',

  // mutable: active Unit, active VsUnit, etc.; to work correctly should be set without scenario and dates.
  ACTIVE_UNIT: 'ACTIVE_UNIT',
  ACTIVE_VSUNIT: 'ACTIVE_VSUNIT',
  ACTIVE_METADATA: 'ACTIVE_METADATA',
  DEFAULT_INTEREST_ON_DEPOSITS: 'DEFAULT_INTEREST_ON_DEPOSITS',  // if > 1 will be divided by 100
  DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS: 'DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS',  // if > 1 will be divided by 100

  // removed settings
  /*
  // removed because we prefer keeping `ACTIVE_METADATA` without settings duplication
  ACTIVE_METADATA_TYPE: 'ACTIVE_METADATA_TYPE',
  ACTIVE_METADATA_VALUE: 'ACTIVE_METADATA_VALUE',
  ACTIVE_METADATA_PERCENTAGEWEIGHT: 'ACTIVE_METADATA_PERCENTAGEWEIGHT',
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
