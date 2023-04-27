export { ImmutablePrefix, UnitObjects, Simulation, Scenario };

import { deepFreeze, ensureArrayValuesAreUnique } from '../lib/obj_utils.js';

const ImmutablePrefix = {
  PREFIX__IMMUTABLE_WITHOUT_DATES: '$$',
  PREFIX__IMMUTABLE_WITH_DATES: '$'
};
deepFreeze(ImmutablePrefix);
ensureArrayValuesAreUnique(Object.values(ImmutablePrefix));

const Scenario = {
  BASE: 'base',
};
deepFreeze(Scenario);
ensureArrayValuesAreUnique(Object.values(Scenario));

const Simulation = {
  NAME: '$',
};
deepFreeze(Simulation);
ensureArrayValuesAreUnique(Object.values(Simulation));

const UnitObjects = {
  BS_CASH__BANKACCOUNT_FINANCIALACCOUNT: 'cash_account_1',
};
deepFreeze(UnitObjects);
ensureArrayValuesAreUnique(Object.values(UnitObjects));
