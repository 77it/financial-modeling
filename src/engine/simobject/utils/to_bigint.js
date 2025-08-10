export { toBigInt };

import { roundHalfAwayFromZero } from '../../../lib/number_utils.js';

/**
 * This function is used to convert a number to a BigInt, preserving a given number of decimal places and rounding/truncating the rest.
 * If `#roundingModeIsRound` is true, the number is rounded as Excel does ("Round half away from zero") to the given number of decimal places.
 * If `#roundingModeIsRound` false, the number is truncated to the given number of decimal places.
 * @param {number} n - number to convert
 * @param {number} decimalPlaces
 * @param {boolean} roundingModeIsRound
 * @returns {bigint}
 */
function toBigInt (n, decimalPlaces, roundingModeIsRound) {
  const integer = _moveDecimalPointToTheRightSafely(n, decimalPlaces);
  if (roundingModeIsRound) {
    const rounded = roundHalfAwayFromZero(integer);
    return BigInt(rounded);
  }
  else {
    const truncated = Math.trunc(integer);
    return BigInt(truncated);
  }
}


//#region private functions

/** Move the decimal point to the right by `decimalPlaces` positions (manipulating the number string to prevent loss of precision)
 * Without this function, 10.075 * 10 ** 2 = 1007.4999999999999
 @private
 * @param {number} n - The number to convert
 * @param {number} dp - The number of decimal places
 * @returns {number}
 */
function _moveDecimalPointToTheRightSafely(n, dp) {
  // Convert the number to a string and split it into integer and fractional parts
  const [integerPart, fractionalPart = ''] = n.toString().split('.');

  // Ensure the fractional part has at least `dp` digits by padding with zeros
  const paddedFractionalPart = fractionalPart.padEnd(dp, '0');

  // Construct the result string by moving the decimal point to the right
  const resultString = `${integerPart}${paddedFractionalPart.slice(0, dp)}.${paddedFractionalPart.slice(dp)}`;

  // Parse the result string back to a number and return it
  return Number(resultString);
}
//#endregion private functions
