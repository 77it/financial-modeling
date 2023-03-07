export { UNIT_OBJECTS, SIMULATION, SCENARIO };

import { deepFreeze } from '../../lib/obj_utils.js';

const SIMULATION = {
  NAME: '$',
};
deepFreeze(SIMULATION);

const UNIT_OBJECTS = {
  BS_CASH__BANKACCOUNT_FINANCIALACCOUNT: 'cash_account_1',
};
deepFreeze(UNIT_OBJECTS);

const SCENARIO = {
  BASE: 'base',
};
deepFreeze(SCENARIO);

