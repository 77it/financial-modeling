export { EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT, convertWhenFmlEvalRequiresIt }

import { numberToBigIntScaled, stringToBigIntScaled } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';

const EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT = true;

/**
 * Converts a number to a string if the setting is enabled.
 * @param {*} value
 * @return {*|string}
 */
function convertWhenFmlEvalRequiresIt(value) {
  if (EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT && typeof value === "number") {
    return numberToBigIntScaled(value);
  } else if (EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT && typeof value === "string") {
    return stringToBigIntScaled(value);
  }
  return value;
}
