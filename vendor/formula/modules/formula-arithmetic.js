/**
 * Formula Arithmetic Module
 * 
 * Handles arithmetic calculations with optional Decimal precision
 * Extracted from core formula.js to enable swappable arithmetic backends
 */

export { decimalCalculate, nativeCalculate };

import * as DecimalOps from '../adapters/decimal-adapter.js';

/**
 * Check if value exists (not null or undefined)
 * @param {any} value
 * @returns {boolean}
 */
function exists(value) {
  return value !== null && value !== undefined;
}

/**
 * Perform calculation with native JavaScript arithmetic
 * 
 * @param {string} operator - The operator
 * @param {*} left - Left operand
 * @param {*} right - Right operand
 * @returns {*} Result
 */
function nativeCalculate(operator, left, right) {
  if (operator === "??") {
    return exists(left) ? left : right;
  }
  if (typeof left === "string" || typeof right === "string") {
    if (operator === "+") {
      left = exists(left) ? left : "";
      right = exists(right) ? right : "";
      return left + right;
    }
  } else {
    switch (operator) {
      case "^":
        return left ** right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "+":
        return left + right;
      case "-":
        return left - right;
    }
  }
  switch (operator) {
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "&&":
      return left && right;
    case "||":
      return left || right;
  }

  throw new Error(`Unsupported operator: ${operator}`);
}

/**
 * Perform calculation with Decimal precision
 *
 * @param {string} operator - The operator
 * @param {*} left - Left operand
 * @param {*} right - Right operand
 * @returns {*} Result
 */
function decimalCalculate(operator, left, right) {
  // Normalize to Decimal
  const _left = DecimalOps.normalize(left);
  const _right = DecimalOps.normalize(right);

  // Nullish coalescing - check existence on original values, return normalized
  if (operator === "??") {
    if (exists(left)) return _left;
    if (exists(right)) return _right;
    return null;  // Both null/undefined, propagate for chaining
  }

  switch (operator) {
    case "^":
      return DecimalOps.pow(_left, _right);
    case "*":
      return DecimalOps.multiply(_left, _right);
    case "/":
      return DecimalOps.divide(_left, _right);
    case "%":
      return DecimalOps.modulo(_left, _right);
    case "+":
      return DecimalOps.add(_left, _right);
    case "-":
      return DecimalOps.subtract(_left, _right);
  }

  // For comparisons, use native (returns boolean)
  switch (operator) {
    case "<":
      return _left < _right;
    case "<=":
      return _left <= _right;
    case ">":
      return _left > _right;
    case ">=":
      return _left >= _right;
    case "==":
      return _left === _right;
    case "!=":
      return _left !== _right;
  }

  // Logical operators return actual values (JavaScript-like behavior)
  switch (operator) {
    case "&&":
      return _left && _right;  // Returns right if both truthy, else left
    case "||":
      return _left || _right;  // Returns first truthy value
  }

  throw new Error(`Unsupported operator: ${operator}`);
}
