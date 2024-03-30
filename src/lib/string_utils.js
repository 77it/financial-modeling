export { isNullOrWhiteSpace, DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace };

/**
 * Check if a value is null, undefined, empty string or whitespace
 * @param {*} value
 * @returns {boolean}
 */
function isNullOrWhiteSpace (value) {
  try {
    return value === null || value === undefined || value === '' || (typeof value === 'string' && value.toString().trim() === '');
  } catch (e) {
    return false;
  }
}

/**
 * Check if a value is a string, empty or whitespace. If not a string, returns false.
 * @param {*} value
 * @returns {boolean}
 */
function DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace (value) {
  try {
    if (typeof value !== 'string')
      return false;
    return value === '' || value.toString().trim() === '';
  } catch (e) {
    return false;
  }
}
