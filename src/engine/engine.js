export { engine };

import { validateObj } from '../deps.js';

import { Ledger } from './ledger/ledger.js';
import { ModuleData } from './modules/module_data.js';
import { Module } from '../modules/_sample_module.js';
import { Drivers } from './drivers/drivers.js';
import { SharedConstants } from './sharedconstants/sharedconstants.js';
import { NewDebugSimObjectDto } from './ledger/commands/newdebugsimobjectdto.js';
import { SimObjectDebugTypes_enum } from './simobject/simobject_debugtypes_enum.js';

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
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @return {Promise<Result>}
 */
async function engine ({ modulesData, modules, appendTrnDump }) {
  let _ledger = null;  // define _ledger here to be able to use it in the `finally` block
  try {
    validateObj({
      obj: { modulesData, modules, appendTrnDump },
      validation: { modulesData: 'array', modules: 'array', appendTrnDump: 'function' }
    });
    if (modulesData.length !== modules.length) throw new Error('modulesData.length !== modules.length');

    const _moduleDataArray = modulesData;
    const _modulesArray = modules;
    //#region variables declaration
    _ledger = new Ledger({ appendTrnDump });
    const _drivers = new Drivers();
    const _sharedConstants = new SharedConstants();
    // set _startDate (mutable) to 10 years ago, at the start of the year
    let _startDate = new Date(new Date().getFullYear() - 10, 0, 1);
    // set _endDate (mutable) to 10 years from now, at the end of the year
    const _endDate = new Date(new Date().getFullYear() + 10, 11, 31);
    //#endregion variables declaration

    // TODO set _startDate/_endDate:
    // 1. call Settings module, one time, to get _endDate
    // 2. call all modules, one time
    // 2.a if 1. didn't set _endDate, ask to each module the _endDate
    // 2.b ask to each module the _startDate

    // TODO NOW: call module one time to do something
    //#region call all modules, one time
    for (let i = 0; i < _modulesArray.length; i++) {
      if (_modulesArray[i].alive) {
        setCurrentModuleData({ moduleData: _moduleDataArray[i], ledger: _ledger, drivers: _drivers, sharedConstants: _sharedConstants });
        // TODO NOW NOW NOW NOW
        checkOpenTransaction({ ledger: _ledger, moduleData: _moduleDataArray[i] });
      }
    }
    //#endregion call all modules, one time

    // TODO setDebugLevel, reading debug SHAREDCONSTANTS_RESERVEDNAMES.SIMULATION__DEBUG_FLAG
    _ledger.setDebugLevel();

    // TODO NOW: call all modules, every day, until the end of the simulation
    //#region call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)
    for (let date = _startDate; date <= _endDate; date.setDate(date.getDate() + 1)) {
      for (let i = 0; i < _modulesArray.length; i++) {
        if (_modulesArray[i].alive) {
          _ledger.setCurrentModuleData(_moduleDataArray[i]);
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
    _ledger?.newDebugSimObject(new NewDebugSimObjectDto({
      type: SimObjectDebugTypes_enum.DEBUG_ERROR,
      description: _error,
    }));
    _ledger?.forceCommitWithoutValidation();

    return { success: false, error: _error };
  }
  return { success: true };

  //#region local functions
  /** Check if a transaction is open, and if so, throw an error
   * @param {Object} p
   * @param {Ledger} p.ledger
   * @param {ModuleData} p.moduleData
   */
  function checkOpenTransaction ({ ledger, moduleData }) {
    if (ledger.transactionIsOpen())
      throw new Error(`after calling module ${moduleData.moduleName} ${moduleData.moduleEngineURI}  a transaction is open`);
  }

  /** Set the current module data
   * @param {Object} p
   * @param {ModuleData} p.moduleData
   * @param {Ledger} p.ledger
   * @param {Drivers} p.drivers
   * @param {SharedConstants} p.sharedConstants
   */
  function setCurrentModuleData ({ moduleData, ledger, drivers, sharedConstants }) {
    ledger.setCurrentModuleData(moduleData);
    drivers.setCurrentModuleData(moduleData);
    sharedConstants.setCurrentModuleData(moduleData);
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
