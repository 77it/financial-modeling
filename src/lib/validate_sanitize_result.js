export { ValidateSanitizeResult };

import { sanitize } from './schema_sanitization_utils.js';
import { isNullOrWhiteSpace } from './string_utils.js';
import * as schema from './schema.js';

class ValidateSanitizeResult {
  /** @type {boolean} */
  isValid;
  /** @type {*} */
  sanitizedValue;
  /** @type {undefined|string} */
  validationErrors;

  /**
   * @param {{isValid: boolean, value?: *, validationErrors?: string}} p
   * param can be {{isValid: true, value?: *} | {isValid:false, validationErrors: string, value?: *}}
   */
  constructor ({ isValid, value, validationErrors }) {
    const _validationErrors = sanitize({value: validationErrors, sanitization: schema.STRING_TYPE})
    const _isValid = sanitize({value: isValid, sanitization: schema.BOOLEAN_TYPE})

    if (_isValid && !isNullOrWhiteSpace(_validationErrors)) {
      throw new Error("isValid can't be true and validationErrors have a value");
    }
    if (!_isValid && isNullOrWhiteSpace(_validationErrors)) {
      throw new Error("isValid can't be false and validationErrors have no value");
    }
    this.isValid = _isValid;
    this.validationErrors = _validationErrors;
    this.sanitizedValue = value;
  }
}
