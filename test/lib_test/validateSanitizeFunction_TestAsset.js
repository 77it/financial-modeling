import { ValidateSanitizeResult } from '../../src/lib/validate_sanitize_result.js';

/**
 * TEMP METHOD USED DURING TESTS
 *
 * Method to sanitize an input value: if number or string, add 10;
 * if not number after conversion return input value.
 * If of different type, return input
 * @param {*} input - The value to be sanitized
 * @returns {ValidateSanitizeResult} - The validation result/sanitized value
 */
export function validateSanitizeFunction_TestAsset (input) {
  let validationErrors = '';
  let validationResult = true;
  let sanitizedValue;

  if (typeof input !== 'number') {
    validationErrors = 'is not a number';
    validationResult = false;
  }

  if (typeof input !== 'string' && typeof input !== 'number') {
    sanitizedValue = input; // Return input unchanged if it's not a string or number
  } else {
    const num = Number(input);
    if (isNaN(num)) {
      sanitizedValue = input;
    } else {
      sanitizedValue = num + 10;
    }
  }

  return new ValidateSanitizeResult({ isValid: validationResult, value: sanitizedValue, validationErrors: validationErrors });
}
