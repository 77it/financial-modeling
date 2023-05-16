// default names of Settings; strings values will be used in the Excel/Source File

export { Simulation, Unit, SettingsSanitization, SettingsSanitizationOptions };

import { deepFreeze, ensureArrayValuesAreUnique } from '../lib/obj_utils.js';
import * as sanitization from '../lib/sanitization_utils.js';

const Simulation = {
  // immutable: without dates
  $$SCENARIOS: '$$SCENARIOS',
  $$MODULESLOADER_URL: '$$MODULESLOADER',
  $$ENGINE_URL: '$$ENGINE',
  $$DEBUG_FLAG: '$$DEBUG_FLAG',
  $$SIMULATION_END_DATE: '$$SIMULATION_END_DATE',  // movements after SIMULATION_END_DATE are not processed by the simulation engine
  $$NUMBER_STRING_DECIMAL_SEPARATOR: '$$NUMBER_STRING_DECIMAL_SEPARATOR',  // dot as decimal separator | comma as decimal separator; used to interpret, on columns that should contain numbers, strings that need to be converted to numbers
  $$HISTORICAL_VOICE_BALANCING: '$$HISTORICAL_VOICE_BALANCING',  // if we are in the historical period, each processed line of IS and BS is unbalanced, and we balance it using this accounting entry; balancing writing is done with the description "historical balancing"
  $$CURRENCY: '$$CURRENCY',
  $$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE: '$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE',
  $$END_OF_THE_FISCAL_YEAR__MONTH: '$$END_OF_THE_FISCAL_YEAR__MONTH',

  // immutable: with dates
  $MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE: '$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE',  // if > 1 will be divided by 100
  $DEFAULT_DAY_PAYABLE: '$DEFAULT_DAY_PAYABLE',

  // mutable: active Unit, active VsUnit, etc.; to work correctly should be set without scenario and dates.
  ACTIVE_UNIT: 'ACTIVE_UNIT',
  ACTIVE_VSUNIT: 'ACTIVE_VSUNIT',
  ACTIVE_METADATA_TYPE: 'ACTIVE_METADATA_TYPE',
  ACTIVE_METADATA_VALUE: 'ACTIVE_METADATA_VALUE',
  ACTIVE_METADATA_PERCENTAGEWEIGHT: 'ACTIVE_METADATA_PERCENTAGEWEIGHT',
  ACTIVE_METADATA: 'ACTIVE_METADATA',
  ACTIVE_INTEREST_ON_DEPOSITS: 'ACTIVE_INTEREST_ON_DEPOSITS',  // if > 1 will be divided by 100
  ACTIVE_PASSIVE_INTEREST_ON_OVERDRAFTS: 'ACTIVE_PASSIVE_INTEREST_ON_OVERDRAFTS',  // if > 1 will be divided by 100
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

const SettingsSanitizationOptions = { defaultDate: new Date(0) };
deepFreeze(SettingsSanitizationOptions);
const SettingsSanitization = {
  // immutable: without dates
  [Simulation.$$SCENARIOS]: sanitization.ARRAY_OF_STRINGS_TYPE,
  [Simulation.$$MODULESLOADER_URL]: sanitization.STRING_TYPE,
  [Simulation.$$ENGINE_URL]: sanitization.STRING_TYPE,
  [Simulation.$$DEBUG_FLAG]: sanitization.BOOLEAN_TYPE,
  [Simulation.$$SIMULATION_END_DATE]: sanitization.DATE_TYPE,
  [Simulation.$$NUMBER_STRING_DECIMAL_SEPARATOR]: sanitization.STRING_TYPE,
  [Simulation.$$HISTORICAL_VOICE_BALANCING]: sanitization.STRING_TYPE,
  [Simulation.$$CURRENCY]: sanitization.STRING_TYPE,
  [Simulation.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE]: sanitization.DATE_TYPE,
  [Simulation.$$END_OF_THE_FISCAL_YEAR__MONTH]: sanitization.NUMBER_TYPE,

  // immutable: with dates
  [Simulation.$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE]: sanitization.NUMBER_TYPE,
  [Simulation.$DEFAULT_DAY_PAYABLE]: sanitization.ANY_TYPE,

  // mutable
  [Simulation.ACTIVE_UNIT]: sanitization.STRING_TYPE,
  [Simulation.ACTIVE_VSUNIT]: sanitization.STRING_TYPE,
  [Simulation.ACTIVE_METADATA_TYPE]: sanitization.ARRAY_OF_STRINGS_TYPE,
  [Simulation.ACTIVE_METADATA_VALUE]: sanitization.ARRAY_OF_STRINGS_TYPE,
  [Simulation.ACTIVE_METADATA_PERCENTAGEWEIGHT]: sanitization.ARRAY_OF_NUMBERS_TYPE,
  [Simulation.ACTIVE_METADATA]: sanitization.ANY_TYPE,
  [Simulation.ACTIVE_INTEREST_ON_DEPOSITS]: sanitization.NUMBER_TYPE,
  [Simulation.ACTIVE_PASSIVE_INTEREST_ON_OVERDRAFTS]: sanitization.NUMBER_TYPE,
};
deepFreeze(SettingsSanitization);
