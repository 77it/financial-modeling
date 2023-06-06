export { isNullOrWhiteSpace, isEmptyOrWhiteSpace, caseInsensitiveCompare, toStringLowerCaseTrimCompare, ifStringLowerCaseTrim, ifStringUpperCaseTrim };

import { toUTC } from './date_utils.js';

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
function isEmptyOrWhiteSpace (value) {
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
function caseInsensitiveCompare (a, b) {
  try {
    /*
    // sensitivity = 'accent' means": Only strings that differ in base letters or accents and other diacritic marks compare as unequal. Examples: a != b, a != à, a = A.
    return typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
      : a === b;
     */
    return (a.toLowerCase() === b.toLowerCase());
  } catch (e) {
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
      _a = sanitizeValueToString(_a);
    if (typeof _b !== 'string')
      _b = sanitizeValueToString(_b);

    return (_a.toLowerCase().trim() === _b.toLowerCase().trim());
  } catch (e) {
    return false;
  }
}

/**
 * If a is string, convert it to lowercase and trim before compare with b.
 * @param {*} value
 * @returns {*}
 */
function ifStringLowerCaseTrim (value) {
  try {
    if (typeof value === 'string')
      return value.toLowerCase().trim();
    else
      return value;
  } catch (e) {
    return value;
  }
}

/**
 * If a is string, convert it to uppercase and trim before compare with b.
 * @param {*} value
 * @returns {*}
 */
function ifStringUpperCaseTrim (value) {
  try {
    if (typeof value === 'string')
      return value.toUpperCase().trim();
    else
      return value;
  } catch (e) {
    return value;
  }
}

//#region internal functions, not exported
/** Function to sanitize a value to a string.
 * @param {*} value
 * @returns {string}
 */
function sanitizeValueToString (value) {
  let retValue;
  const _DEFAULT_STRING = '';
  try {
    if (isEmptyOrWhiteSpace(value))  // sanitize whitespace string to empty string (not to `_DEFAULT_STRING`)
      retValue = '';
    else if (typeof value === 'string')
      retValue = value;
    else if (value instanceof Date)
      retValue = toUTC(value).toISOString();
    else if ((typeof value === 'number' && isFinite(value)) || typeof value === 'bigint')
      retValue = String(value);
    else if (value === true)
      retValue = 'true';
    else if (value === false)
      retValue = 'false';
    else if (value == null || isNaN(value) || typeof value === 'object' || typeof value === 'function')
      retValue = _DEFAULT_STRING;
    else
      retValue = String(value);
  } catch (_) {
    retValue = _DEFAULT_STRING;
  }
  return retValue;
}

//#endregion internal functions, not exported