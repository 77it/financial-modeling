export { isNullOrWhiteSpace, BOOLEAN_TRUE_STRING, BOOLEAN_FALSE_STRING };

const BOOLEAN_TRUE_STRING = 'true';
const BOOLEAN_FALSE_STRING = 'false';

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
