export { Simulation, Unit };

import { deepFreeze } from '../../lib/obj_utils.js';

const Simulation = {
  $DEBUG_FLAG: '$DEBUG_FLAG',
  $SCENARIOS: '$SCENARIOS',  // array of scenario names
  $SIMULATION_END_DATE: '$SIMULATION_END_DATE',  // movements after SIMULATION_END_DATE are not processed by the simulation engine
  $NUMBER_STRING_DECIMAL_SEPARATOR: '$NUMBER_STRING_DECIMAL_SEPARATOR',  // dot as decimal separator | comma as decimal separator; used to interpret, on columns that should contain numbers, strings that need to be converted to numbers
  $HISTORICAL_VOICE_BALANCING: '$HISTORICAL_VOICE_BALANCING',  // if we are in the historical period, each processed line of IS and BS is unbalanced, and we balance it using this accounting entry; balancing writing is done with the description "historical balancing"
  $CURRENCY: '$CURRENCY',
  $END_OF_THE_FISCAL_YEAR__MONTH: '$END_OF_THE_FISCAL_YEAR__MONTH',
};
deepFreeze(Simulation);

const Unit = {
  $SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE: '$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE',
  $END_OF_THE_FISCAL_YEAR__MONTH: '$END_OF_THE_FISCAL_YEAR__MONTH',
  $DEFAULT_DAY_PAYABLE: '$DEFAULT_DAY_PAYABLE',
  $MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE: '$MAJORITY_SHAREHOLDERS_EQUITY_PERCENTAGE',
};
deepFreeze(Unit);
