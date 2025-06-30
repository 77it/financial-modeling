// default names of Settings; strings values will be used in the Excel/Source File
//
// here is not defined the YAML parsing, because parse option is set in Settings module config file `src/config/modules/settings.js`
// object 'moduleSanitization'

export { SettingsSchemas, SettingsSanitizationOptions };

import { Simulation } from './settings_names.js';
import { deepFreeze } from '../lib/obj_utils.js';
import * as schema from '../lib/schema.js';

const SettingsSanitizationOptions = { defaultDate: new Date(0) };
deepFreeze(SettingsSanitizationOptions);

// `SettingsSchemas` can contain strings (schema constants) or objects made of schema constants;
// the sanitization, done in `src/modules/settings.js`, will run a value or an object sanitization based on the type of the schema
//
// we don't sanitize strings to lowercase or uppercase, because the can compare them with `eq2` that are more or less speedy as ===
// the there is no real advantage to force them to lowercase or uppercase; see `eq2` benchmark in 'test/lib_test/obj_utils__eq2()__bench.js'.
const SettingsSchemas = {
  // immutable: without dates
  [Simulation.$$SCENARIOS]: schema.ARRAY_OF_STRINGS_TYPE,
  [Simulation.$$MODULESLOADER_URL]: schema.STRING_TYPE,
  [Simulation.$$ENGINE_URL]: schema.STRING_TYPE,
  [Simulation.$$DEBUG_FLAG]: schema.BOOLEAN_TYPE,
  [Simulation.$$SIMULATION_END_DATE]: schema.DATE_TYPE,
  [Simulation.$$HISTORICAL_SQUARE_VOICE_BS]: schema.STRING_TYPE,
  [Simulation.$$HISTORICAL_SQUARE_VOICE_IS]: schema.STRING_TYPE,
  [Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE]: schema.STRING_TYPE,
  [Simulation.$$SQUARE_TOLERANCE]: schema.NUMBER_TYPE,
  [Simulation.$$CURRENCY]: schema.STRING_TYPE,
  [Simulation.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE]: schema.DATE_TYPE,
  [Simulation.$$END_OF_THE_FISCAL_YEAR__MONTH]: schema.NUMBER_TYPE,
  [Simulation.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET]: schema.ARRAY_OF_STRINGS_TYPE,
  [Simulation.$$SIMULATION_COLUMN_PREFIX]: schema.ARRAY_OF_STRINGS_TYPE,
  [Simulation.$$HISTORICAL_COLUMN_PREFIX]: schema.ARRAY_OF_STRINGS_TYPE,
  [Simulation.$$PYTHON_ADVANCED_FORECAST_FLAG]: schema.BOOLEAN_TYPE,

  // immutable: with dates
  [Simulation.$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE]: schema.NUMBER_TYPE,
  [Simulation.$DEFAULT_DAY_PAYABLE]: schema.ANY_TYPE,

  // mutable
  [Simulation.ACTIVE_UNIT]: schema.STRING_TYPE,
  [Simulation.ACTIVE_VSUNIT]: schema.STRING_TYPE,
  [Simulation.ACTIVE_METADATA]: { name: schema.ARRAY_OF_STRINGS_TYPE, value: schema.ARRAY_OF_STRINGS_TYPE, weight: schema.ARRAY_OF_NUMBERS_TYPE },
  [Simulation.DEFAULT_INTEREST_ON_DEPOSITS]: schema.NUMBER_TYPE,
  [Simulation.DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS]: schema.NUMBER_TYPE,

  // test setting
  [Simulation.__TEST_ONLY__YAML_PARSE_AND_VALIDATION_TEST]: { mamma: schema.STRING_TYPE, babbo: schema.NUMBER_TYPE },
};
deepFreeze(SettingsSchemas);
