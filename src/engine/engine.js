export { engine };

import { ModuleData } from './modules/module_data.js';

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
 * @param {ModuleData[]} p.input - Array of `ModuleData` objects
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 * @param {modulesResolver} p.modulesLoaderResolver - Function to get a list of URL from which import a module
 */
function engine ({ input, appendTrnDump, modulesLoaderResolver }) {
  console.dir(input);

  appendTrnDump("ciao, messaggio di prova! " + new Date(Date.now()).toJSON() + "\n") // todo remove
  appendTrnDump("ciao, secondo messaggio di prova! " + new Date(Date.now()).toJSON() + "\n") // todo remove

  // TODO  inizializza `simulation context` che contiene:
  //       * `Ledger`, passando `appendTrnDump`

  // TODO  inizializza `moduleRunner` passando `simulation context`, `modulesLoaderResolver`
}
