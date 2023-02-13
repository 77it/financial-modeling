export { engine };

import { Ledger } from './ledger/ledger.js';
import { ModulesLoader } from './../modules/_modules_loader.js';
import { ModuleData } from './modules/module_data.js';
import { Drivers } from './drivers/drivers.js';
import { SharedConstants } from './sharedconstants/sharedconstants.js';
import { Module } from '../modules/_sample_module.js';

// TODO
/*
# closed/expired modules
There must be a way to tell - by the modules - to engine.js that a module is no longer alive and should not be called anymore.

# modules with undefined methods
before calling a module method checks if the method is defined, otherwise it skips the call
 */

/**
 * @param {Object} p
 * @param {ModuleData[]} p.moduleDataArray - Array of `ModuleData` objects
 * @param {modulesLoader_Resolve} p.modulesLoader_Resolve - Callback to dump the transactions
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @return {Promise<Result>}
 */
async function engine ({ moduleDataArray, modulesLoader_Resolve, appendTrnDump }) {
  try {
    //#region variables declaration
    const _modulesLoader = new ModulesLoader({ modulesLoader_Resolve });
    /** Array of module classes
     * @type {Module[]} */
    const _modulesRepo = [];
    const _ledger = new Ledger({ appendTrnDump });
    const _drivers = new Drivers();
    const _sharedConstants = new SharedConstants();
    // set _startDate (mutable) to 10 years ago, at the start of the year
    let _startDate = new Date(new Date().getFullYear() - 10, 0, 1);
    // set _endDate (mutable) to 10 years from now, at the end of the year
    const _endDate = new Date(new Date().getFullYear() + 10, 11, 31);
    //#endregion variables declaration

    await _init_modules_classes_in_modulesRepo__loading_Modules_fromUri(
      { modulesLoader: _modulesLoader, moduleDataArray, modulesRepo: _modulesRepo });

    // TODO set _startDate/_endDate:
    // 1. call Settings module, one time, to get _endDate
    // 2. call all modules, one time
    // 2.a if 1. didn't set _endDate, ask to each module the _endDate
    // 2.b ask to each module the _startDate

    // TODO NOW: call module one time to do something
    //#region call all modules, one time
    for (let i = 0; i < _modulesRepo.length; i++) {
      if (_modulesRepo[i].alive) {
        // TODO NOW NOW NOW NOW NOW
      }
      checkOpenTransaction({ ledger: _ledger, moduleData: moduleDataArray[i] });
    }
    //#endregion call all modules, one time

    // TODO NOW: call all modules, every day, until the end of the simulation
    //#region call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)
    for (let date = _startDate; date <= _endDate; date.setDate(date.getDate() + 1)) {
      for (let i = 0; i < _modulesRepo.length; i++) {
        if (_modulesRepo[i].alive) {
          // TODO NOW NOW NOW NOW NOW
          checkOpenTransaction({ ledger: _ledger, moduleData: moduleDataArray[i] });
        }
      }
    }
    //#endregion call all modules, every day, until the end of the simulation (loop from _startDate to _endDate)

    console.dir(moduleDataArray); // todo TOREMOVE
    throw new Error('not implemented');

  } catch (error) {
    const _error = error.stack?.toString() ?? error.toString();
    console.log(_error);
    // TODO NOW implement error management
    /*
    Every module that wants to interrupt program execution for a fatal error throws a new Error;
    this error is intercepted here, and will be recorded a 'debug_error' SimObject, then the execution ends with an error.
     */
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

  /**
   Load modules on modulesLoader reading moduleDataArray, then init the classes and store them in modulesRepo
   * @param {Object} p
   * @param {ModulesLoader} p.modulesLoader
   * @param {ModuleData[]} p.moduleDataArray
   * @param {*[]} p.modulesRepo
   */
  async function _init_modules_classes_in_modulesRepo__loading_Modules_fromUri ({ modulesLoader, moduleDataArray, modulesRepo }) {
    for (const moduleData of moduleDataArray) {
      let module = modulesLoader.get({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
      if (!module) {
        await modulesLoader.addClassFromURI({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
        module = modulesLoader.get({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
      }
      if (!module)
        throw new Error(`module ${moduleData.moduleName} not found`);
      modulesRepo.push(new module.class());
    }
  }

  //#endregion
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
