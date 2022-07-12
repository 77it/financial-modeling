/**
 * To check whether the date is valid
 * @param {*} value
 * @returns {Boolean}
 */
export function isInvalidDate (value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {  // it is a date
    return isNaN(value.getTime());
  }
  return true;  // is not a date
}

/**
 * To check whether the number is >= 0
 *
 * @param {number} value
 * @return {Boolean}
 */
export function isPositive (value) {
  return value >= 0;
}
