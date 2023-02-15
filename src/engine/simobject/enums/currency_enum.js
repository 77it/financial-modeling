export const currency_enum =
  {
    UNDEFINED: "UNDEFINED",
    EUR: "EUR",
    USD: "USD"
  };

// @ts-ignore
export const currency_enum_validation = Object.keys(currency_enum).map(key => currency_enum[key]);
