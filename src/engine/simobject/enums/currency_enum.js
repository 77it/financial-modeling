import { deepFreeze } from '../../../lib/obj_utils.js';

export const currency_enum =
  {
    UNDEFINED: "UNDEFINED",
    EUR: "EUR",
    USD: "USD"
  };
deepFreeze(currency_enum);

// @ts-ignore
export const currency_enum_validation = Object.keys(currency_enum).map(key => currency_enum[key]);
