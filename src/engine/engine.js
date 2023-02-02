export { engine };

import { Ledger } from './ledger/ledger.js';
import { ModulesLoader } from './../modules/_modules_loader.js';
import { ModuleData } from './modules/module_data.js';

// TODO
// closed/expired modules
/*
There must be a way to tell - by the modules - to engine.js that a module is no longer alive and should not be called anymore.
 */

/**
 @param {Object} p
 @param {ModuleData[]} p.userInput - Array of `ModuleData` objects
 @param {modulesLoader_Resolve} p.modulesLoader_Resolve Callback to dump the transactions
 @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 @return {Result}
 */
function engine ({ userInput, modulesLoader_Resolve, appendTrnDump }) {
  try {
    const _modulesLoader = new ModulesLoader({ modulesLoader_Resolve });
    const ledger =  new Ledger({ appendTrnDump });

    // TODO load modules on _modulesLoader

    // TODO not implemented
    console.dir(userInput); // todo TOREMOVE
    throw new Error('not implemented');

  } catch (error) {
    const _error = error.stack?.toString() ?? error.toString();
    console.log(_error);
    // TODO implement error management
    /*
    Every module that wants to interrupt program execution for a fatal error throws a new Error;
    this error is intercepted here, and will be recorded a 'debug_error' SimObject, then the execution ends with an error.
     */
    return { success: false, error: _error };
  }
  return { success: true };
}

//#region types definitions
/**
 Callback to dump the transactions
 @callback appendTrnDump
 @param {string} dump - The transactions dump
 */

/**
 @callback modulesLoader_Resolve
 @param {string} module - The module to resolve
 @return {string[]} List of URL from which import a module
 */

/** @typedef {{success: true, value?: *} | {success:false, error: string}} Result */
//#endregion types definitions
