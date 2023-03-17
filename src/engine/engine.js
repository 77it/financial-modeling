export { engine };

import { validation } from '../deps.js';

import { sanitization } from '../deps.js';
import { Ledger } from './ledger/ledger.js';
import { ModuleData } from './modules/module_data.js';
import { Module } from '../modules/_sample_module.js';
import { Drivers } from './drivers/drivers.js';
import { Settings } from './settings/settings.js';
import { TaskLocks } from './tasklocks/tasklocks.js';
import { NewDebugSimObjectDto } from './ledger/commands/newdebugsimobjectdto.js';
import { TaskLocks_ReservedNames } from './tasklocks/tasklocks_reservednames.js';
import * as SETTINGS_NAMES from './settings/settings_names.js';
import * as STD_NAMES from '../modules/_names/standard_names.js';
import { SimulationContextStart } from '../modules/_context/simulationcontext_start.js';

// TODO
/*
# closed/expired modules
There must be a way to tell - by the modules - to engine.js that a module is no longer alive and should not be called anymore.

# modules with undefined methods
before calling a module method checks if the method is defined, otherwise it skips the call
 */

/**
 * @param {Object} p
 * @param {ModuleData[]} p.modulesData - Array of `ModuleData` objects
 * @param {Module[]} p.modules - Array of module classes, in the same order of modulesData
 * @param {string} p.scenarioName - Scenario name
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @return {Promise<Result>}
 */
async function engine ({ modulesData, modules, scenarioName, appendTrnDump }) {
  /** @type {Ledger} */
  let _ledger = new Ledger({ appendTrnDump });  // define _ledger here to be able to use it in the `finally` block
  let _startDate = new Date(0);
  try {
    validation.validateObj({
      obj: { modulesData, modules, appendTrnDump },
      validation: { modulesData: validation.ARRAY_TYPE, modules: validation.ARRAY_TYPE, appendTrnDump: validation.FUNCTION_TYPE }
    });
    if (modulesData.length !== modules.length) throw new Error('modulesData.length !== modules.length');

    const _moduleDataArray = modulesData;
    const _modulesArray = modules;
    //#region variables declaration
    const _settings = new Settings(); // TODO set `scenario` etc in Settings
    const _drivers = new Drivers({ currentScenario: scenarioName, baseScenario: STD_NAMES.Scenario.BASE, defaultUnit: STD_NAMES.Simulation.NAME });
    const _taskLocks = new TaskLocks();  // TODO set STD_NAMES.Simulation.NAME and remove from internal usage
    // set _endDate (mutable) to 10 years from now, at the end of the year
    let _endDate = new Date(new Date().getFullYear() + 10, 11, 31);
    //#endregion variables declaration

    //#region set contexts
    const simulationContextStart = new SimulationContextStart({
      setSetting: _settings.set,
      setDriver: _drivers.set,
      setTaskLock: _taskLocks.set,
      setSimulationStartDate: setStartDate
    });
    //#endregion set contexts

    // TODO set _startDate/_endDate:
    // 1. call Settings module, one time, to get _endDate
    // 2. call all modules, one time
    // 2.a if 1. didn't set _endDate, ask to each module the _endDate
    // 2.b ask to each module the _startDate

    // TODO NOW: call module one time to do something
    //#region call all modules, one time
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive) {
        _ledger.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
        _settings.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
        _drivers.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
        _taskLocks.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
        // TODO NOW NOW NOW NOW
        checkOpenTransaction({ ledger: _ledger, moduleData: _moduleDataArray[i] });
      }
    }
    //#endregion call all modules, one time

    setDebugLevel(_settings);

    // TODO NOW: call all modules, every day, until the end of the simulation
    //#region call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)
    for (let date = _startDate; date <= _endDate; date.setDate(date.getDate() + 1)) {
      for (let i = 0; i < _modulesArray.length; i++) {
        _ledger.setToday(date);
        _settings.setToday(date);
        _drivers.setToday(date);

        if (_modulesArray[i].alive) {
          _ledger.setDebugModuleInfo(getDebugModuleInfo(_moduleDataArray[i]));
          // TODO NOW NOW NOW NOW
          checkOpenTransaction({ ledger: _ledger, moduleData: _moduleDataArray[i] });
        }
      }
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

    return { success: false, error: _error };
  }
  return { success: true };

  //#region local functions
  /**
   * Set simulation start date for a modules; every module can call it, and the resulting start date will be the earliest date of all calls
   * @param {Object} p
   * @param {Date} p.date - Simulation start date
   */
  function setStartDate ({ date }) {
    const _date = sanitization.sanitize({
      value: date,
      sanitization: sanitization.DATE_TYPE,
      validate: true
    });
    if (_date < _startDate) _startDate = _date;
  }

// TODO update
  /** setDebugLevel, reading Settings.Simulation.$DEBUG_FLAG
   * @param {Settings} settings
   */
  function setDebugLevel (settings) {
    const _debugFlag = sanitization.sanitize({
      value: settings.get({ unit: STD_NAMES.Simulation.NAME, name: SETTINGS_NAMES.Simulation.$$DEBUG_FLAG }),
      sanitization: sanitization.BOOLEAN_TYPE
    });

    if (_debugFlag)
      _ledger.setDebugLevel();
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
  function checkOpenTransaction ({ ledger, moduleData }) {
    if (ledger.transactionIsOpen())
      throw new Error(`after calling module ${moduleData.moduleName} ${moduleData.moduleEngineURI}  a transaction is open`);
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

/** @typedef {{success: true, value?: *} | {success:false, error: string}} Result */
//#endregion types definitions
