export { bigIntToNumberWithDecimals };

/**
 * Convert Big to number, converting to a number with a fixed number of decimal places.
 * We don't need to manipulate the number string because integer are well represented as floating point numbers
 * then dividing by 10 ** decimalPlaces won't cause loss of precision.
 * @param {bigint} big
 * @param {number} decimalPlaces
 * @returns {number}
 */
function bigIntToNumberWithDecimals (big, decimalPlaces) {
  return Number(big) / (10 ** decimalPlaces);
}
