// deno-lint-ignore-file no-inner-declarations
// (ignore the rule because we want to allow inner declarations of functions)
export { engine, normalizeModuleData, _TEST_ONLY__simulationContext };

import * as SETTINGS_NAMES from '../config/settings_names.js';
import * as CFG from '../config/engine.js';

import * as schema from '../lib/schema.js';
import { eq2 } from '../lib/obj_utils.js';
import { sanitize } from '../lib/schema_sanitization_utils.js';
import { validate } from '../lib/schema_validation_utils.js';
import { stripTimeToLocalDate } from '../lib/date_utils.js';
import { Result } from '../lib/result.js';
import { GlobalImmutableValue } from '../lib/global_immutable_value.js';

import { Ledger } from './ledger/ledger.js';
import { NewDebugSimObjectDto } from './ledger/commands/newdebugsimobjectdto.js';
import { ModuleData } from './modules/module_data.js';
import { Module } from '../modules/_sample_module.js';
import { Drivers } from './drivers/drivers.js';
import { Settings } from './settings/settings.js';
import { TaskLocks } from './tasklocks/tasklocks.js';
import { SimulationContext } from './context/simulationcontext.js';
import * as TASKLOCKS_SEQUENCE from '../config/tasklocks_call_sequence.js.js';
import * as GLOBALS from "../config/globals.js";

// exported _TEST_ONLY__simulationContext for whom may require it (e.g. tests)
const _TEST_ONLY__simulationContext = new GlobalImmutableValue();

/**
 * @param {Object} p
 * @param {ModuleData[]} p.modulesData - Array of `ModuleData` objects
 * @param {Module[]} p.modules - Array of module classes, in the same order of modulesData
 * @param {string} p.scenarioName - Scenario name
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @param {boolean} [p.ledgerDebug=false] - Optional ledgerDebug flag
 * @return {Result}
 */
function engine ({ modulesData, modules, scenarioName, appendTrnDump, ledgerDebug }) {
  /*
     _____   _____   __  __   _    _   _                   _______   _____    ____    _   _             _____   _______              _____    _______
    / ____| |_   _| |  \/  | | |  | | | |          /\     |__   __| |_   _|  / __ \  | \ | |           / ____| |__   __|     /\     |  __ \  |__   __|
   | (___     | |   | \  / | | |  | | | |         /  \       | |      | |   | |  | | |  \| |  ______  | (___      | |       /  \    | |__) |    | |
    \___ \    | |   | |\/| | | |  | | | |        / /\ \      | |      | |   | |  | | | . ` | |______|  \___ \     | |      / /\ \   |  _  /     | |
    ____) |  _| |_  | |  | | | |__| | | |____   / ____ \     | |     _| |_  | |__| | | |\  |           ____) |    | |     / ____ \  | | \ \     | |
   |_____/  |_____| |_|  |_|  \____/  |______| /_/    \_\    |_|    |_____|  \____/  |_| \_|          |_____/     |_|    /_/    \_\ |_|  \_\    |_|
   */
  // init _ledger here, to be able to use it in the `catch` block
  const _ledger = new Ledger({ appendTrnDump, decimalPlaces: CFG.DECIMAL_PLACES, roundingModeIsRound: CFG.ROUNDING_MODE_IS_HALF_AWAY_FROM_ZERO });

  try {
    validate({
      value: { modulesData, modules, scenarioName, appendTrnDump, ledgerDebug },
      validation: {
        modulesData: schema.ARRAY_TYPE,
        modules: schema.ARRAY_TYPE,
        scenarioName: schema.STRING_TYPE,
        appendTrnDump: schema.FUNCTION_TYPE,
        ledgerDebug: schema.BOOLEAN_TYPE + schema.OPTIONAL
      }
    });
    if (modulesData.length !== modules.length) throw new Error('modulesData.length !== modules.length');

    //reset globals
    for (const instance /** @type {GlobalImmutableValue} */ of Object.values(GLOBALS))
      if (typeof instance.reset === "function")
        instance.reset();
    _TEST_ONLY__simulationContext.reset();

    //#region variables declaration
    /** @type {undefined|Date} */
    let _startDate = undefined;
    /** @type {undefined|Date} */
    let _endDate = undefined;

    const _moduleDataArray = modulesData;
    const _modulesArray = modules;

    // init Settings repo
    const _settings = new Settings({
      currentScenario: scenarioName,
      baseScenario: CFG.SCENARIO_BASE,
      defaultUnit: CFG.SIMULATION_NAME,
      prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
      prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES
    });

    // init Drivers repo
    const _drivers = new Drivers({
      currentScenario: scenarioName,
      baseScenario: CFG.SCENARIO_BASE,
      defaultUnit: CFG.SIMULATION_NAME,
      prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
      prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES
    });

    // init TaskLocks repo
    const _taskLocks = new TaskLocks({ defaultUnit: CFG.SIMULATION_NAME });
    //#endregion variables declaration

    //#region set context
    const _simulationContext = new SimulationContext({
      drivers: _drivers,
      settings: _settings,
      taskLocks: _taskLocks,
      ledger: _ledger
    });
    _TEST_ONLY__simulationContext.setOneTimeBeforeRead(_simulationContext);  // save the _TEST_ONLY__simulationContext in a global variable accessible from outside, e.g. tests
    //#endregion set context

    _ledger.lock();  // lock Ledger before starting the Simulation

    // call `init()` passing a cloned `moduleData` and `_simulationContext` to each module
    // TODO after cloning `moduleData`, parse the formula contained in the moduleData, to convert them to a FmlObj formula object
    for (let i = 0; i < _modulesArray.length; i++) {
      setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
      _drivers.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
      _taskLocks.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));

      // call method only if it exists
      _modulesArray[i]?.init?.({ moduleData: structuredClone(_moduleDataArray[i]), simulationContext: _simulationContext });
    }

    // call `setTaskLocksBeforeTheSimulationStarts()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive !== false ) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        _modulesArray[i]?.setTaskLocksBeforeTheSimulationStarts?.();  // call method only if it exists
      }
    }

    //#region build taskLocks sequence arrays
    const _taskLocksBeforeEverythingElse = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksBeforeEverythingElse);
    const _taskLocksBeforeDailyModeling = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksBeforeDailyModeling);
    const _taskLocksAfterDailyModeling = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksAfterDailyModeling);
    const _taskLocksAfterSimulationEnds = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksAfterSimulationEnds);
    //#endregion build taskLocks sequence arrays

    // call `_taskLocksBeforeEverythingElse`
    _taskLocksBeforeEverythingElse.forEach(taskLockEntry => {
      setDebugModuleInfoForLedgerAndSettings(taskLockEntry.debugModuleInfo);
      taskLockEntry.taskLock();
    });

    // call `setDriversAndSettingsBeforeTheSimulationStarts()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if ( _modulesArray[i].alive !== false ) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        _modulesArray[i]?.setDriversAndSettingsBeforeTheSimulationStarts?.();  // call method only if it exists
      }
    }

    // call `prepareDataForDailyModeling()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if ( _modulesArray[i].alive !== false ) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        _modulesArray[i]?.prepareDataForDailyModeling?.();  // call method only if it exists
      }
    }

    setDebugLevelOnLedger({ debugParameter: ledgerDebug, settings: _settings });

    //#region set `_startDate`/`_endDate`
    // set _startDate to the earliest startDate of all modules
    // loop _modulesArray with foreach
    _modulesArray.forEach(module => {
      _startDate = updateStartDate({ actualDate: _startDate, newDate: module?.startDate });  // set or update _startDate
    });
    // read `$$SIMULATION_END_DATE` from settings
    _endDate = _settings.get({ unit: CFG.SIMULATION_NAME, name: SETTINGS_NAMES.Simulation.$$SIMULATION_END_DATE, throwIfNotDefined: false });
    // if `_startDate` is still undefined, set it to default value (Date(0))
    if (_startDate == null) _startDate = stripTimeToLocalDate(new Date(0));
    // if `_endDate` is still undefined or equal to Date(0), set it to default value (to 10 years from now, at the end of the year)
    if (_endDate == null || eq2(_endDate, new Date(0))) _endDate = stripTimeToLocalDate(new Date(new Date().getFullYear() + CFG.DEFAULT_NUMBER_OF_YEARS_FROM_TODAY, 11, 31));

    //#endregion set `_startDate`/`_endDate`

    //#region call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)
    for (const today = _startDate; today <= _endDate; today.setDate(today.getDate() + 1)) {
      _ledger.lock();  // lock Ledger at the beginning of each day

      _ledger.setToday(today);
      _settings.setToday(today);
      _drivers.setToday(today);

      // call `taskLocksBeforeDailyModeling`
      _taskLocksBeforeDailyModeling.forEach(taskLockEntry => {
        setDebugModuleInfoForLedgerAndSettings(taskLockEntry.debugModuleInfo);
        taskLockEntry.taskLock();
      });

      // call `beforeDailyModeling()`
      for (let i = 0; i < _modulesArray.length; i++) {
        if ( _modulesArray[i].alive !== false ) {
          setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
          _modulesArray[i]?.beforeDailyModeling?.({ today });  // call method only if it exists
        }
      }

      _ledger.unlock();  // unlock Ledger before calling `dailyModeling`

      // call `dailyModeling()`
      for (let i = 0; i < _modulesArray.length; i++) {
        if ( _modulesArray[i].alive !== false ) {
          setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
          _modulesArray[i]?.dailyModeling?.({ today });  // call method only if it exists
          ensureNoTransactionIsOpen();
        }
      }

      // call `_taskLocksAfterDailyModeling`
      _taskLocksAfterDailyModeling.forEach(taskLockEntry => {
        setDebugModuleInfoForLedgerAndSettings(taskLockEntry.debugModuleInfo);
        taskLockEntry.taskLock();
        ensureNoTransactionIsOpen();
      });

      _ledger.eod();  // Ledger end of the day actions
    }
    //#endregion call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)

    // call `oneTimeAfterTheSimulationEnds()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if ( _modulesArray[i].alive !== false ) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        _modulesArray[i]?.oneTimeAfterTheSimulationEnds?.();  // call method only if it exists
        ensureNoTransactionIsOpen();
      }
    }

    // call `_taskLocksAfterSimulationEnds`
    _taskLocksAfterSimulationEnds.forEach(taskLockEntry => {
      setDebugModuleInfoForLedgerAndSettings(taskLockEntry.debugModuleInfo);
      taskLockEntry.taskLock();
      ensureNoTransactionIsOpen();
    });

    _ledger.lock();  // lock Ledger at the end of the simulation
    _ledger.eod();  // Ledger end of the day actions

    /*
       _____   _____   __  __   _    _   _                   _______   _____    ____    _   _             ______   _   _   _____
      / ____| |_   _| |  \/  | | |  | | | |          /\     |__   __| |_   _|  / __ \  | \ | |           |  ____| | \ | | |  __ \
     | (___     | |   | \  / | | |  | | | |         /  \       | |      | |   | |  | | |  \| |  ______   | |__    |  \| | | |  | |
      \___ \    | |   | |\/| | | |  | | | |        / /\ \      | |      | |   | |  | | | . ` | |______|  |  __|   | . ` | | |  | |
      ____) |  _| |_  | |  | | | |__| | | |____   / ____ \     | |     _| |_  | |__| | | |\  |           | |____  | |\  | | |__| |
     |_____/  |_____| |_|  |_|  \____/  |______| /_/    \_\    |_|    |_____|  \____/  |_| \_|           |______| |_| \_| |_____/
     */

    //#region local function inside try() section
    /*
      _         ____     _____              _          ______   _    _   _   _    _____   _______   _____    ____    _   _    _____
     | |       / __ \   / ____|     /\     | |        |  ____| | |  | | | \ | |  / ____| |__   __| |_   _|  / __ \  | \ | |  / ____|
     | |      | |  | | | |         /  \    | |        | |__    | |  | | |  \| | | |         | |      | |   | |  | | |  \| | | (___
     | |      | |  | | | |        / /\ \   | |        |  __|   | |  | | | . ` | | |         | |      | |   | |  | | | . ` |  \___ \
     | |____  | |__| | | |____   / ____ \  | |____    | |      | |__| | | |\  | | |____     | |     _| |_  | |__| | | |\  |  ____) |
     |______|  \____/   \_____| /_/    \_\ |______|   |_|       \____/  |_| \_|  \_____|    |_|    |_____|  \____/  |_| \_| |_____/
     */

    /** Return debug info about the current module, to be used in the ledger, drivers and taskLocks
     * @param {ModuleData} moduleData
     * @return {string}
     */
    function getDebugModuleInfo (moduleData) {
      return `scenario: '${scenarioName}', moduleName: '${moduleData?.moduleName}', moduleEngineURI: '${moduleData?.moduleEngineURI}', moduleSourceLocation: '${moduleData?.moduleSourceLocation}'`;
    }

    /**
     * Set/reset simulation start date; overwrite `_startDate` only if the new date is earlier than the current `_startDate` (or if `_startDate` is not set yet)
     * @param {Object} p
     * @param {undefined|Date} p.actualDate - Actual simulation start date
     * @param {undefined|Date} p.newDate - New simulation start date
     * @return {undefined|Date} - Return the updated simulation start date
     */
    function updateStartDate ({ actualDate, newDate }) {
      let _newDate = sanitize({
        value: newDate,
        sanitization: schema.DATE_TYPE + schema.OPTIONAL
      });

      if (_newDate == null) {
        return actualDate;
      } else {
        _newDate = stripTimeToLocalDate(_newDate);
        if (actualDate == null)
          return _newDate;
        if (_newDate < actualDate)
          return _newDate;
      }
    }

    /** From the list of taskLocks name and flag, build an array of taskLocks callable functions
     *
     * Loop the list of taskLocks name and flag, and for each entry:
     * - if `isSimulation` is true, search the taskLock in the default Unit and save it in the return array
     * - if `isSimulation` is false, search the taskLock in all Units different from default and save them in the return array
     * @param {taskLocksRawCallSequenceEntry_NameAndFlag[]} taskLocksRawCallSequence
     * @return {taskLocksCallSequenceEntry[]}
     */
    function buildTaskLocksSequenceArray (taskLocksRawCallSequence) {
      /** @type {taskLocksCallSequenceEntry[]} */
      const _taskLocksSequenceArray = [];

      // loop `taskLocksRawCallSequence`
      taskLocksRawCallSequence.forEach(_entry => {
        const _isSimulation = sanitize({ value: _entry.isSimulation, sanitization: schema.BOOLEAN_TYPE });
        const _name = sanitize({ value: _entry.name, sanitization: schema.STRING_TYPE });

        if (_isSimulation) {
          // in the following methods, when unit is undefined, it means default Unit
          if (_taskLocks.isDefined({ unit: undefined, name: _name }))
            _taskLocksSequenceArray.push({ taskLock: _taskLocks.get({ unit: undefined, name: _name }), debugModuleInfo: _taskLocks.getDebugModuleInfo({ unit: undefined, name: _name }) });
        } else {  // if the flag says that the task lock is not defined on simulation, search in all Units different from default
          // get the list of Locks with a specific name defined on Units different from default Unit, then push them in the array
          _taskLocks.getListOfAllTaskLocksNotDefinedInTheDefaultUnit({ name: _name }).forEach(entry => {
            _taskLocksSequenceArray.push({
              taskLock: entry.taskLock,
              debugModuleInfo: entry.debugModuleInfo
            });
          });
        }
      });
      return _taskLocksSequenceArray;
    }

    /** set Ledger debug level, if engine `ledgerDebug` parameter or Settings.Simulation.$DEBUG_FLAG are true
     * @param {Object} p
     * @param {undefined|boolean} p.debugParameter
     * @param {Settings} p.settings
     */
    function setDebugLevelOnLedger ({ debugParameter, settings }) {
      const _debugFlagFromParameter = sanitize({ value: debugParameter, sanitization: schema.BOOLEAN_TYPE });
      const _debugFlagFromSettings = settings.get({ unit: CFG.SIMULATION_NAME, name: SETTINGS_NAMES.Simulation.$$DEBUG_FLAG });

      if (_debugFlagFromParameter || _debugFlagFromSettings)
        _ledger.setDebug();
    }

    /** Set debugModuleInfo for Ledger and Settings
     * @param {string} debugModuleInfo
     */
    function setDebugModuleInfoForLedgerAndSettings (debugModuleInfo) {
      _ledger.setDebugModuleInfo(debugModuleInfo);
      _settings.setDebugModuleInfo(debugModuleInfo);
    }

    /** Check if a transaction is open, and if so, throw an error */
    function ensureNoTransactionIsOpen () {
      if (_ledger.transactionIsOpen())
        throw new Error(`FATAL ERROR: after calling module ${_ledger.getDebugModuleInfo()} a transaction is open`);
    }
    //#endregion local function inside try() section
  } catch (error) {
    /*
     _____              _______    _____   _    _
    / ____|     /\     |__   __|  / ____| | |  | |
   | |         /  \       | |    | |      | |__| |
   | |        / /\ \      | |    | |      |  __  |
   | |____   / ____ \     | |    | |____  | |  | |
    \_____| /_/    \_\    |_|     \_____| |_|  |_|
     */

    /*
    Every module that wants to interrupt program execution for a fatal error throws a new Error;
    this error is intercepted here, and will be recorded a 'debug_error' SimObject, then the execution ends with an error.
     */

    const _error = (error instanceof Error) ? error.stack?.toString() ?? error.toString() : 'Unknown error occurred';
    _ledger.unlock();
    _ledger?.ONLY_FOR_ENGINE_USAGE_appendDebugErrorSimObject(new NewDebugSimObjectDto({ description: _error }));
    _ledger?.ONLY_FOR_ENGINE_USAGE_forceCommitWithoutValidation();

    return new Result({ success: false, error: `${_ledger.getDebugModuleInfo()}\n${_error}\n` });
  }
  /*
    _____    ______   _______   _    _   _____    _   _      _____   _    _    _____    _____   ______    _____    _____
   |  __ \  |  ____| |__   __| | |  | | |  __ \  | \ | |    / ____| | |  | |  / ____|  / ____| |  ____|  / ____|  / ____|
   | |__) | | |__       | |    | |  | | | |__) | |  \| |   | (___   | |  | | | |      | |      | |__    | (___   | (___
   |  _  /  |  __|      | |    | |  | | |  _  /  | . ` |    \___ \  | |  | | | |      | |      |  __|    \___ \   \___ \
   | | \ \  | |____     | |    | |__| | | | \ \  | |\  |    ____) | | |__| | | |____  | |____  | |____   ____) |  ____) |
   |_|  \_\ |______|    |_|     \____/  |_|  \_\ |_| \_|   |_____/   \____/   \_____|  \_____| |______| |_____/  |_____/
   */
  return new Result({ success: true });
}

/**
 * Normalize the tables in ModuleData:
 * - remove ASCII 31 invisible unprintable control character from the table values `CFG.UNPRINTABLE_CHAR_REGEXP`
 * - lowercase keys; if the key is already present append the string ".N" similar to Python Pandas (e.g., key, key.1, key.2)
 * @param {ModuleData[]} modulesData - Array of `ModuleData` objects
 * @returns {void}
 */
function normalizeModuleData (modulesData) {
  for (const moduleData of modulesData) {  // loop modulesData
    for (const tableDataAndName of moduleData.tables) {  // loop tables
      const table = tableDataAndName.table;
      for (let row = 0; row < table.length; row++) {  // loop rows
        const rowKeys = Object.keys(table[row]);  // extract row keys
        for (const key of rowKeys) {  // loop row keys
          //#region if the table value is a string, remove ASCII 31 invisible unprintable control character from it
          if (typeof table[row][key] === 'string') {
            table[row][key] = table[row][key].replace(CFG.UNPRINTABLE_CHAR_REGEXP, '');
          }
          //#endregion

          //#region make the key lowercase
          let newKey = key.toLowerCase();  // make the key lowercase
          if (newKey === key) continue;  // if the key was already lowercase, skip loop

          // if `newKey` is already present in the row,
          // loop while `${newKey}.${id}` is not unique, appending the string ".N" similar to what does Python Pandas (e.g., key, key.1, key.2)
          if (newKey in table[row]) {
            let id = 1;
            while (`${newKey}.${id}` in table[row]) {
              id++;
            }
            newKey = `${newKey}.${id}`;  // set the new key to the unique value
          }

          // replace `newKey` with `key` in the table row
          table[row][newKey] = table[row][key];
          delete table[row][key];
          //#endregion make the key lowercase
        }
      }
    }
  }
}

//#region types definitions
/**
 * Callback to dump the transactions
 * @callback appendTrnDump
 * @param {string} dump - The transactions dump
 */

/**
 * @callback modulesLoader_Resolve
 * @param {string} module - The module to resolve
 * @return {string[]} List of URL from which import a module
 */

/**
 @typedef {Object} taskLocksCallSequenceEntry
 @property {*} taskLock - this is the taskLock callable function
 @property {string} debugModuleInfo - debug info about the module that defined the taskLock
 */

/**
 @typedef {Object} taskLocksRawCallSequenceEntry_NameAndFlag
 @property {boolean} isSimulation - true if the taskLock is defined in simulation, false if it is defined in unit
 @property {string} name - the name of the taskLock
 */
//#endregion types definitions
