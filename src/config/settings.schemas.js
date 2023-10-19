// default names of Settings; strings values will be used in the Excel/Source File

export { SettingsSchemas, SettingsSanitizationOptions };

import { Simulation } from './settings_names.js';
import { deepFreeze } from '../lib/obj_utils.js';
import * as sanitization from '../lib/sanitization_utils.js';

const SettingsSanitizationOptions = { defaultDate: new Date(0) };
deepFreeze(SettingsSanitizationOptions);

const SettingsSchemas = {
  // immutable: without dates
  [Simulation.$$SCENARIOS]: sanitization.ARRAY_OF_STRINGS_TYPE,
  [Simulation.$$MODULESLOADER_URL]: sanitization.STRING_TYPE,
  [Simulation.$$ENGINE_URL]: sanitization.STRING_TYPE,
  [Simulation.$$DEBUG_FLAG]: sanitization.BOOLEAN_TYPE,
  [Simulation.$$SIMULATION_END_DATE]: sanitization.DATE_TYPE,
  [Simulation.$$NUMBER_STRING_DECIMAL_SEPARATOR]: sanitization.STRING_TYPE,
  [Simulation.$$HISTORICAL_VOICE_BALANCING]: sanitization.STRING_TYPE,
  [Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE]: sanitization.STRING_TYPE,
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
  [Simulation.DEFAULT_INTEREST_ON_DEPOSITS]: sanitization.NUMBER_TYPE,
  [Simulation.DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS]: sanitization.NUMBER_TYPE,
};
deepFreeze(SettingsSchemas);
