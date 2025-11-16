/**
 * Formula YAML Handler Module
 * 
 * Handles YAML parsing and formula evaluation within YAML structures
 * Extracted from core formula.js to keep it clean and focused
 */

import { parseData } from '../adapters/jsonx-parser-adapter.js';

/**
 * Check if value is a plain object
 * @param {any} v
 * @returns {boolean}
 */
export function isPlainObject(v) {
  return v !== null && typeof v === "object" &&
    (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);
}

/**
 * Check if string looks like a formula
 * @param {any} s
 * @returns {boolean}
 */
export function isLikelyFormula(s) {
  // Simple heuristic: contains formula-like characters or function calls
  const formulaLikeRx = /[!\^\*\/%\+\-<>=&\|\?\(\)]|\w\s*\(/;
  return typeof s === "string" && formulaLikeRx.test(s);
}

/**
 * Create a YAML formula evaluator
 *
 * @param {string} text - YAML text to parse
 * @param {object} Parser - The Parser class
 * @param {object} settings - Parser settings
 * @returns {Function} Function that evaluates the YAML with a context
 */
export function createYamlFormula(text, Parser, settings) {
  let parsed;
  try {
    parsed = parseData(text);
  } catch (err) {
    throw new Error(`Invalid YAML segment: ${err instanceof Error ? err.message : String(err)}`);
  }

    /**
   * Recursively walk through values and evaluate formulas
   * @param {any} value - The value to process
   * @param {Record<string, any>} context - The evaluation context
   * @returns {any} The processed value with formulas evaluated
   */
  const walkValue = (value, context) => {
    if (value == null) return value;

    const valueType = typeof value;
    if (valueType === "string") {
      // Check if it's a formula and evaluate it
      if (isLikelyFormula(value)) {
        return evaluateStringFormula(value, Parser, settings, context);
      }
      // Check if it's a valid identifier that could be a variable reference
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        return context && context[value] !== undefined ? context[value] : null;
      }
      return value;
    }

    if (Array.isArray(value)) {
      const result = new Array(value.length);
      for (let i = 0; i < value.length; i++) {
        result[i] = walkValue(value[i], context);
      }
      return result;
    }

    if (isPlainObject(value)) {
      const result = /** @type {Record<string, any>} */ ({});
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = walkValue(value[key], context);
        }
      }
      return result;
    }

    return value;
  };

  return (/** @type {Record<string, any>} */ context) => walkValue(parsed, context);
}

/**
 * Evaluate a string as a formula
 *
 * @param {string} str - Formula string
 * @param {*} Parser - The Parser class
 * @param {object} settings - Parser settings
 * @param {object} context - Evaluation context
 * @returns {any} Result or original string if parsing fails
 */
export function evaluateStringFormula(str, Parser, settings, context) {
  try {
    const parser = new Parser(str, settings);
    return parser.evaluate(context);
  } catch {
    return str;
  }
}
