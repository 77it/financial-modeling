export { isNullOrWhiteSpace, isEmptyOrWhiteSpace, toStringLowerCaseTrim };
import { sanitize } from './sanitization_utils.js';
import { STRINGLOWERCASETRIMMED_TYPE } from './schema.js';

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

/**
 * Convert a value of any type to string, lowercase and trimmed.
 * @param {*} value
 * @returns {string}
 */
function toStringLowerCaseTrim (value) {
  try {
    return sanitize({ value: value, sanitization: STRINGLOWERCASETRIMMED_TYPE });
  } catch (e) {
    return '';
  }
}
