export { engine };

import { ModuleData } from './modules/module_data.js';

/**
 * Callback to dump the transactions
 *
 * @callback appendTrnDump
 * @param {string} dump - The transactions dump
 */

/**
 * @param {Object} p
 * @param {ModuleData[]} p.input - Array of `ModuleData` objects
 * @param {appendTrnDump} p.appendTrnDump - Function to append the transactions dump
 */
function engine ({ input, appendTrnDump }) {
  console.dir(input);

  appendTrnDump("ciao, messaggio di prova! " + new Date(Date.now()).toJSON()) // todo remove

  // TODO  inizializza `simulation context` che contiene:
  //       * `Ledger`

  // TODO  inizializza `moduleRunner` passando `simulation context`
}
