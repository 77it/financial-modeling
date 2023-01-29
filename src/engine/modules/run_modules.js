export { runModules };

import { Ledger } from '../ledger/ledger.js';
import { ModulesLoader } from '../../modules/_modules_loader.js';
import { ModuleData } from './module_data.js';

// TODO
// closed/expired modules
/*
There must be a way to tell - by the modules - to ModuleRunner that a module is no longer alive and should not be called anymore.
 */

/**
 * Callback to dump the transactions
 *
 * @callback appendTrnDump
 * @param {string} dump - The transactions dump
 */

/**
 * @callback modulesLoader_Resolve
 * @param {string} module - The module to resolve
 * @return {string[]} List of URL from which import a module
 */

/**
 @param {Object} p
 @param {ModuleData[]} p.userInput - Array of `ModuleData` objects
 @param {modulesLoader_Resolve} p.modulesLoader_Resolve Callback to dump the transactions
 @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 @throws Will throw an error if the execution fails
 */
function runModules ({ userInput, modulesLoader_Resolve, appendTrnDump }) {
    const _modulesLoader = new ModulesLoader({ modulesLoader_Resolve });
    const ledger =  new Ledger({ appendTrnDump });

    // TODO not implemented
    console.dir(userInput); // todo TOREMOVE
    throw new Error('not implemented');

    // TODO implement error management
    /*
    Every module that wants to interrupt program execution for a fatal error throws a new Error;
    this error is intercepted here, and will be recorded a 'debug_error' SimObject, then the execution ends with an error.
     */
}
