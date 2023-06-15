// TODO funzione di modules/utils che crea una voce di cassa a completamento dello sbilancio corrente (es VsCash)

import { SimObjectTypes_enum } from '../../engine/simobject/simobject_types_enum.js';
import { Ledger } from '../../engine/ledger/ledger.js';
import { UnitObjects} from '../../config/standard_names.js';

const CASH_TYPE = SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT;
const CASH_DEFAULT_NAME = UnitObjects.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT;

/** Function that creates a cash entry to complete the current ledger with default name and type, taken from a Config defined here.
 * @param {Object} p
 * @param {Ledger} p.unit
 * @param {Ledger} p.ledger
 */
export function squareTrnWithCash ({ ledger }) {
  xxx; // read the current ledger unbalanced amount and create a cash entry to balance it
}
