export { UNIT_OBJECTS_NAMES, SIMULATION };

import { deepFreeze } from '../../lib/obj_utils.js';

const SIMULATION = {
  NAME: '$',
};
deepFreeze(SIMULATION);

const UNIT_OBJECTS_NAMES = {
  BS_CASH__BANKACCOUNT_FINANCIALACCOUNT: 'cash_account_1',
};
deepFreeze(UNIT_OBJECTS_NAMES);
