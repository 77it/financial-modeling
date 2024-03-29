// reserved names for TaskLocks

export { TaskLocks_Names };

import { deepFreeze, ensureArrayValuesAreUnique } from '../lib/obj_utils.js';

const TaskLocks_Names = {
  SIMULATION__SET_SIMULATION_SETTINGS: 'SIMULATION__SET_SIMULATION_SETTINGS',
  SIMULATION__SET_MISSING_SETTINGS_WITH_DEFAULT_VALUE: 'SIMULATION__SET_MISSING_SETTINGS_WITH_DEFAULT_VALUE',
  SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY: 'SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY',
  SIMULATION__EURIBOR_RATE_LIST__INFO: 'SIMULATION__EURIBOR_RATE_LIST__INFO',
  SIMULATION__EBITDA__DAILY_INFO: 'SIMULATION__EBITDA__DAILY_INFO',
  SIMULATION__NWC__DAILY_ACTIVITY: 'SIMULATION__NWC__DAILY_ACTIVITY',

  UNIT__TAXES_COMPUTATION__DAILY_ACTIVITY: 'UNIT__TAXES_COMPUTATION__DAILY_ACTIVITY',
  UNIT__TAXES_PAYMENT__DAILY_ACTIVITY: 'UNIT__TAXES_PAYMENT__DAILY_ACTIVITY',
  UNIT__TREASURY__DAILY_ACTIVITY: 'UNIT__TREASURY__DAILY_ACTIVITY',
  UNIT__NWC__DAILY_ACTIVITY: 'UNIT__NWC__DAILY_ACTIVITY',
};
deepFreeze(TaskLocks_Names);
ensureArrayValuesAreUnique(Object.values(TaskLocks_Names));
