export { anyToDecimal, anyToDecimalOrDefault };

import { Decimal } from '../../vendor/decimaljs/decimal.js';

const DEFAULT_DECIMAL = new Decimal(0);

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
