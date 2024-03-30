import { SimObjectTypes_enum } from '../../engine/simobject/enums/simobject_types_enum.js';
import { Ledger } from '../../engine/ledger/ledger.js';
import { BS_CASH__BANKACCOUNT_FINANCIALACCOUNT__NAME } from '../../config/engine.js';

const CASH_TYPE = SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT;
const CASH_DEFAULT_NAME = BS_CASH__BANKACCOUNT_FINANCIALACCOUNT__NAME;

/** Creates a cash entry to complete the current ledger with default name and type, taken from a Config defined here.
 * @param {Object} p
 * @param {Ledger} p.unit
 * @param {Ledger} p.ledger
 */
export function squareTrnWithCash ({ ledger }) {
  // TODO funzione di modules/utils che crea una voce di cassa a completamento dello sbilancio corrente (es VsCash)
  xxx; // read the current ledger unbalanced amount and create a cash entry to balance it
}
