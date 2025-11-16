/**
 * Decimal Arithmetic Adapter
 *
 * Intermediate layer for arithmetic operations
 * Swap between Decimal.js, decimal-light.js, or native arithmetic
 * by changing this file without touching core code
 */

import { Decimal } from '../../decimaljs/decimal.js';

/**
 * Add two numbers
 * @param {number|string} a
 * @param {number|string} b
 * @returns {string}
 */
export function add(a, b) {
  return new Decimal(a).plus(b).toString();
}

/**
 * Subtract two numbers
 * @param {number|string} a
 * @param {number|string} b
 * @returns {string}
 */
export function subtract(a, b) {
  return new Decimal(a).minus(b).toString();
}

/**
 * Multiply two numbers
 * @param {number|string} a
 * @param {number|string} b
 * @returns {string}
 */
export function multiply(a, b) {
  return new Decimal(a).times(b).toString();
}

/**
 * Divide two numbers
 * @param {number|string} a
 * @param {number|string} b
 * @returns {string}
 */
export function divide(a, b) {
  return new Decimal(a).dividedBy(b).toString();
}

/**
 * Raise a to the power of b
 * @param {number|string} a
 * @param {number|string} b
 * @returns {string}
 */
export function pow(a, b) {
  return new Decimal(a).pow(b).toString();
}

/**
 * Modulo operation
 * @param {number|string} a
 * @param {number|string} b
 * @returns {string}
 */
export function modulo(a, b) {
  return new Decimal(a).modulo(b).toString();
}
