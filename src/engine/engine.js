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
 * @callback modulesLoader_Resolve
 * @param {string} module - The module to resolve
 * @return {string[]} List of URL from which import a module
 */

/**
 * @param {Object} p
 * @param {ModuleData[]} p.userInput - Array of `ModuleData` objects
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @param {modulesLoader_Resolve} p.modulesLoader_Resolve - Function to get a list of URL from which import a module
 */
function engine ({ userInput, appendTrnDump, modulesLoader_Resolve }) {
  const ledger =  new Ledger({ appendTrnDump });
  const modulesRunner =  new ModulesRunner({ userInput, modulesLoader_Resolve, ledger });
}
