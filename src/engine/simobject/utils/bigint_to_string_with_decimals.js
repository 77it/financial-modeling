export { bigIntToStringWithDecimals };

/** Convert Big to string, converting to a number with a fixed number of decimal places
 * @param {bigint} big
 * @param {number} decimalPlaces
 * @returns {string}
 */
function bigIntToStringWithDecimals (big, decimalPlaces) {
  // convert big to string, padding the string with zeros to the left to reach the desired number of decimal places + 1
  // example #1: decimalPlaces = 2, big = 123, padding = '123'
  // example #2: decimalPlaces = 4, big = 123, padding = '00123'
  const _str = big.toString().padStart(decimalPlaces + 1, '0');
  // insert a string on the right of str, on the `#decimalPlaces`th character from the right
  return _str.slice(0, -decimalPlaces) + '.' + _str.slice(-decimalPlaces);
}
