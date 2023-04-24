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
  /** @type {Ledger} */
  let _ledger = new Ledger({ appendTrnDump, decimalPlaces: CFG.DECIMAL_PLACES, roundingModeIsRound: CFG.ROUNDING_MODE });  // define _ledger here to be able to use it in the `finally` block
  /** @type {TaskLocks} */
  const _taskLocks = new TaskLocks({ defaultUnit: STD_NAMES.Simulation.NAME });
  /** @type {Date} */
  let _startDate = undefined;
  /** @type {Date} */
  let _endDate = undefined;

  try {
    validation.validateObj({
      obj: { modulesData, modules, appendTrnDump },
      validation: { modulesData: validation.ARRAY_TYPE, modules: validation.ARRAY_TYPE, appendTrnDump: validation.FUNCTION_TYPE }
    });
    if (modulesData.length !== modules.length) throw new Error('modulesData.length !== modules.length');

    const _moduleDataArray = modulesData;
    const _modulesArray = modules;
    //#region variables declaration
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
    //#endregion variables declaration

    //#region set contexts
    const simulationContextStart = new SimulationContextStart({
      setSetting: _settings.set,
      setDriver: _drivers.set,
      setTaskLock: _taskLocks.set
    });
    //#endregion set contexts

    // lock Ledger
    _ledger.lock();

    //#region calling `oneTimeBeforeTheSimulationStarts`
    for (let i = 0; i < _modulesArray.length; i++) {
      _ledger.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));  // set debugModuleInfo on ledger because it's used from newDebugErrorSimObject() called while catching errors
      _settings.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
      _drivers.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
      _taskLocks.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));

      _modulesArray[i]?.oneTimeBeforeTheSimulationStarts({ moduleData: _moduleDataArray[i], simulationContextStart });
    }
    //#endregion calling `oneTimeBeforeTheSimulationStarts`

    setLedgerDebugLevel({ debugParameter: debug, settings: _settings });

    //#region set `_startDate`/`_endDate`
    // set _startDate to the earliest startDate of all modules
    for (let i = 0; i < _modulesArray.length; i++) {
      updateStartDate(_modulesArray[i]?.startDate());  // set or update _startDate
    }
    // read `$$SIMULATION_END_DATE` from settings
    const _settingEndDate = sanitization.sanitize({
      value: _settings.get({ unit: STD_NAMES.Simulation.NAME, name: SETTINGS_NAMES.Simulation.$$SIMULATION_END_DATE }),
      sanitization: sanitization.DATE_TYPE + sanitization.OPTIONAL
    });
    // if `_startDate` is still undefined, set it to default value (Date(0))
    if (_startDate == null) _startDate = new Date(0);
    // if `_settingEndDate` is undefined, set `_endDate` to default value (to 10 years from now, at the end of the year)
    (_settingEndDate != null) ? _endDate = _settingEndDate : _endDate = new Date(new Date().getFullYear() + CFG.DEFAULT_NUMBER_OF_YEARS_FROM_TODAY, 11, 31);

    //#endregion set `_startDate`/`_endDate`

    //#region build taskLocks sequence arrays
    const _taskLocksBeforeDailyModeling = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksBeforeDailyModeling);
    const _taskLocksAfterDailyModeling = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksAfterDailyModeling);
    const _taskLocksAfterSimulationEnds = buildTaskLocksSequenceArray(TASKLOCKS_SEQUENCE.taskLocksAfterSimulationEnds);
    //#endregion build taskLocks sequence arrays

    //#region call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)
    for (let date = _startDate; date <= _endDate; date.setDate(date.getDate() + 1)) {
      _ledger.setToday(date);
      _settings.setToday(date);
      _drivers.setToday(date);

      //#region calling `taskLocksBeforeDailyModeling`
      _taskLocksBeforeDailyModeling.forEach(taskLockEntry => {
        _ledger.setDebugModuleInfo(taskLockEntry.debugModuleInfo);
        taskLockEntry.taskLock();  // call taskLock
      });
      //#endregion calling `taskLocksBeforeDailyModeling`

      //#region calling XXX
      for (let i = 0; i < _modulesArray.length; i++) {
        if (_modulesArray[i].alive) {
          _ledger.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
          // TODO NOW NOW NOW NOW
          ensureNoTransactionIsOpen({ ledger: _ledger, moduleData: _moduleDataArray[i] });
        }
      }
      //#endregion calling XXX
    }
    //#endregion call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)

    console.dir(_moduleDataArray); // todo TOREMOVE
    throw new Error('not implemented');

  } catch (error) {
    /*
    Every module that wants to interrupt program execution for a fatal error throws a new Error;
    this error is intercepted here, and will be recorded a 'debug_error' SimObject, then the execution ends with an error.
     */

    const _error = error.stack?.toString() ?? error.toString();
    console.log(_error);
    _ledger?.newDebugErrorSimObject(new NewDebugSimObjectDto({ description: _error }));
    _ledger?.forceCommitWithoutValidation();

    return new Result({ success: false, error: _error });
  }
  return new Result({ success: true });

  //#region local functions
  /**
   * Set/reset simulation start date; overwrite `_startDate` only if the new date is earlier than the current `_startDate` (or if `_startDate` is not set yet)
   * @param {undefined|Date} date - Simulation start date
   */
  function updateStartDate (date) {
    const _date = stripTime(sanitization.sanitize({
      value: date,
      sanitization: sanitization.DATE_TYPE + sanitization.OPTIONAL
    }));
    if (_date == null)
      return;
    if (_startDate == null)
      _startDate = _date;
    if (_date < _startDate)
      _startDate = _date;
  }

  /** set Ledger debug level, if engine `debug` parameter or Settings.Simulation.$DEBUG_FLAG are true
   * @param {Object} p
   * @param {undefined|boolean} p.debugParameter
   * @param {Settings} p.settings
   */
  function setLedgerDebugLevel ({ debugParameter, settings }) {
    const _debugFlagFromParameter = sanitization.sanitize({ value: debugParameter, sanitization: sanitization.STRING_TYPE });
    const _debugFlagFromSettings = sanitization.sanitize({
      value: settings.get({ unit: STD_NAMES.Simulation.NAME, name: SETTINGS_NAMES.Simulation.$$DEBUG_FLAG }),
      sanitization: sanitization.STRING_TYPE
    });

    if (_debugFlagFromParameter === BOOLEAN_TRUE_STRING | _debugFlagFromSettings === BOOLEAN_TRUE_STRING)
      _ledger.setDebug();
  }

  /** Return debug info about the current module, to be used in the ledger, drivers and taskLocks
   * @param {ModuleData} moduleData
   */
  function getDebugModuleInfo (moduleData) {
    return `moduleName: '${moduleData?.moduleName}', moduleEngineURI: '${moduleData?.moduleEngineURI}', moduleSourceLocation: '${moduleData?.moduleSourceLocation}'`;
  }

  /** Check if a transaction is open, and if so, throw an error
   * @param {Object} p
   * @param {Ledger} p.ledger
   * @param {ModuleData} p.moduleData
   */
  function ensureNoTransactionIsOpen ({ ledger, moduleData }) {
    if (ledger.transactionIsOpen())
      throw new Error(`after calling module ${moduleData.moduleName} ${moduleData.moduleEngineURI}  a transaction is open`);
  }

  /** Build an array of taskLocks sequence entries
   * @param {taskLocksRawCallSequenceEntry[]} taskLocksRawCallSequence
   * @return {taskLocksCallSequenceEntry[]}
   */
  function buildTaskLocksSequenceArray (taskLocksRawCallSequence) {
    /** @type {taskLocksCallSequenceEntry[]} */
    const _taskLocksSequenceArray = [];

    // loop `taskLocksRawCallSequence`
    for (let i = 0; i < taskLocksRawCallSequence.length; i++) {
      const _isSimulation = sanitization.sanitize({ value: p.isSimulation, sanitization: sanitization.BOOLEAN_TYPE });
      const _name = sanitization.sanitize({ value: p.name, sanitization: sanitization.STRING_TYPE });

      if (_isSimulation) {
        if (_taskLocks.isDefined({ name: _name }))
          _taskLocksSequenceArray.push({ taskLock: _taskLocks.get({ name: _name }), debugModuleInfo: _taskLocks.getDebugModuleInfo({ name: _name }) });
      } else {  // if not simulation, search in all Units
        // query TaskLocks to see in which Units the taskLock name is defined, then loop the Units, query TaskLocks again to get the taskLock & debugModuleInfo and push them in the array
        _taskLocks.listUnit({ name: _name }).forEach(unit => {
          _taskLocksSequenceArray.push({ taskLock: _taskLocks.get({ name: _name, unit }), debugModuleInfo: _taskLocks.getDebugModuleInfo({ name: _name, unit }) });
        });
      }
    }
    return _taskLocksSequenceArray;
  }

  //#endregion local functions
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
