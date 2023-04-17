export { ImmutablePrefix, UnitObjects, Simulation, Scenario };

import { deepFreeze } from '../deps.js';

const ImmutablePrefix = {
  PREFIX__IMMUTABLE_WITHOUT_DATES: '$$',
  PREFIX__IMMUTABLE_WITH_DATES: '$'
};
deepFreeze(ImmutablePrefix);

const Scenario = {
  BASE: 'base',
};
deepFreeze(Scenario);

const Simulation = {
  NAME: '$',
};
deepFreeze(Simulation);

const UnitObjects = {
  BS_CASH__BANKACCOUNT_FINANCIALACCOUNT: 'cash_account_1',
};
deepFreeze(UnitObjects);
