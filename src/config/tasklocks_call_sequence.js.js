export { taskLocksBeforeEverythingElse, taskLocksBeforeDailyModeling, taskLocksAfterDailyModeling, taskLocksAfterSimulationEnds };

import { TaskLocks_Names } from './tasklocks_names.js';
import { deepFreeze, ensureArrayValuesAreUnique } from '../lib/obj_utils.js';

/** @type {taskLocksRawCallSequenceEntry[]} */
const taskLocksBeforeEverythingElse = [
  { isSimulation: false, name: TaskLocks_Names.SIMULATION__SETTINGS },
];
deepFreeze(taskLocksBeforeEverythingElse);
ensureArrayValuesAreUnique(Object.values(taskLocksBeforeEverythingElse));

/** @type {taskLocksRawCallSequenceEntry[]} */
const taskLocksBeforeDailyModeling = [
  { isSimulation: false, name: TaskLocks_Names.SIMULATION__EBITDA__DAILY_INFO },
];
deepFreeze(taskLocksBeforeDailyModeling);
ensureArrayValuesAreUnique(Object.values(taskLocksBeforeDailyModeling));

/** @type {taskLocksRawCallSequenceEntry[]} */
const taskLocksAfterDailyModeling = [
  { isSimulation: true, name: TaskLocks_Names.SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__NWC__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TAXES_PAYMENT__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TREASURY__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TAXES_COMPUTATION__DAILY_ACTIVITY },
];
deepFreeze(taskLocksAfterDailyModeling);
ensureArrayValuesAreUnique(Object.values(taskLocksAfterDailyModeling));

/** @type {taskLocksRawCallSequenceEntry[]} */
const taskLocksAfterSimulationEnds = [];
deepFreeze(taskLocksAfterSimulationEnds);
ensureArrayValuesAreUnique(Object.values(taskLocksAfterSimulationEnds));

/**
 @typedef {Object} taskLocksRawCallSequenceEntry
 @property {boolean} isSimulation - true if the taskLock is defined in simulation, false if it is defined in unit
 @property {string} name - the name of the taskLock
 */
