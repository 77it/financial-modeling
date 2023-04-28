export { engine };

import * as SETTINGS_NAMES from '../config/settings_names.js';
import * as STD_NAMES from '../config/standard_names.js';
import * as CFG from '../config/engine.js';

import { validation, sanitization, stripTime, Result, BOOLEAN_TRUE_STRING } from '../deps.js';

import { Ledger } from './ledger/ledger.js';
import { NewDebugSimObjectDto } from './ledger/commands/newdebugsimobjectdto.js';
import { ModuleData } from './modules/module_data.js';
import { Module } from '../modules/_sample_module.js';
import { Drivers } from './drivers/drivers.js';
import { Settings } from './settings/settings.js';
import { TaskLocks } from './tasklocks/tasklocks.js';
import { SimulationContextStart } from './context/simulationcontext_start.js';
import { SimulationContextDaily } from './context/simulationcontext_daily.js';
import * as TASKLOCKS_SEQUENCE from '../config/tasklocks_call_sequence.js.js';

/**
 * @param {Object} p
 * @param {ModuleData[]} p.modulesData - Array of `ModuleData` objects
 * @param {Module[]} p.modules - Array of module classes, in the same order of modulesData
 * @param {string} p.scenarioName - Scenario name
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @param {boolean} [p.debug=false] - Optional debug flag
 * @return {Promise<Result>}
 */
async function engine ({ modulesData, modules, scenarioName, appendTrnDump, debug }) {
  /*
     _____   _____   __  __   _    _   _                   _______   _____    ____    _   _             _____   _______              _____    _______
    / ____| |_   _| |  \/  | | |  | | | |          /\     |__   __| |_   _|  / __ \  | \ | |           / ____| |__   __|     /\     |  __ \  |__   __|
   | (___     | |   | \  / | | |  | | | |         /  \       | |      | |   | |  | | |  \| |  ______  | (___      | |       /  \    | |__) |    | |
    \___ \    | |   | |\/| | | |  | | | |        / /\ \      | |      | |   | |  | | | . ` | |______|  \___ \     | |      / /\ \   |  _  /     | |
    ____) |  _| |_  | |  | | | |__| | | |____   / ____ \     | |     _| |_  | |__| | | |\  |           ____) |    | |     / ____ \  | | \ \     | |
   |_____/  |_____| |_|  |_|  \____/  |______| /_/    \_\    |_|    |_____|  \____/  |_| \_|          |_____/     |_|    /_/    \_\ |_|  \_\    |_|
   */
  const _ledger = new Ledger({ appendTrnDump, decimalPlaces: CFG.DECIMAL_PLACES, roundingModeIsRound: CFG.ROUNDING_MODE });  // define _ledger here to be able to use it in the `finally` block

  try {
    validation.validateObj({
      obj: { modulesData, modules, scenarioName, appendTrnDump, debug },
      validation: {
        modulesData: validation.ARRAY_TYPE,
        modules: validation.ARRAY_TYPE,
        scenarioName: validation.STRING_TYPE,
        appendTrnDump: validation.FUNCTION_TYPE,
        debug: validation.BOOLEAN_TYPE + validation.OPTIONAL
      }
    });
    if (modulesData.length !== modules.length) throw new Error('modulesData.length !== modules.length');

    //#region variables declaration
    /** @type {undefined|Date} */
    let _startDate = undefined;
    /** @type {undefined|Date} */
    let _endDate = undefined;

    const _moduleDataArray = modulesData;
    const _modulesArray = modules;

    const _settings = new Settings({
      currentScenario: scenarioName, baseScenario: STD_NAMES.Scenario.BASE, defaultUnit: STD_NAMES.Simulation.NAME,
      prefix__immutable_without_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITHOUT_DATES,
      prefix__immutable_with_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITH_DATES
    });
    const _drivers = new Drivers({
      currentScenario: scenarioName, baseScenario: STD_NAMES.Scenario.BASE, defaultUnit: STD_NAMES.Simulation.NAME,
      prefix__immutable_without_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITHOUT_DATES,
      prefix__immutable_with_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITH_DATES
    });
    const _taskLocks = new TaskLocks({ defaultUnit: STD_NAMES.Simulation.NAME });
    //#endregion variables declaration

    //#region set contexts
    const simulationContextStart = new SimulationContextStart({
      setSetting: _settings.set,
      setDriver: _drivers.set,
      setTaskLock: _taskLocks.set
    });

    const simulationContextDaily = new SimulationContextDaily({
      setSetting: _settings.set,
      getSetting: _settings.get,
      getDriver: _drivers.get,
      getTaskLock: _taskLocks.get,
      transactionIsOpen: _ledger.transactionIsOpen,
      ledgerIsLocked: _ledger.isLocked,
      commit: _ledger.commit,
      newSimObject: _ledger.newSimObject,
      newDebugDebugSimObject: _ledger.newDebugDebugSimObject,
      newDebugInfoSimObject: _ledger.newDebugInfoSimObject,
      newDebugWarningSimObject: _ledger.newDebugWarningSimObject,
      newDebugWarningSimObjectFromErrorString: _ledger.newDebugWarningSimObjectFromErrorString
    });
    //#endregion set contexts

    _ledger.lock();  // lock Ledger before starting the Simulation

    //# call `oneTimeBeforeTheSimulationStarts`
    for (let i = 0; i < _modulesArray.length; i++) {
      setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
      _drivers.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
      _taskLocks.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));

      if (_modulesArray[i]?.oneTimeBeforeTheSimulationStarts != null)
        _modulesArray[i]?.oneTimeBeforeTheSimulationStarts({ moduleData: _moduleDataArray[i], simulationContextStart });
    }

    setDebugLevelOnLedger({ debugParameter: debug, settings: _settings });

    //#region set `_startDate`/`_endDate`
    // set _startDate to the earliest startDate of all modules
    // loop _modulesArray with foreach
    _modulesArray.forEach(module => {
      _startDate = updateStartDate({ actualDate: _startDate, newDate: module?.startDate });  // set or update _startDate
    });
    // read `$$SIMULATION_END_DATE` from settings
    _endDate = sanitization.sanitize({
      value: _settings.get({ unit: STD_NAMES.Simulation.NAME, name: SETTINGS_NAMES.Simulation.$$SIMULATION_END_DATE }),
      sanitization: sanitization.DATE_TYPE + sanitization.OPTIONAL
    });
    // if `_startDate` is still undefined, set it to default value (Date(0))
    if (_startDate == null) _startDate = new Date(0);
    // if `_endDate` is still undefined, set it to default value (to 10 years from now, at the end of the year)
    if (_endDate == null) _endDate = new Date(new Date().getFullYear() + CFG.DEFAULT_NUMBER_OF_YEARS_FROM_TODAY, 11, 31);

    //#endregion set `_startDate`/`_endDate`

    //#region build taskLocks sequence arrays
    const _taskLocksBeforeDailyModeling = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksBeforeDailyModeling);
    const _taskLocksAfterDailyModeling = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksAfterDailyModeling);
    const _taskLocksAfterSimulationEnds = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksAfterSimulationEnds);
    //#endregion build taskLocks sequence arrays

    //#region call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)
    for (let date = _startDate; date <= _endDate; date.setDate(date.getDate() + 1)) {
      _ledger.lock();  // lock Ledger at the beginning of each day

      _ledger.setToday(date);
      _settings.setToday(date);
      _drivers.setToday(date);

      // call `taskLocksBeforeDailyModeling`
      _taskLocksBeforeDailyModeling.forEach(taskLockEntry => {
        setDebugModuleInfoForLedgerAndSettings(taskLockEntry.debugModuleInfo);
        taskLockEntry.taskLock();
      });

      //# call `beforeDailyModeling`
      for (let i = 0; i < _modulesArray.length; i++) {
        if (_modulesArray[i].alive) {
          setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
          if (_modulesArray[i]?.beforeDailyModeling != null)
            _modulesArray[i]?.beforeDailyModeling({ simulationContextDaily });
        }
      }

      _ledger.unlock();  // unlock Ledger before calling `dailyModeling`

      //# call `dailyModeling`
      for (let i = 0; i < _modulesArray.length; i++) {
        if (_modulesArray[i].alive) {
          setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
          if (_modulesArray[i]?.dailyModeling != null)
            _modulesArray[i]?.dailyModeling({ simulationContextDaily });
          ensureNoTransactionIsOpen();
        }
      }

      // call `_taskLocksAfterDailyModeling`
      _taskLocksAfterDailyModeling.forEach(taskLockEntry => {
        setDebugModuleInfoForLedgerAndSettings(taskLockEntry.debugModuleInfo);
        taskLockEntry.taskLock();
        ensureNoTransactionIsOpen();
      });
    }
    //#endregion call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)

    //# call `oneTimeAfterTheSimulationEnds`
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        if (_modulesArray[i]?.oneTimeAfterTheSimulationEnds != null)
          _modulesArray[i]?.oneTimeAfterTheSimulationEnds({ simulationContextDaily });
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

    console.dir(_moduleDataArray); // todo TOREMOVE
    throw new Error('not implemented'); // todo TOREMOVE
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
      const _newDate = stripTime(sanitization.sanitize({
        value: newDate,
        sanitization: sanitization.DATE_TYPE + sanitization.OPTIONAL
      }));
      if (_newDate == null)
        return actualDate;
      if (actualDate == null)
        return _newDate;
      if (_newDate < actualDate)
        return _newDate;
    }

    /** Build an array of taskLocks sequence entries
     * @param {taskLocksRawCallSequenceEntry[]} taskLocksRawCallSequence
     * @return {taskLocksCallSequenceEntry[]}
     */
    function buildTaskLocksSequenceArray (taskLocksRawCallSequence) {
      /** @type {taskLocksCallSequenceEntry[]} */
      const _taskLocksSequenceArray = [];

      // loop `taskLocksRawCallSequence`
      taskLocksRawCallSequence.forEach(_entry => {
        const _isSimulation = sanitization.sanitize({ value: _entry.isSimulation, sanitization: sanitization.BOOLEAN_TYPE });
        const _name = sanitization.sanitize({ value: _entry.name, sanitization: sanitization.STRING_TYPE });

        if (_isSimulation) {
          if (_taskLocks.isDefined({ name: _name }))
            _taskLocksSequenceArray.push({ taskLock: _taskLocks.get({ name: _name }), debugModuleInfo: _taskLocks.getDebugModuleInfo({ name: _name }) });
        } else {  // if not simulation, search in all Units
          // query TaskLocks to see in which Units the taskLock name is defined, then loop the Units, query TaskLocks again to get the taskLock & debugModuleInfo and push them in the array
          _taskLocks.listUnit({ name: _name }).forEach(unit => {
            _taskLocksSequenceArray.push({
              taskLock: _taskLocks.get({ name: _name, unit }),
              debugModuleInfo: _taskLocks.getDebugModuleInfo({ name: _name, unit })
            });
          });
        }
      });
      return _taskLocksSequenceArray;
    }

    /** set Ledger debug level, if engine `debug` parameter or Settings.Simulation.$DEBUG_FLAG are true
     * @param {Object} p
     * @param {undefined|boolean} p.debugParameter
     * @param {Settings} p.settings
     */
    function setDebugLevelOnLedger ({ debugParameter, settings }) {
      const _debugFlagFromParameter = sanitization.sanitize({ value: debugParameter, sanitization: sanitization.STRING_TYPE });
      const _debugFlagFromSettings = sanitization.sanitize({
        value: settings.get({ unit: STD_NAMES.Simulation.NAME, name: SETTINGS_NAMES.Simulation.$$DEBUG_FLAG }),
        sanitization: sanitization.STRING_TYPE
      });

      if (_debugFlagFromParameter === BOOLEAN_TRUE_STRING || _debugFlagFromSettings === BOOLEAN_TRUE_STRING)
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

    const _error = error.stack?.toString() ?? error.toString();
    console.log(_error);
    _ledger.unlock();
    _ledger?.newDebugErrorSimObject(new NewDebugSimObjectDto({ description: _error }));
    _ledger?.forceCommitWithoutValidation();

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
 @property {*} taskLock
 @property {string} debugModuleInfo
 */

/**
 @typedef {Object} taskLocksRawCallSequenceEntry
 @property {boolean} isSimulation
 @property {string} name
 */
//#endregion types definitions
