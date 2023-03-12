export { TaskLocks_ReservedNames };

import { deepFreeze } from '../../lib/obj_utils.js';

const TaskLocks_ReservedNames = {
  SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION: 'SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION',
  UNIT__TAXES__DAILY_FUNCTION: 'UNIT__TAXES__DAILY_FUNCTION',
  UNIT__TREASURY__DAILY_FUNCTION: 'UNIT__TREASURY__DAILY_FUNCTION',
};
deepFreeze(TaskLocks_ReservedNames);

// @ts-ignore
export const TaskLocks_ReservedNames_validation = Object.keys(TaskLocks_ReservedNames).map(key => TaskLocks_ReservedNames[key]);
