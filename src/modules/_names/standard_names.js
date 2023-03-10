export { UnitObjects, Simulation, Scenario };

import { deepFreeze } from '../../lib/obj_utils.js';

const Simulation = {
  NAME: '$',
};
deepFreeze(Simulation);

const UnitObjects = {
  BS_CASH__BANKACCOUNT_FINANCIALACCOUNT: 'cash_account_1',
};
deepFreeze(UnitObjects);

const Scenario = {
  BASE: 'base',
};
deepFreeze(Scenario);

