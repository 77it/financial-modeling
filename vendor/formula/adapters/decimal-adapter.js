/**
 * Decimal Arithmetic Adapter
 *
 * Intermediate layer for arithmetic operations
 * Swap between Decimal.js, decimal-light.js, or native arithmetic
 * by changing this file without touching core code
 */

export { pow, modulo };

import { DSB } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { Decimal } from '../../decimaljs/decimal.js';
import { anyToDecimal } from '../../../src/lib/decimal_utils.js';

/**
 * Raise 'a' to the power of 'b'
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @returns {bigint}
 */
function pow(a, b) {
  const decimalA = anyToDecimal(a);
  const decimalB = anyToDecimal(b);
  const string_decimal_a_pow_b = new Decimal(decimalA).pow(decimalB).toString();
  return DSB.fromString(string_decimal_a_pow_b);
}

/**
 * Modulo operation 'a' mod 'b'
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @returns {bigint}
 */
function modulo(a, b) {
  const decimalA = anyToDecimal(a);
  const decimalB = anyToDecimal(b);
  const string_decimal_a_mod_b = new Decimal(decimalA).modulo(decimalB).toString();
  return DSB.fromString(string_decimal_a_mod_b);
}
