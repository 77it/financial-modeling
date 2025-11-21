/**
 * Decimal Arithmetic Adapter
 *
 * Intermediate layer for arithmetic operations
 * Swap between Decimal.js, decimal-light.js, or native arithmetic
 * by changing this file without touching core code
 */

export { add, subtract, multiply, divide, pow, modulo };

import { DSB } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { Decimal } from '../../decimaljs/decimal.js';
import { anyToDecimal } from '../../../src/lib/decimal_utils.js';

/**
 * Add two numbers
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @returns {bigint}
 */
function add(a, b) {
  //return new Decimal(a).plus(b).toString();
  return DSB.add(a, b);
}

/**
 * Subtract two numbers
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @returns {bigint}
 */
function subtract(a, b) {
  //return new Decimal(a).minus(b).toString();
  return DSB.sub(a, b);
}

/**
 * Multiply two numbers
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @returns {bigint}
 */
function multiply(a, b) {
  //return new Decimal(a).times(b).toString();
  return DSB.mul(a, b);
}

/**
 * Divide two numbers
 * @param {number|string|bigint} a
 * @param {number|string|bigint} b
 * @returns {bigint}
 */
function divide(a, b) {
  //return new Decimal(a).dividedBy(b).toString();
  return DSB.div(a, b);
}

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
