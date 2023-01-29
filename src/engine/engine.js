export { engine };

import { ModuleData } from './modules/module_data.js';
import { ModulesRunner } from './modules/modules_runner.js';
import { Ledger } from './ledger/ledger.js';

/**
 * Callback to dump the transactions
 *
 * @callback appendTrnDump
 * @param {string} dump - The transactions dump
 */

/**
 * @callback modulesLoaderResolver
 * @param {string} module - The module to resolve
 * @return {string[]} List of URL from which import a module
 */

/**
 * @param {Object} p
 * @param {ModuleData[]} p.userInput - Array of `ModuleData` objects
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @param {modulesLoaderResolver} p.modulesLoaderResolver - Function to get a list of URL from which import a module
 */
function engine ({ userInput, appendTrnDump, modulesLoaderResolver }) {
  const ledger =  new Ledger({ appendTrnDump });
  const modulesRunner =  new ModulesRunner({ userInput, modulesLoaderResolver, ledger });
}
