export { isNullOrWhiteSpace, isEmptyOrWhiteSpace, lowerCaseCompare, toStringLowerCaseTrimCompare };

import * as sanitization from './sanitization_utils.js';

/**
 * Check if a value is null, undefined, empty string or whitespace
 * @param {*} value
 * @returns {boolean}
 */
function isNullOrWhiteSpace (value) {
  try {
    return value === null || value === undefined || value === '' || value.toString().trim() === '';
  } catch (e) {
    return false;
  }
}

/**
 * Check if a value is empty string or whitespace
 * @param {*} value
 * @returns {boolean}
 */
function isEmptyOrWhiteSpace  (value) {
  try {
    if (typeof value !== 'string')
      return false;
    return value === '' || value.toString().trim() === '';
  } catch (e) {
    return false;
  }
}

// from https://stackoverflow.com/a/2140723
// see also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
// and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#options
/**
 * Compare two strings, ignoring case. .localeCompare() is circa 20 times slower than === & toLowerCase()  // tested om Deno, 2023-04-14
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function lowerCaseCompare (a, b) {
  try {
    /*
    // sensitivity = 'accent' means": Only strings that differ in base letters or accents and other diacritic marks compare as unequal. Examples: a != b, a != à, a = A.
    return typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
      : a === b;
     */
    return (a.toLowerCase() === b.toLowerCase());
  }
  catch (e) {
    return false;
  }
}

/**
 * Compare two values of any kind; if not string, convert them to string; then lowercase and trim before compare.
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
function toStringLowerCaseTrimCompare (a, b) {
  try {
    let _a = a;
    let _b = b;
    if (typeof _a !== 'string')
      _a = sanitization.sanitize({ value: _a, sanitization: sanitization.STRING_TYPE });
    if (typeof _b !== 'string')
      _b = sanitization.sanitize({ value: _b, sanitization: sanitization.STRING_TYPE });

    return (_a.toLowerCase().trim() === _b.toLowerCase().trim());
  }
  catch (e) {
    return false;
  }
}
