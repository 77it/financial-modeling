/**
 * Formula Arithmetic Module
 * 
 * Handles arithmetic calculations with optional Decimal precision
 * Extracted from core formula.js to enable swappable arithmetic backends
 */

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
  return null;
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
  // For non-numeric operations, use native
  if (operator === "??") {
    return exists(left) ? left : right;
  }
  if (typeof left === "string" || typeof right === "string") {
    if (operator === "+") {
      left = exists(left) ? left : "";
      right = exists(right) ? right : "";
      return left + right;
    }
  }
  
  // For numeric operations, use Decimal adapter
  if (typeof left === "number" && typeof right === "number") {
    switch (operator) {
      case "^":
        return DecimalOps.pow(left, right);
      case "*":
        return DecimalOps.multiply(left, right);
      case "/":
        return DecimalOps.divide(left, right);
      case "%":
        return DecimalOps.modulo(left, right);
      case "+":
        return DecimalOps.add(left, right);
      case "-":
        return DecimalOps.subtract(left, right);
    }
  }
  
  // For comparisons and logical operators, use native
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
  return null;
}

/**
 * Calculate operation result
 * 
 * @param {string} operator - The operator
 * @param {*} left - Left operand
 * @param {*} right - Right operand
 * @param {boolean} useDecimal - Whether to use Decimal precision
 * @returns {*} Result
 */
export function calculate(operator, left, right, useDecimal = false) {
  if (useDecimal) {
    return decimalCalculate(operator, left, right);
  }
  return nativeCalculate(operator, left, right);
}
