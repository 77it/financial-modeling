/**
 * Formula YAML Handler Module
 * 
 * Handles YAML parsing and formula evaluation within YAML structures
 * Extracted from core formula.js to keep it clean and focused
 */

import { parseJSONX } from '../adapters/jsonx-parser-adapter.js';
import { regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping } from '../../../src/lib/date_utils.js';

// formula regex patterns
const formulaLikeRx = /[!\^\*\/%\+\-<>=&\|\?\(\)]|\w\s*\(/;

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
 * Check if string looks like a date
 * @param {any} s
 * @returns {boolean}
 */
export function isDateLikeString(s) {
  return typeof s === "string" && regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test(s);
}

/**
 * Check if string looks like a formula
 * @param {any} s
 * @returns {boolean}
 */
export function isLikelyFormula(s) {
  if (typeof s !== "string") return false;

  // Don't treat date-like strings as formulas
  if (isDateLikeString(s)) return false;

  return formulaLikeRx.test(s);
}

/**
 * Parse a date string into a Date object
 * @param {string} dateStr
 * @returns {Date|string} Date object or original string if not a valid date format
 */
export function parseDate(dateStr) {
  // Handle different date formats: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const match = dateStr.match(/^(\d{4})([-\/\.])(\d{1,2})\2(\d{1,2})([ T](\d{2}):(\d{2})(:(\d{2})(\.\d{1,6})?)?(Z|[+\-]\d{2}:\d{2})?)?$/);
  if (!match) return dateStr; // Return as string if not a valid date format

  const [, year, , month, day, , hour, minute, , second, millisecond] = match;

  // JavaScript Date constructor expects 0-indexed months
  const jsMonth = parseInt(month, 10) - 1;
  const jsYear = parseInt(year, 10);
  const jsDay = parseInt(day, 10);
  const jsHour = hour ? parseInt(hour, 10) : 0;
  const jsMinute = minute ? parseInt(minute, 10) : 0;
  const jsSecond = second ? parseInt(second, 10) : 0;
  const jsMillisecond = millisecond ? Math.floor(parseFloat('0' + millisecond) * 1000) : 0;

  // Create date in local time to match test expectations
  return new Date(jsYear, jsMonth, jsDay, jsHour, jsMinute, jsSecond, jsMillisecond);
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
    parsed = parseJSONX(text);
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
      // Check if it's a date-like string first
      if (isDateLikeString(value)) {
        return parseDate(value);
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
export function evaluateStringFormula(str, Parser, settings, context) {
  try {
    const parser = new Parser(str, settings);
    return parser.evaluate(context);
  } catch {
    return str;
  }
}
