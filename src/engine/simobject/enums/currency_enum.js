import { deepFreeze } from '../../../lib/obj_utils.js';

export const Currency_enum =
  {
    UNDEFINED: "UNDEFINED",
    EUR: "EUR",
    USD: "USD"
  };
deepFreeze(Currency_enum);

// @ts-ignore
export const Currency_enum_validation = Object.keys(Currency_enum).map(key => Currency_enum[key]);
