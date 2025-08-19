export { validate };

import { DISABLE_VALIDATION } from '../config/engine.js';
import * as schema from './schema.js';
import { ValidateSanitizeResult } from './validate_sanitize_result.js';

const ALLOWS_OBJECTS_IN_ARRAY_FLAG = false;  // hardcoded option, by now objects contained in array are considered an error if the validation expects an object
const SUCCESS = '';
// Used only if `validation` is an object; optional, default false; if true check that there are no extra keys other than validation keys in the validated object.
// set only during init
let STRICT = false;
// Used only if `validation` is a string; optional, default false; if true validation fails with empty and whitespace strings.
// set only during init
let REQUIRE_NON_EMPTY_STRINGS = false;

/**
 * Validate input Value and return it to allow chaining.
 * If validation fails, throw an error.
 *
 * If `validation` parameter is an object, validate as described in "Object Validation"
 * otherwise validate as described in "Value Validation".
 *
 * # Value Validation
 * Validate value, throw error for validation error.
 * Accepted validation types are many: see exported strings; class is 'function', class instance is 'object'.
 * BigInt is supported: 'bigint', 'bigint_number' (a BigInt that can be converted to a number), 'array[bigint]', 'array[bigint_number]'.
 * For optional values (null/undefined are accepted) append '?' to the type.
 * To validate a value applying a function, pass a function returning in an instance of class `ValidateSanitizeResult` the validation result and the sanitized value.
 * As types value you can use also exported const as 'ANY_TYPE'.
 *
 * # Array validation (enum ecc)
 * If validation is an array:
 *   if is an array containing a single object '[{obj}]', the validation will expect an array containing that object;
 *   if is an array containing a single function '[func]', the validation will expect an array containing a value validated by the function;
 *   in any other case the array will be considered an enum, ignored during sanitization, optionally validated.
 *
 * # Object Validation
 * Validate Object, throw error for validation error. If obj is array instead of an object, throw. To validate an array containing an object use '[{obj}]'.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function', 'symbol'; class is 'function', class instance is 'object'.
 * For optional parameters (null/undefined are accepted) use 'any?', 'string?', 'number?', 'boolean?', 'date?', 'array?', 'object?', 'function?', 'symbol?'.
 * As types, you can use also exported const as 'ANY_TYPE'.
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {*} p.validation - Validation type (string, array of strings, validation function, array containing a validation function)
 * @param {string} [p.errorMsg] - Optional error message
 * @param {boolean} [p.strict = false] - Used only if `validation` is an object; optional, default false; if true check that there are no extra keys other than validation keys in the validated object.
 * @param {boolean} [p.requireNonEmptyStrings = false] - Used only if `validation` is a string; optional, default false; if true validation fails with empty and whitespace strings.
 * @return {*} Validated value, to allow function chaining
 * @throws {Error} Will throw an error if the validation fails
 */
// see https://github.com/iarna/aproba for inspiration
function validate ({ value, validation, errorMsg, strict = false, requireNonEmptyStrings = false }) {
  if (DISABLE_VALIDATION)
    return value;

  if (validation == null)
    throw new Error(`'validation' parameter can't be null or undefined`);

  if (typeof validation !== 'string' && typeof validation !== 'object' && !Array.isArray(validation) && typeof validation !== 'function')
    throw new Error(`'validation' parameter must be a string, an object, an array or a function`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  STRICT = strict;
  REQUIRE_NON_EMPTY_STRINGS = requireNonEmptyStrings;

  const validationResult = _validationDispatcher({
    value: value,
    validation: validation,
    errorMsg: errorMsg
  });

  if (validationResult)
    throw new Error(`Validation error: ${validationResult}`);

  return value;
}

/**
 @private
 * Dispatch validations between value and object
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {*} p.validation - Validation type (string, array of strings, validation function, array containing a validation function)
 * @param {string} [p.errorMsg] - Optional error message
 * @return {string} Return empty string for success; return error string for validation error.
 */
function _validationDispatcher ({ value, validation, errorMsg}) {
  // if `validation` is an object & not an array, validate the object with `_validateObj()`
  //
  // else, validate the object with `_validateValue()`
  if (typeof validation === 'object' && !Array.isArray(validation)) {
    return _validateObj({
      obj: value,
      validation: validation,
      allowsObjectsInArray: ALLOWS_OBJECTS_IN_ARRAY_FLAG,
      errorMsg: errorMsg
    });
  } else {
    return _validateValue({
      value: value,
      validation: validation,
      errorMsg: errorMsg
    });
  }
}

/**
 @private
 * validation function of a single value
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {*} p.validation - Validation type (string, array of strings, validation function, array containing a validation function)
 * @param {string} [p.errorMsg] - Optional error message
 * @return {string} Return empty string for success; return error string for validation error.
 */
function _validateValue ({ value, validation, errorMsg }) {
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  if (errorMsg == null) errorMsg = 'Value';

  if (Array.isArray(validation)) {
    // if array is long 1 && validation[0] is an object, use it to do the validation
    if (validation.length === 1 && typeof validation[0] === 'object') {
      const validationResult = _validateArray({ array: value, validation: validation[0] });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;

      return SUCCESS;
      // if array is long 1 && validation[0] is a function (a Class or a Functions), use it to do the validation
    } else if (validation.length === 1 && typeof validation[0] === 'function') {
      const validationResult = _validateArray({ array: value, validation: validation[0] });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;

      return SUCCESS;
    }

    // if validation is not a function validate as enum array
    if (validation.includes(value))
      return SUCCESS;

    return `${errorMsg} = ${value}, must be one of ${validation}`;
  } else if (typeof validation === 'function') {
    // if validation is a function call it and read the validation result stored in the `ValidateSanitizeResult` type
    /** @type {ValidateSanitizeResult} */
    const validationResult = validation(value);
    if (!(validationResult instanceof ValidateSanitizeResult))
      throw new Error('validation function must return a `ValidateSanitizeResult` object');

    if (validationResult.isValid)
      return SUCCESS;
    else
      return `${errorMsg} = ${value}, ${validationResult.validationErrors}`;
  } else if (typeof validation === 'string') {
    let optionalValidation = false;
    let validationType = validation.toString().trim().toLowerCase();
    if (validation.trim().slice(-schema.OPTIONAL.length) === schema.OPTIONAL) {
      optionalValidation = true;
      validationType = validation.toString().trim().toLowerCase().slice(0, -schema.OPTIONAL.length);
    }

    if (value == null && optionalValidation) {  // if value to validate is null/undefined and validation is optional, return success
      return SUCCESS;
    }

    switch (validationType.toLowerCase()) {  // switch validations
      case schema.ANY_TYPE: {
        if (value == null)
          return `${errorMsg} = ${value}, must be !== null or undefined`;
        return SUCCESS;
      }
      case schema.STRING_TYPE: {
        if (typeof value !== 'string')
          return `${errorMsg} = ${value}, must be string`;
        if (REQUIRE_NON_EMPTY_STRINGS && value.trim() === '')
          return `${errorMsg} = ${value}, must be a non-empty string`;
        return SUCCESS;
      }
      case schema.STRINGLOWERCASETRIMMED_TYPE: {
        if (typeof value !== 'string')
          return `${errorMsg} = ${value}, must be a lowercase trimmed string`;
        else if (REQUIRE_NON_EMPTY_STRINGS && value.trim() === '')
          return `${errorMsg} = ${value}, must be a non-empty string`;
        else if (value.toLowerCase().trim() !== value)
          return `${errorMsg} = ${value}, must be a lowercase trimmed string`;
        return SUCCESS;
      }
      case schema.STRINGUPPERCASETRIMMED_TYPE: {
        if (typeof value !== 'string')
          return `${errorMsg} = ${value}, must be an uppercase trimmed string`;
        else if (REQUIRE_NON_EMPTY_STRINGS && value.trim() === '')
          return `${errorMsg} = ${value}, must be a non-empty string`;
        else if (value.toUpperCase().trim() !== value)
          return `${errorMsg} = ${value}, must be an uppercase trimmed string`;
        return SUCCESS;
      }
      case schema.NUMBER_TYPE: {
        if (typeof value !== 'number' || !isFinite(value))
          return `${errorMsg} = ${value}, must be a valid number`;
        return SUCCESS;
      }
      case schema.BOOLEAN_TYPE: {
        if (typeof value !== 'boolean')
          return `${errorMsg} = ${value}, must be boolean`;
        return SUCCESS;
      }
      case schema.DATE_TYPE: {
        if (!(value instanceof Date) || isNaN(value.getTime()))
          return `${errorMsg} = ${value}, must be a valid date`;
        return SUCCESS;
      }
      case schema.ARRAY_TYPE: {
        if (!Array.isArray(value))
          return `${errorMsg} = ${value}, must be an array`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_STRINGS_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.STRING_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.STRINGLOWERCASETRIMMED_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.STRINGUPPERCASETRIMMED_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_NUMBERS_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.NUMBER_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_BOOLEANS_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.BOOLEAN_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_DATES_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.DATE_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_OBJECTS_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.OBJECT_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.OBJECT_TYPE:
        if (value == null || typeof value !== 'object')  // double check, because typeof null is object
          return `${errorMsg} = ${value}, must be an object`;
        return SUCCESS;
      case schema.FUNCTION_TYPE:
        if (typeof value !== 'function')
          return `${errorMsg} = ${value}, must be a function`;
        return SUCCESS;
      case schema.SYMBOL_TYPE:
        if (typeof value !== 'symbol')
          return `${errorMsg} = ${value}, must be a symbol`;
        return SUCCESS;
      case schema.BIGINT_TYPE:
        if (!(typeof value === 'bigint'))
          return `${errorMsg} = ${value}, must be an instance of BigInt`;
        return SUCCESS;
      case schema.BIGINT_NUMBER_TYPE:
        if (!(typeof value === 'bigint'))
          return `${errorMsg} = ${value}, must be an instance of BigInt`;
        if (value.toString() !== Number(value).toString())
          return `${errorMsg} = ${value}, is BigInt but the value is too big to be safely converted to a number`;
        return SUCCESS;
      case schema.ARRAY_OF_BIGINT_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.BIGINT_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      case schema.ARRAY_OF_BIGINT_NUMBER_TYPE: {
        const validationResult = _validateArray({ array: value, validation: schema.BIGINT_NUMBER_TYPE });
        if (validationResult)
          return `${errorMsg} array error, ${validationResult}`;
        return SUCCESS;
      }
      default:
        return `${errorMsg} type is unrecognized`;
    }
  } else
    throw new Error(`'validation' parameter must be a string, an array or a function`);

  /**
   * Internal validation function
   * @param {Object} p
   * @param {[*]} p.array - Array to validate
   * @param {string|function} p.validation - Validation string or function
   */
  function _validateArray ({ array, validation }) {
    /** @type {string[]} */
    const errors = [];

    if (!Array.isArray(array))
      return `must be an array`;

    for (const elem of array) {
      const validationResult = _validationDispatcher({  // because validation can be also an object
        value: elem,
        validation: validation
      });
      if (validationResult) errors.push(validationResult);
    }
    if (errors.length > 0)
      return (JSON.stringify(errors));
    return SUCCESS;
  }
}

/**
 @private
 * Validate Object, throw error for validation error. If obj is array instead of an object, throw. To validate an array containing an object use '[{obj}]'.
  * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function', 'symbol'; class is 'function', class instance is 'object'.
  * For optional parameters (null/undefined are accepted) use 'any?', 'string?', 'number?', 'boolean?', 'date?', 'array?', 'object?', 'function?', 'symbol?'.
  * As types, you can use also exported const as 'ANY_TYPE'.
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.validation - Validation object {key1: 'string', key2: 'number?'}
 * @param {boolean} p.allowsObjectsInArray - Flag to allow objects in array; if false, the object to validate can't be contained in an array
 * @param {string} [p.errorMsg] - Optional error message
 * @return {string} Return empty string for success; return error string for validation error.
 */
// see https://github.com/iarna/aproba for inspiration
function _validateObj ({ obj, validation, errorMsg, allowsObjectsInArray }) {
  if (DISABLE_VALIDATION)
    return SUCCESS;

  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    return `'obj' parameter must be an object`;
  if (validation == null || typeof validation !== 'object')  // double check, because typeof null is object
    return `'validation' parameter must be an object`;
  if (errorMsg != null && typeof errorMsg !== 'string')
    return `'errorMsg' parameter must be null/undefined or string`;

  /** @type {string[]} */
  const errors = [];

  if (!allowsObjectsInArray && Array.isArray(obj)) {
    errors.push(`${JSON.stringify((obj))} is an array and not an object`);
  }
  else if (Array.isArray(obj)) {
    for (const elem of obj) {
      _validateObj2(elem);
    }
  } else
    _validateObj2(obj);

  if (errors.length > 0){
    if (errorMsg == null)  // null or undefined
      return `${JSON.stringify(errors)}`;
    else
      return `${errorMsg}: ${JSON.stringify(errors)}`;
  }

  return SUCCESS;

  /**
   * Internal validation function
   * @param {*} _obj - Object to validate
   */
  function _validateObj2 (_obj) {
    // if `strict` flag is true, check that there are no extra keys other than validation keys in the validated object
    if (STRICT)
      for (const key2 of Object.keys(_obj))
        if (!(key2 in validation))
          errors.push(`${key2} is not a valid key, is missing from validation object`);

    for (const key of Object.keys(validation)) {
      // Array of enum or array with function to be used as validation
      if (Array.isArray(validation[key])) {
        const validationResult = _validateValue({
          value: _obj[key],
          validation: validation[key],
          errorMsg: key
        });
        if (validationResult) errors.push(validationResult);
      } else {
        const optionalValidation =
          (typeof validation[key] === 'string') &&
          (validation[key].toString().trim().slice(-schema.OPTIONAL.length) === schema.OPTIONAL);

        if (!(key in _obj)) {  // if validation key is missing in the object to validate
          if (!optionalValidation) {  // if validation is not optional
            errors.push(`${key} is missing`);  // append validation error
          }
          continue;  // skip validation
        }

        const validationResult = _validationDispatcher({
          value: _obj[key],
          validation: validation[key],
          errorMsg: key
        });
        if (validationResult) errors.push(validationResult);
      }
    }
  }
}
