import { DISABLE_VALIDATION } from '../config/engine.js';

export { validate, validateObj };

import * as schema from './schema.js';

const SUCCESS = '';

/**
 * Validate value, throw error for validation error.
 * Accepted validation types are many: see exported strings; class is 'function', class instance is 'object'.
 * BigInt is supported: 'bigint', 'bigint_number' (a BigInt that can be converted to a number), 'array[bigint]', 'array[bigint_number]'.
 * For optional values (null/undefined are accepted) append '?' to the type.
 * For enum validation use an array of values.
 * To validate a value applying a function, pass a static class containing the methods .sanitize() and .validate()
 *   the validation function will be called as class.validate() with the value to validate as parameter;
 *   the validation function throws an error if the validation fails
 * As types value you can use also exported const as 'ANY_TYPE'.
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {*} p.validation - Validation type (string, array of strings, class or function, array containing a class or function)
 * @param {string} [p.errorMsg] - Optional error message
 * @return {*} Validated value
 * @throws {Error} Will throw an error if the validation fails
 */
// see https://github.com/iarna/aproba for inspiration
function validate ({ value, validation, errorMsg }) {
  if (DISABLE_VALIDATION)
    return value;

  if (typeof validation !== 'string' && !Array.isArray(validation) && typeof validation !== 'function')
    throw new Error(`'validation' parameter must be a string, an array or a function`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  const validationResult = _validateValue({
    value: value,
    validation: validation,
    errorMsg: errorMsg
  });

  if (validationResult)
    throw new Error(`Validation error: ${validationResult}`);

  return value;
}

/**
 * Validate Object, throw error for validation error. If obj is array, the validation is done on contained objects.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function', 'symbol'; class is 'function', class instance is 'object'.
 * For optional parameters (null/undefined are accepted) use 'any?', 'string?', 'number?', 'boolean?', 'date?', 'array?', 'object?', 'function?', 'symbol?'.
 * As types, you can use also exported const as 'ANY_TYPE'.
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.validation - Validation object {key1: 'string', key2: 'number?'}
 * @param {string} [p.errorMsg] - Optional error message
 * @param {boolean} [p.strict = false] - Optional strict flag, default false; if true check that there are no extra keys other than validation keys in the validated object.
 * @return {*} Validated value
 * @throws {Error} Will throw an error if the validation fails
 */
// see https://github.com/iarna/aproba for inspiration
function validateObj ({ obj, validation, errorMsg, strict = false }) {
  if (DISABLE_VALIDATION)
    return obj;

  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    throw new Error(`'obj' parameter must be an object`);
  if (validation == null || typeof validation !== 'object')  // double check, because typeof null is object
    throw new Error(`'validation' parameter must be an object`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  const validationResult = _validateObj({
    obj: obj,
    validation: validation,
    strict: strict
  });

  if (validationResult) {
    if (errorMsg == null)  // null or undefined
      throw new Error(`Validation error: ${validationResult}`);
    else
      throw new Error(`${errorMsg}: ${validationResult}`);
  }

  return obj;
}

/**
 @private
 * validation function of a single value
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {*} p.validation - Validation type (string, array of strings, class or function, array containing a class or function)
 * @param {string} [p.errorMsg] - Optional error message
 * @return {string} Return empty string for success; return error string for validation error.
 */
function _validateValue ({ value, validation, errorMsg }) {
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  if (errorMsg == null) errorMsg = 'Value';

  if (Array.isArray(validation)) {
    // Class or Functions are of type 'function'
    if (typeof validation[0] === 'function') {
      const validationResult = _validateArray({ array: value, validation: validation[0] });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;

      return SUCCESS;
    }
    // if validation is not a function
    if (validation.includes(value))
      return SUCCESS;

    return `${errorMsg} = ${value}, must be one of ${validation}`;
  } else if (typeof validation === 'function') {
    // if validation is a class apply the .validate() method, that will throw an error if the validation fails
    try {
      //@ts-ignore
      validation.validate(value);
      return SUCCESS;
    } catch (error) {
      if ((error instanceof Error)) {
        // if it goes in error, returns the error message or a default message if empty
        if (error.message.trim() === "")
          return `${errorMsg} = ${value}, validation error`;
        else
          return `${errorMsg} = ${value}, ${error.message}`;
      }
      else
        return `${errorMsg} = ${value}, validation error`;
    }
  } else if (typeof validation === 'string') {
    let optionalValidation = false;
    let validationType = validation.toString().trim().toLowerCase();
    if (validation.trim().slice(-1) === '?') {
      optionalValidation = true;
      validationType = validation.toString().trim().toLowerCase().slice(0, -1);
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
        return SUCCESS;
      }
      case schema.STRINGLOWERCASETRIMMED_TYPE: {
        if (typeof value !== 'string')
          return `${errorMsg} = ${value}, must be a lowercase trimmed string`;
        else if (value.toLowerCase().trim() !== value)
          return `${errorMsg} = ${value}, must be a lowercase trimmed string`;
        return SUCCESS;
      }
      case schema.STRINGUPPERCASETRIMMED_TYPE: {
        if (typeof value !== 'string')
          return `${errorMsg} = ${value}, must be an uppercase trimmed string`;
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
      const validationResult = _validateValue({
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
 * validation function of an object
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.validation - Validation object {key1: 'typeA', key2: 'typeB'}
 * @param {boolean} [p.strict] - Strict flag; if true check that there are no extra keys other than validation keys in the validated object.
 * @return {string} Return empty string for success; return error string for validation error.
 */
function _validateObj ({ obj, validation, strict }) {
  /** @type {string[]} */
  const errors = [];

  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    throw new Error(`'obj' parameter must be an object`);
  if (validation == null || typeof validation !== 'object')  // double check, because typeof null is object
    throw new Error(`'validation' parameter must be an object`);

  if (Array.isArray(obj)) {
    for (const elem of obj) {
      _validateObj2(elem);
    }
  } else
    _validateObj2(obj);

  if (errors.length > 0)
    return (JSON.stringify(errors));

  return SUCCESS;

  /**
   * Internal validation function
   * @param {*} _obj - Object to validate
   */
  function _validateObj2 (_obj) {
    // if `strict` flag is true, check that there are no extra keys other than validation keys in the validated object
    if (strict)
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
          (validation[key].toString().trim().slice(-1) === '?');

        if (!(key in _obj)) {  // if validation key is missing in the object to validate
          if (!optionalValidation) {  // if validation is not optional
            errors.push(`${key} is missing`);  // append validation error
          }
          continue;  // skip validation
        }

        const validationResult = _validateValue({
          value: _obj[key],
          validation: validation[key],
          errorMsg: key
        });

        if (validationResult) errors.push(validationResult);
      }
    }
  }
}
