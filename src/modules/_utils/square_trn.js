export { squareTrn };

import { BS_CASH__BANKACCOUNT_FINANCIALACCOUNT__NAME } from '../../config/engine.js';
import { Ledger, SimObjectTypes_enum } from '../../deps.js';

const CASH_TYPE = SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT;
const CASH_DEFAULT_NAME = BS_CASH__BANKACCOUNT_FINANCIALACCOUNT__NAME;

/** Creates a cash entry to complete the current ledger with default name and type, taken from a Config defined here.
 * @param {Object} p
 * @param {string} p.unit
 * @param {string?} p.type  If omitted, uses cash type
 * @param {Ledger} p.ledger
 */
function squareTrn ({ ledger, unit, type }) {
  // TODO funzione di modules/utils che crea una voce di cassa a completamento dello sbilancio corrente (es VsCash)
  xxx; // read the current ledger unbalanced amount and create a cash entry to balance it

  // se è missing la voce contabile di quadratura leggila da globals.DEFAULT_ACCOUNTING_VS_TYPE
  // se la voce contabile di quadratura è CASH_TYPE, usa il nome CASH_DEFAULT_NAME
}
