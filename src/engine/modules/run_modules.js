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
 * @callback modulesLoader_Resolve
 * @param {string} module - The module to resolve
 * @return {string[]} List of URL from which import a module
 */

/**
 @param {Object} p
 @param {ModuleData[]} p.userInput - Array of `ModuleData` objects
 @param {modulesLoader_Resolve} p.modulesLoader_Resolve Callback to dump the transactions
 @param {Ledger} p.ledger Ledger object, already initialized
 */
function runModules ({ userInput, modulesLoader_Resolve, ledger }) {
    const _modulesLoader = new ModulesLoader({ modulesLoader_Resolve });

    // TODO not implemented
    console.dir(userInput); // todo TOREMOVE
    throw new Error('not implemented');
}
