  export { isNullOrWhiteSpace };

/**
 * Check if a value is null, undefined, empty string or whitespace
 * @param {*} value
 * @returns {boolean}
 */
function isNullOrWhiteSpace (value) {
  return value === null || value === undefined || value === '' || value.toString().trim() === '';
}
