export const EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT = true;

import { numberToBigIntScaled, stringToBigIntScaled } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';

/**
 * Converts a number to a string if the setting is enabled.
 * @param {*} value
 * @return {*|string}
 */
export function convertWhenFmlEvalRequiresIt(value) {
  if (EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT && typeof value === "number") {
    return numberToBigIntScaled(value);
  } else if (EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT && typeof value === "string") {
    return stringToBigIntScaled(value);
  }
  return value;
}