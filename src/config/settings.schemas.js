// default names of Settings; strings values will be used in the Excel/Source File

export { SettingsSchemas, SettingsSanitizationOptions };

import { Simulation } from './settings_names.js';
import { deepFreeze } from '../lib/obj_utils.js';
import * as schema from '../lib/schema.js';

const SettingsSanitizationOptions = { defaultDate: new Date(0) };
deepFreeze(SettingsSanitizationOptions);

const SettingsSchemas = {
  // immutable: without dates
  [Simulation.$$SCENARIOS]: schema.ARRAY_OF_STRINGS_TYPE,
  [Simulation.$$MODULESLOADER_URL]: schema.STRING_TYPE,
  [Simulation.$$ENGINE_URL]: schema.STRING_TYPE,
  [Simulation.$$DEBUG_FLAG]: schema.BOOLEAN_TYPE,
  [Simulation.$$SIMULATION_END_DATE]: schema.DATE_TYPE,
  [Simulation.$$NUMBER_STRING_DECIMAL_SEPARATOR]: schema.STRING_TYPE,
  [Simulation.$$HISTORICAL_VOICE_BALANCING]: schema.STRING_TYPE,
  [Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE]: schema.STRING_TYPE,
  [Simulation.$$CURRENCY]: schema.STRING_TYPE,
  [Simulation.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE]: schema.DATE_TYPE,
  [Simulation.$$END_OF_THE_FISCAL_YEAR__MONTH]: schema.NUMBER_TYPE,

  // immutable: with dates
  [Simulation.$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE]: schema.NUMBER_TYPE,
  [Simulation.$DEFAULT_DAY_PAYABLE]: schema.ANY_TYPE,

  // mutable
  [Simulation.ACTIVE_UNIT]: schema.STRING_TYPE,
  [Simulation.ACTIVE_VSUNIT]: schema.STRING_TYPE,
  [Simulation.ACTIVE_METADATA]: schema.ANY_TYPE,
  [Simulation.DEFAULT_INTEREST_ON_DEPOSITS]: schema.NUMBER_TYPE,
  [Simulation.DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS]: schema.NUMBER_TYPE,
};
deepFreeze(SettingsSchemas);
