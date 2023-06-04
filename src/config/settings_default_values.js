export { SettingsDefaultValues };

import { Simulation } from './settings_names.js';
import { Currency_enum } from '../engine/simobject/enums/currency_enum.js';
import { SimObjectTypes_enum } from '../engine/simobject/simobject_types_enum.js';
import { deepFreeze } from '../lib/obj_utils.js';

const SettingsDefaultValues = {
  // values of immutable settings if nothing else is set
  [Simulation.$$DEBUG_FLAG]: false,
  [Simulation.$$NUMBER_STRING_DECIMAL_SEPARATOR]: '.',
  [Simulation.$$HISTORICAL_VOICE_BALANCING]: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
  [Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE]: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
  [Simulation.$$CURRENCY]: Currency_enum.UNDEFINED,
  [Simulation.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE]: new Date(0),
  [Simulation.$$END_OF_THE_FISCAL_YEAR__MONTH]: 12,

  // value of immutable settings with dates if nothing else is set
  [Simulation.$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE]: 100,
  [Simulation.$DEFAULT_DAY_PAYABLE]: [30, 60],

  // first values of mutable settings if nothing else is set
  [Simulation.ACTIVE_UNIT]: '_',
  [Simulation.DEFAULT_INTEREST_ON_DEPOSITS]: 0,
  [Simulation.DEFAULT_PASSIVE_INTEREST_ON_OVERDRAFTS]: 0.03,
};
deepFreeze(SettingsDefaultValues);
