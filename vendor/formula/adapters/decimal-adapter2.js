/**
 * Decimal Arithmetic Adapter
 *
 * Intermediate layer for arithmetic operations
 * Swap between Decimal.js, decimal-light.js, or native arithmetic
 * by changing this file without touching core code
 */

export { add, sub, mul, div, pow, modulo, ensureBigIntScaled };

import { ensureBigIntScaled as fxEnsureBigIntScaled, stringToBigIntScaled, fxAdd, fxSub, fxMul, fxDiv } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { Decimal } from '../../decimaljs/decimal.js';
import { anyToDecimal } from '../../../src/lib/decimal_utils.js';

/**
 * Normalize a number to bigint
 * @param {bigint} a
 * @returns {bigint}
 */
function ensureBigIntScaled(a) {
  return fxEnsureBigIntScaled(a);
}

/**
 * Add two numbers
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function add(a, b) {
  //return new Decimal(a).plus(b).toString();
  return fxAdd(a, b);
}

/**
 * Subtract two numbers
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function sub(a, b) {
  //return new Decimal(a).minus(b).toString();
  return fxSub(a, b);
}

/**
 * Multiply two numbers
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function mul(a, b) {
  //return new Decimal(a).times(b).toString();
  return fxMul(a, b);
}

/**
 * Divide two numbers
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function div(a, b) {
  //return new Decimal(a).dividedBy(b).toString();
  return fxDiv(a, b);
}

/**
 * Raise 'a' to the power of 'b'
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function pow(a, b) {
  const decimalA = anyToDecimal(a);
  const decimalB = anyToDecimal(b);
  const string_decimal_a_pow_b = new Decimal(decimalA).pow(decimalB).toString();
  return stringToBigIntScaled(string_decimal_a_pow_b);
}

/**
 * Modulo operation 'a' mod 'b'
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function modulo(a, b) {
  const decimalA = anyToDecimal(a);
  const decimalB = anyToDecimal(b);
  const string_decimal_a_mod_b = new Decimal(decimalA).modulo(decimalB).toString();
  return stringToBigIntScaled(string_decimal_a_mod_b);
}
