/**
 * A class to sanitize and validate
 */
export class SanitizationValidationClass {
  /**
   * Method to sanitize an input value: if number or string, add 10;
   * if not number after conversion return input value.
   * If of different type, return input
   * @param {*} input - The value to be sanitized
   * @returns {*} - The sanitized value
   */
  static sanitize(input) {
    if (typeof input !== 'string' && typeof input !== 'number') {
      return input; // Return input unchanged if it's not a string or number
    }
    const num = Number(input);
    if (isNaN(num)) {
      return input;
    }
    return num + 10;
  }

  /**
   * Method to validate an input value
   *
   * @param {*} input - The value to be validated
   * @returns {void} - If valid (number), returns void
   * @throws {Error} If of different type (not number), returns error message
   */
  static validate(input) {
    if (typeof input !== 'number')
      throw new Error('is not a number');
  }
}
