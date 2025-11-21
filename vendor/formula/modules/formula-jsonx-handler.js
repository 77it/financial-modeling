/**
 * Formula JSONX Handler Module (handles text in JSON-like format)
 *
 * Handles JSONX parsing and formula evaluation within JSONX structures
 * Extracted from core formula.js to keep it clean and focused
 */

export { isPlainObject, isDateLikeString, isLikelyFormula, createJSONXFormula, evaluateStringFormula };

import { parseJSONX } from '../adapters/jsonx-parser-adapter.js';
import { regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping } from '../../../src/lib/date_utils.js';

// formula regex patterns
const formulaLikeRx = /[!\^\*\/%\+\-<>=&\|\?\(\)]|\w\s*\(/;

// Special markers for unquoted formula values in JSONX
// ASCII 31 (hidden character) + '#' (visible marker)
const FORMULA_MARKER_HIDDEN = String.fromCharCode(31);  // ASCII 31
const FORMULA_MARKER_VISIBLE = '#';
const FORMULA_MARKER = FORMULA_MARKER_HIDDEN + FORMULA_MARKER_VISIBLE;  // Combined marker

/**
 * Check if value is a plain object
 * @param {any} v
 * @returns {boolean}
 */
function isPlainObject(v) {
  return v !== null && typeof v === "object" &&
    (v.constructor === Object || Object.getPrototypeOf(v) === Object.prototype);
}

/**
 * Check if string looks like a date
 * @param {any} s
 * @returns {boolean}
 */
function isDateLikeString(s) {
  return typeof s === "string" && regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test(s);
}

/**
 * Check if string looks like a formula
 * @param {any} s
 * @returns {boolean}
 */
function isLikelyFormula(s) {
  if (typeof s !== "string") return false;

  // Don't treat date-like strings as formulas
  if (isDateLikeString(s)) return false;

  return formulaLikeRx.test(s);
}


/**
 * Create a JSONX formula evaluator
 *
 * @param {string} text - JSONX text to parse
 * @param {object} Parser - The Parser class
 * @param {object} settings - Parser settings
 * @returns {Function} Function that evaluates the JSONX with a context
 */
function createJSONXFormula(text, Parser, settings) {
  let parsed;
  try {
    parsed = parseJSONX(text);
  } catch (err) {
    throw new Error(`Invalid JSONX segment: ${err instanceof Error ? err.message : String(err)}`);
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
      // Check if this was an unquoted formula (marked with special characters)
      if (value.startsWith(FORMULA_MARKER)) {
        // Remove the marker and try to evaluate as formula
        const unmarked = value.slice(FORMULA_MARKER.length);
        const result = evaluateStringFormula(unmarked, Parser, settings, context);
        // If evaluation succeeded (didn't return original string), return result
        // If it failed, return the unmarked string without markers
        return result === unmarked ? unmarked : result;
      }

      // Check if it's a date-like string first, return as is
      if (isDateLikeString(value)) {
        return value;
      }
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
function evaluateStringFormula(str, Parser, settings, context) {
  try {
    const parser = new Parser(str, settings);
    return parser.evaluate(context);
  } catch {
    return str;
  }
}
