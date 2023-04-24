// reserved names for TaskLocks

export { TaskLocks_Names };

import { deepFreeze } from '../deps.js';

const TaskLocks_Names = {
  SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION: 'SIMULATION__INTERCOMPANY_TREASURY__DAILY_FUNCTION',
  UNIT__TAXES__DAILY_FUNCTION: 'UNIT__TAXES__DAILY_FUNCTION',
  UNIT__TREASURY__DAILY_FUNCTION: 'UNIT__TREASURY__DAILY_FUNCTION',
};
deepFreeze(TaskLocks_Names);

// @ts-ignore
export const TaskLocks_ReservedNames_validation = Object.keys(TaskLocks_Names).map(key => TaskLocks_Names[key]);
