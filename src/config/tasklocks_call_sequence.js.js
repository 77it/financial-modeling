export { taskLocksBeforeEverythingElse, taskLocksBeforeDailyModeling, taskLocksAfterDailyModeling, taskLocksAfterSimulationEnds };

import { TaskLocks_Names } from './tasklocks_names.js';
import { deepFreeze, ensureArrayValuesAreUnique } from '../lib/obj_utils.js';

/** @type {taskLocksRawCallSequenceEntry_NameAndFlag[]} */
const taskLocksBeforeEverythingElse = [
  { isSimulation: true, name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__SET },
  { isSimulation: true, name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__MISSING__SET_WITH_DEFAULT_VALUE },
  { isSimulation: true, name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__JS_ENGINE_CONFIGURATION__GLOBAL_VALUES__SET },
];
deepFreeze(taskLocksBeforeEverythingElse);
ensureArrayValuesAreUnique(Object.values(taskLocksBeforeEverythingElse));

/** @type {taskLocksRawCallSequenceEntry_NameAndFlag[]} */
const taskLocksBeforeDailyModeling = [
  { isSimulation: true, name: TaskLocks_Names.SIMULATION__EBITDA__DAILY_INFO },
];
deepFreeze(taskLocksBeforeDailyModeling);
ensureArrayValuesAreUnique(Object.values(taskLocksBeforeDailyModeling));

/** @type {taskLocksRawCallSequenceEntry_NameAndFlag[]} */
const taskLocksAfterDailyModeling = [
  { isSimulation: true, name: TaskLocks_Names.SIMULATION__INTERCOMPANY_CASHMANAGER__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__NWC__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TAXES_PAYMENT__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TREASURY__DAILY_ACTIVITY },
  { isSimulation: false, name: TaskLocks_Names.UNIT__TAXES_COMPUTATION__DAILY_ACTIVITY },
];
deepFreeze(taskLocksAfterDailyModeling);
ensureArrayValuesAreUnique(Object.values(taskLocksAfterDailyModeling));

/** @type {taskLocksRawCallSequenceEntry_NameAndFlag[]} */
const taskLocksAfterSimulationEnds = [];
deepFreeze(taskLocksAfterSimulationEnds);
ensureArrayValuesAreUnique(Object.values(taskLocksAfterSimulationEnds));

/**
 @typedef {Object} taskLocksRawCallSequenceEntry_NameAndFlag
 @property {boolean} isSimulation - true if the taskLock is defined in simulation, false if it is defined in unit
 @property {string} name - the name of the taskLock
 */
