export { Result };

import { sanitize } from './schema_sanitization_utils.js';
import { isNullOrWhiteSpace } from './string_utils.js';
import * as schema from './schema.js';

class Result {
  /** @type {boolean} */
  success;
  /** @type {*} */
  value;
  /** @type {undefined|string} */
  error;

  /**
   * @param {{success: boolean, value?: *, error?: string}} p
   * param can be {{success: true, value?: *} | {success:false, error: string, value?: *}}
   */
  constructor ({ success, value, error }) {
    const _error = sanitize({value: error, sanitization: schema.STRING_TYPE})
    const _success = sanitize({value: success, sanitization: schema.BOOLEAN_TYPE})

    if (_success && !isNullOrWhiteSpace(_error)) {
      throw new Error("success can't be true and error have a value");
    }
    if (!_success && isNullOrWhiteSpace(_error)) {
      throw new Error("success can't be false and error have no value");
    }
    this.success = _success;
    this.error = _error;
    this.value = value;
  }
}
