export { taskLocksBeforeDailyModeling, taskLocksAfterDailyModeling, taskLocksAfterSimulationEnds };

import { TaskLocks_Names } from './tasklocks_names.js';

/** @type {taskLocksRawCallSequenceEntry[]} */
const taskLocksBeforeDailyModeling = [
  { isSimulation: false, name: TaskLocks_Names.SIMULATION__EBITDA__DAILY_INFO },
];
Object.freeze(taskLocksBeforeDailyModeling);

/** @type {taskLocksRawCallSequenceEntry[]} */
const taskLocksAfterDailyModeling = [
  { isSimulation: true, name: TaskLocks_Names.SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__NWC__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TAXES_PAYMENT__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TREASURY__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TAXES_COMPUTATION__DAILY_ACTIVITY },
];
Object.freeze(taskLocksAfterDailyModeling);

/** @type {taskLocksRawCallSequenceEntry[]} */
const taskLocksAfterSimulationEnds = [];
Object.freeze(taskLocksAfterSimulationEnds);

/**
 @typedef {Object} taskLocksRawCallSequenceEntry
 @property {boolean} isSimulation
 @property {string} name
 */
