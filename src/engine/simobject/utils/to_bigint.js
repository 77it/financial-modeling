export { toBigInt };

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
  const integer = _moveTheDecimalPointToTheRight(n, decimalPlaces);
  if (roundingModeIsRound) {
    const rounded = _roundHalfAwayFromZero(integer);
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
function _moveTheDecimalPointToTheRight(n, dp) {
  // Convert the number to a string and split it into integer and fractional parts
  const [integerPart, fractionalPart = ''] = n.toString().split('.');

  // Pad the fractional part with zeros to ensure it has at least `dp` digits
  const paddedFractionalPart = fractionalPart.padEnd(dp, '0');

  // Concatenate the integer part and the padded fractional part, moving the decimal point to the right by `dp` positions
  const resultString = integerPart + paddedFractionalPart.slice(0, dp) + '.' + paddedFractionalPart.slice(dp);

  // Convert the resulting string back to a number and return it
  return parseFloat(resultString);
}

/** Round n as Excel does ("Round half away from zero").
 * In Excel
 *    1.4 >  1    1.5 >  2    2.4 >  2     2.5 >  3
 *   -1.4 > -1   -1.5 > -2   -2.4 > -2    -2.5 > -3
 @private
 * @param {number} n - The number to round.
 * @returns {number}
 */
function _roundHalfAwayFromZero(n) {
  const sign = Math.sign(n);
  return sign * Math.round(Math.abs(n));
}
//#endregion private functions