import { deepFreeze, ensureArrayValuesAreUnique } from '../../../lib/obj_utils.js';

export const Currency_enum =
  {
    UNDEFINED: "UNDEFINED",
    EUR: "EUR",
    USD: "USD"
  };
deepFreeze(Currency_enum);

export const Currency_enum_validation = ensureArrayValuesAreUnique(Object.values(Currency_enum));
