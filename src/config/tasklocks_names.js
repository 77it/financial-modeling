// reserved names for TaskLocks

export { TaskLocks_Names };

import { deepFreeze } from '../deps.js';

const TaskLocks_Names = {
  SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY: 'SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY',
  SIMULATION__EURIBOR_RATE_LIST__INFO: 'SIMULATION__EURIBOR_RATE_LIST__INFO',
  SIMULATION__EBITDA__DAILY_INFO: 'SIMULATION__EBITDA__DAILY_INFO',

  UNIT__TAXES_COMPUTATION__DAILY_ACTIVITY: 'UNIT__TAXES_COMPUTATION__DAILY_ACTIVITY',
  UNIT__TAXES_PAYMENT__DAILY_ACTIVITY: 'UNIT__TAXES_PAYMENT__DAILY_ACTIVITY',
  UNIT__TREASURY__DAILY_ACTIVITY: 'UNIT__TREASURY__DAILY_ACTIVITY',
  UNIT__NWC__DAILY_ACTIVITY: 'UNIT__NWC__DAILY_ACTIVITY',
};
deepFreeze(TaskLocks_Names);

// @ts-ignore
export const TaskLocks_ReservedNames_validation = Object.keys(TaskLocks_Names).map(key => TaskLocks_Names[key]);
