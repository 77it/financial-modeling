export { roundHalfAwayFromZero, roundHalfAwayFromZeroWithPrecision, truncWithPrecision, anyToDecimal, anyToDecimalOrDefault };

import { Decimal } from '../../vendor/decimal/decimal.js';

const DEFAULT_DECIMAL = new Decimal(0);

/** Round n as Excel does ("Round half away from zero").
 * In Excel
 *    1.4 ->  1    1.5 ->  2    2.4 ->  2     2.5 ->  3
 *   -1.4 -> -1   -1.5 -> -2   -2.4 -> -2    -2.5 -> -3
 @private
 * @param {number} n - The number to round.
 * @returns {number}
 */
function roundHalfAwayFromZero(n) {
  const sign = Math.sign(n);
  return sign * Math.round(Math.abs(n));
}

/** Round n as Excel does ("Round half away from zero") with specified precision.
 * Examples with precision 2:
 *    1.456 ->  1.46    1.555 ->  1.56    2.444 ->  2.44
 *   -1.456 -> -1.46   -1.555 -> -1.56   -2.444 -> -2.44
 * @param {number} n - The number to round
 * @param {number} precision - Number of decimal places (0 to 20)
 * @returns {number} - Rounded number with specified precision
 * @throws {Error} If precision is not between 0 and 20
 */
function roundHalfAwayFromZeroWithPrecision(n, precision) {
  if (precision < 0 || precision > 20) {
    throw new Error('Precision must be between 0 and 20');
  }
  const factor = Math.pow(10, precision);
  const epsilon = n >= 0 ? Number.EPSILON : -Number.EPSILON; // Adjust epsilon based on sign of n
  return roundHalfAwayFromZero((n + epsilon) * factor) / factor;
}

/** Truncate a number to specified decimal places.
 * Examples with precision 2:
 *    1.456 ->  1.45    1.555 ->  1.55    2.449 ->  2.44
 *   -1.456 -> -1.45   -1.555 -> -1.55   -2.449 -> -2.44
 * @param {number} n - The number to truncate
 * @param {number} precision - Number of decimal places (0 to 20)
 * @returns {number} - Truncated number with specified precision
 * @throws {Error} If precision is not between 0 and 20
 */
function truncWithPrecision(n, precision) {
  if (precision < 0 || precision > 20) {
    throw new Error('Precision must be between 0 and 20');
  }
  const factor = Math.pow(10, precision);
  // EPSILON is needed to prevent truncation of 1.005 with precision 3 in 1.004
  // because 1.005 * 1000 = 1004.9999999999999 then Math.trunc(1004.9999999999999) = 1004 and not 1005 as expected
  const epsilon = n >= 0 ? Number.EPSILON : -Number.EPSILON; // Adjust epsilon based on sign of n
  return Math.trunc((n + epsilon) * factor) / factor;
}

/** Convert any value to a Decimal object.
 * Returns Decimal(0) if conversion is not possible.
 * @param {*} value
 * @return {Decimal} - Decimal object
 */
function anyToDecimal(value) {
  return anyToDecimalOrDefault(value, DEFAULT_DECIMAL);
}

/** Convert any value to a Decimal object.
 * Returns `defaultValue` if conversion is not possible.
 * @param {*} value
 * @param {*} [defaultDecimal] - Default value if conversion fails (can be anything, also undefined)
 * @return {Decimal | *} - Decimal object, or defaultValue if conversion fails
 */
function anyToDecimalOrDefault(value, defaultDecimal) {
  // If defaultDecimal is not provided, use DEFAULT_DECIMAL
  const _DEFAULT_DECIMAL = (arguments.length >= 2) ? defaultDecimal : DEFAULT_DECIMAL;

  try {
    if (value == null) {
      return _DEFAULT_DECIMAL;
    } else if (typeof value === 'string') {
      const _trimmed = value.trim();
      return _trimmed === '' ? new Decimal(0) : new Decimal(_trimmed);
    } else if (value instanceof Decimal) {
      return value;
    } else if (typeof value === 'number') {
      return isFinite(value) ? new Decimal(value) : _DEFAULT_DECIMAL;
    } else if (value instanceof Date) {
      const _time = value.getTime();
      return Number.isFinite(_time) ? new Decimal(_time) : _DEFAULT_DECIMAL;
    } else if (typeof value === 'bigint') {
      return new Decimal(value.toString());
    } else if (typeof value === 'boolean') {
      return new Decimal(value ? 1 : 0);
    } else if (Array.isArray(value)) {
      return new Decimal(String(value));
    } else {
      return new Decimal(value);
    }
  } catch (_) {
    return _DEFAULT_DECIMAL;
  }
}
