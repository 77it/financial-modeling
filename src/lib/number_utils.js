/**
 * Number utilities for consistent number detection across the codebase.
 *
 * This module provides efficient number validation that supports:
 * - Scientific notation (1e10, 1.5e-3)
 * - Underscores as separators (1_000_000)
 * - Leading signs (+123, -456)
 * - Decimal numbers (1.23, 0.5, .5)
 *
 * Used by:
 * - json_relaxed_utils_v*_x.js (JSONX parser)
 * - formula_v2.js (formula parser)
 */

export { IS_DIGIT, isPureDecimalNumber };

/**
 * Fast lookup table for ASCII digit detection (0-9).
 * Use: `IS_DIGIT[charCode]` returns true for digits 48-57 (0-9).
 *
 * This is faster than regex `/\d/` or range checks for hot-path code.
 */
const IS_DIGIT = (() => {
  const a = new Array(128).fill(false);
  for (let c = 48; c <= 57; c++) a[c] = true; // ASCII codes for '0'-'9'
  return a;
})();

/**
 * Check if a token is a pure decimal number with optional extensions.
 *
 * Supports:
 * - Optional leading sign: `+` or `-`
 * - Underscores as separators: `1_000_000`
 * - Decimal point: `1.23`, `.5`
 * - Scientific notation: `1e10`, `1.5e-3`, `1e1_0`
 *
 * Examples of valid numbers:
 * - `123`, `-456`, `+789`
 * - `1.23`, `0.5`, `.5`
 * - `1_000_000`, `1_000.50`
 * - `1e10`, `1.5e-3`, `1e+10`, `1E-5`
 * - `1e1_0` (underscores in exponent)
 *
 * Examples of invalid:
 * - Empty string
 * - Just a sign: `+`, `-`
 * - Just a dot: `.`
 * - Hex/binary/octal: `0x123`, `0b101`, `0o777`
 * - Infinity/NaN
 *
 * @param {string} token - The string token to validate
 * @returns {boolean} - True if token is a valid pure decimal number
 */
function isPureDecimalNumber(token) {
  let j = 0;
  const len = token.length;

  if (!len) return false;

  let c = token[0];
  let code = token.charCodeAt(0);

  // Optional leading sign
  if (c === '+' || c === '-') {
    if (len === 1) return false; // Just a sign is not a number
    j = 1;
    c = token[1];
    code = token.charCodeAt(1);
  }

  // Must start with digit or decimal point
  if (!(code < 128 && IS_DIGIT[code]) && c !== '.') return false;

  let sawDigit = false;
  let sawDot = false;
  let sawE = false;

  while (j < len) {
    c = token[j];
    code = token.charCodeAt(j);

    if (code < 128 && IS_DIGIT[code]) {
      sawDigit = true;
      j++;
    }
    else if (c === '_') {
      // Underscore separator (allowed anywhere in digit sequences)
      j++;
    }
    else if (c === '.' && !sawDot && !sawE) {
      // Decimal point (only one, not in exponent)
      sawDot = true;
      j++;
    }
    else if ((c === 'e' || c === 'E') && !sawE && sawDigit) {
      // Exponent (only one, must have seen at least one digit before)
      sawE = true;
      j++;

      // Optional sign after exponent
      if (j < len && (token[j] === '+' || token[j] === '-')) {
        j++;
      }

      // Must have at least one digit in exponent
      let expDigits = false;
      while (j < len) {
        const cc = token.charCodeAt(j);
        if (cc < 128 && IS_DIGIT[cc]) {
          expDigits = true;
          j++;
        }
        else if (token[j] === '_') {
          j++;
        }
        else {
          break;
        }
      }

      if (!expDigits) return false; // Exponent without digits (e.g., "1e")
    }
    else {
      // Invalid character for number
      return false;
    }
  }

  // Must have seen at least one digit somewhere
  return sawDigit;
}
