export { isStringOrBooleanTrue, isStringOrBooleanFalse };

import * as schema from './schema.js';
import { sanitize } from './sanitization_utils.js';

// the following values can be used to compare the result of sanitization of boolean values (or string containing 'true' or 'false') to string
const BOOLEAN_TRUE_STRING = 'true';
const BOOLEAN_FALSE_STRING = 'false';

/**
 * Check if a value is true: boolean are checked as is, other types are sanitized to strings, converted to lowercase and trimmed before compare
 * @param {*} value
 * @returns {boolean}
 */
function isStringOrBooleanTrue (value) {
  try {
    // if value is boolean, return it
    if (typeof value === 'boolean')
      return value;
    // if value is not boolean, sanitize it to string, convert to lowercase and trim before compare
    return (sanitize({ value: value, sanitization: schema.STRINGLOWERCASETRIMMED_TYPE }) === BOOLEAN_TRUE_STRING);
  } catch (e) {
    return false;
  }
}

/**
 * Check if a value is false: boolean are checked as is, other types are sanitized to strings, converted to lowercase and trimmed before compare
 * @param {*} value
 * @returns {boolean}
 */
function isStringOrBooleanFalse (value) {
  try {
    // if value is boolean, return it
    if (typeof value === 'boolean')
      return !value;
    // if value is not boolean, sanitize it to string, convert to lowercase and trim before compare
    return (sanitize({ value: value, sanitization: schema.STRINGLOWERCASETRIMMED_TYPE }) === BOOLEAN_FALSE_STRING);
  } catch (e) {
    return false;
  }
}
