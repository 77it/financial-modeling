export { engine };

import * as SETTINGS_NAMES from '../config/settings_names.js';
import * as CFG from '../config/engine.js';

import * as schema from '../lib/schema.js';
import { sanitize } from '../lib/schema_sanitization_utils.js';
import { validateObj } from '../lib/schema_validation_utils.js';
import { stripTime } from '../lib/date_utils.js';
import { Result } from '../lib/result.js';
import { isStringOrBooleanTrue } from '../lib/boolean_utils.js';

import { Ledger } from './ledger/ledger.js';
import { NewDebugSimObjectDto } from './ledger/commands/newdebugsimobjectdto.js';
import { ModuleData } from './modules/module_data.js';
import { Module } from '../modules/_sample_module.js';
import { Drivers } from './drivers/drivers.js';
import { Settings } from './settings/settings.js';
import { TaskLocks } from './tasklocks/tasklocks.js';
import { SimulationContext } from './context/simulationcontext.js';
import * as TASKLOCKS_SEQUENCE from '../config/tasklocks_call_sequence.js.js';

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
  // define _ledger here to be able to use it in the `catch` block
  const _ledger = new Ledger({ appendTrnDump, decimalPlaces: CFG.DECIMAL_PLACES, roundingModeIsRound: CFG.ROUNDING_MODE });

  try {
    validateObj({
      obj: { modulesData, modules, scenarioName, appendTrnDump, ledgerDebug },
      validation: {
        modulesData: schema.ARRAY_TYPE,
        modules: schema.ARRAY_TYPE,
        scenarioName: schema.STRING_TYPE,
        appendTrnDump: schema.FUNCTION_TYPE,
        ledgerDebug: schema.BOOLEAN_TYPE + schema.OPTIONAL
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
      currentScenario: scenarioName, baseScenario: CFG.SCENARIO_BASE,
      defaultUnit: CFG.SIMULATION_NAME,
      prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
      prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES
    });
    const _drivers = new Drivers({
      currentScenario: scenarioName, baseScenario: CFG.SCENARIO_BASE,
      defaultUnit: CFG.SIMULATION_NAME,
      prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
      prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES
    });
    const _taskLocks = new TaskLocks({ defaultUnit: CFG.SIMULATION_NAME });
    //#endregion variables declaration

    //#region set context
    const simulationContext = new SimulationContext({
      drivers: _drivers,
      settings: _settings,
      taskLocks: _taskLocks,
      ledger: _ledger
    });
    //#endregion set context

    _ledger.lock();  // lock Ledger before starting the Simulation

    //# call `init()` passing a cloned `moduleData` and `simulationContext` to each module
    for (let i = 0; i < _modulesArray.length; i++) {
      setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
      _drivers.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
      _taskLocks.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));

      if (_modulesArray[i]?.init != null)
        _modulesArray[i]?.init({ moduleData: structuredClone(_moduleDataArray[i]), simulationContext });
    }

    //# call `setTaskLocksBeforeTheSimulationStarts()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        if (_modulesArray[i]?.setTaskLocksBeforeTheSimulationStarts != null)
          _modulesArray[i]?.setTaskLocksBeforeTheSimulationStarts();
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

    //# call `setDriversAndSettingsBeforeTheSimulationStarts()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        if (_modulesArray[i]?.setDriversAndSettingsBeforeTheSimulationStarts != null)
          _modulesArray[i]?.setDriversAndSettingsBeforeTheSimulationStarts();
      }
    }

    //# call `prepareDataForDailyModeling()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        if (_modulesArray[i]?.prepareDataForDailyModeling != null)
          _modulesArray[i]?.prepareDataForDailyModeling();
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
    _endDate = sanitize({
      value: _settings.get({ unit: CFG.SIMULATION_NAME, name: SETTINGS_NAMES.Simulation.$$SIMULATION_END_DATE }),
      sanitization: schema.DATE_TYPE + schema.OPTIONAL
    });
    // if `_startDate` is still undefined, set it to default value (Date(0))
    if (_startDate == null) _startDate = stripTime(new Date(0));
    // if `_endDate` is still undefined, set it to default value (to 10 years from now, at the end of the year)
    if (_endDate == null) _endDate = stripTime(new Date(new Date().getFullYear() + CFG.DEFAULT_NUMBER_OF_YEARS_FROM_TODAY, 11, 31));

    //#endregion set `_startDate`/`_endDate`

    //#region lock what can't be no more modified during the daily modeling
    _settings.lockImmutables();  // lock further definition of immutable values
    _drivers.lockImmutables();  // lock further definition of immutable values
    _taskLocks.lock();  // lock TaskLocks
    //#endregion lock what can't be no more modified during the daily modeling

    //#region call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)
    for (let today = _startDate; today <= _endDate; today.setDate(today.getDate() + 1)) {
      _ledger.lock();  // lock Ledger at the beginning of each day

      _ledger.setToday(today);
      _settings.setToday(today);
      _drivers.setToday(today);

      // call `taskLocksBeforeDailyModeling`
      _taskLocksBeforeDailyModeling.forEach(taskLockEntry => {
        setDebugModuleInfoForLedgerAndSettings(taskLockEntry.debugModuleInfo);
        taskLockEntry.taskLock();
      });

      //# call `beforeDailyModeling()`
      for (let i = 0; i < _modulesArray.length; i++) {
        if (_modulesArray[i].alive) {
          setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
          if (_modulesArray[i]?.beforeDailyModeling != null)
            _modulesArray[i]?.beforeDailyModeling({ today });
        }
      }

      _ledger.unlock();  // unlock Ledger before calling `dailyModeling`

      //# call `dailyModeling()`
      for (let i = 0; i < _modulesArray.length; i++) {
        if (_modulesArray[i].alive) {
          setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
          if (_modulesArray[i]?.dailyModeling != null)
            _modulesArray[i]?.dailyModeling({ today });
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

    //# call `oneTimeAfterTheSimulationEnds()`
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive) {
        setDebugModuleInfoForLedgerAndSettings(getDebugModuleInfo(_moduleDataArray[i]));
        if (_modulesArray[i]?.oneTimeAfterTheSimulationEnds != null)
          _modulesArray[i]?.oneTimeAfterTheSimulationEnds();
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
      const _newDate = stripTime(sanitize({
        value: newDate,
        sanitization: schema.DATE_TYPE + schema.OPTIONAL
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
        const _isSimulation = sanitize({ value: _entry.isSimulation, sanitization: schema.BOOLEAN_TYPE });
        const _name = sanitize({ value: _entry.name, sanitization: schema.STRING_TYPE });

        if (_isSimulation) {
          if (_taskLocks.isDefined({ name: _name }))
            _taskLocksSequenceArray.push({ taskLock: _taskLocks.get({ name: _name }), debugModuleInfo: _taskLocks.getDebugModuleInfo({ name: _name }) });
        } else {  // if not simulation, search in all Units different from default
          // get the list of Locks with a specific name NOT defined on default Unit, then push them in the array
          _taskLocks.getListOfNotDefaultUnitLocks({ name: _name }).forEach(entry => {
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
      const _debugFlagFromParameter = sanitize({ value: debugParameter, sanitization: schema.STRINGLOWERCASETRIMMED_TYPE });
      const _debugFlagFromSettings = sanitize({
        value: settings.get({ unit: CFG.SIMULATION_NAME, name: SETTINGS_NAMES.Simulation.$$DEBUG_FLAG }),
        sanitization: schema.STRINGLOWERCASETRIMMED_TYPE
      });

      if (isStringOrBooleanTrue(_debugFlagFromParameter) || isStringOrBooleanTrue(_debugFlagFromSettings))
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
