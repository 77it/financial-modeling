export { EVALUATE_NUMBERS_AS_DECIMALSCALEDBIGINT, convertWhenFmlEvalRequiresIt, complexNestedFunctionsAndFormulasWithJSONX }

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

const complexNestedFunctionsAndFormulasWithJSONX = '{calc: sumObj({x: "2.5", y: [3, 4+1], z: {w: (a + 1) * 2}}) + 1, nested: {arr: [1+1, {v: sum(1,2,3)}, q({deep: {n: 4+1}})]}, mix: q({inside: [(b + 2) * 3, {t: "7.75"}]})}';
