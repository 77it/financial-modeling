export { isInvalidDate } from './date_utils.js';
export { isPositive, validate, validateObj };

const ANY_TYPE = 'any';
const STRING_TYPE = 'string';
const NUMBER_TYPE = 'number';
const BOOLEAN_TYPE = 'boolean';
const DATE_TYPE = 'date';
const ARRAY_TYPE = 'array';
const OBJECT_TYPE = 'object';
const FUNCTION_TYPE = 'function';

/**
 * To check whether the number is >= 0
 *
 * @param {number} value
 * @return {Boolean}
 */
function isPositive (value) {
  return value >= 0;
}

// XXX sanitize function: se opzionale (?) e key is missing, non crearla; in ogni altro caso converti in stringa (se == null -> "", ecc).

/**
 * Private validation function of a single value
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {string} p.validation - Validation string
 * @param {string} [p.errorMsg] - Optional error message
 * @return {string}  return empty string for success; return error string for validation error.
 */
function _validateValue ({ value, validation, errorMsg }) {
  if (typeof validation !== 'string')
    throw new Error(`'validation' parameter must be a string`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  if (errorMsg == null) errorMsg = 'Value';

  let optionalValidation = false;
  let validationType = '';
  if (validation.trim().slice(-1) === '?') {
    optionalValidation = true;
    validationType = validation.toString().trim().toLowerCase().slice(0, -1);
  } else {
    validationType = validation.toString().trim().toLowerCase();
  }

  if (value === undefined && optionalValidation) {  // if value to validate is undefined and validation is optional, return success
    return '';  // success
  }

  switch (validationType) {  // switch validations
    case ANY_TYPE:
      if (value == null)
        return `${errorMsg} = ${value}, must be !== null or undefined`;
      return '';  // success
    case STRING_TYPE:
      if (typeof value !== 'string')
        return `${errorMsg} = ${value}, must be string`;
      return '';  // success
    case NUMBER_TYPE:
      if (typeof value !== 'number' || !isFinite(value))
        return `${errorMsg} = ${value}, must be a valid number`;
      return '';  // success
    case BOOLEAN_TYPE:
      if (typeof value !== 'boolean')
        return `${errorMsg} = ${value}, must be boolean`;
      return '';  // success
    case DATE_TYPE:
      if (!(value instanceof Date) || isNaN(value.getTime()))
        return `${errorMsg} = ${value}, must be a valid date`;
      return '';  // success
    case ARRAY_TYPE:
      if (!Array.isArray(value))
        return `${errorMsg} = ${value}, must be an array`;
      return '';  // success
    case OBJECT_TYPE:
      if (value == null || typeof value !== 'object')  // double check, because typeof null is object
        return `${errorMsg} = ${value}, must be an object`;
      return '';  // success
    case FUNCTION_TYPE:
      if (typeof value !== 'function')
        return `${errorMsg} = ${value}, must be a function`;
      return '';  // success
    default:
      return `${errorMsg} type is unrecognized`;
  }
}

/**
 * Validate value, throw error for validation error.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function'; class is 'function', class instance is 'object'.
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {string} p.validation - Validation string
 * @param {string} [p.errorMsg] - Optional error message
 */
// see https://github.com/iarna/aproba for inspiration
function validate ({ value, validation, errorMsg }) {
  /** @type {string[]} */
  const errors = [];

  if (typeof validation !== 'string')
    errors.push(`'validation' parameter must be a string`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    errors.push(`'errorMsg' parameter must be null/undefined or string`);

  if (errors.length === 0) {  // validate 'value' if there are no parameters error
    const validationResult = _validateValue({
      value: value,
      validation: validation,
      errorMsg: errorMsg
    });
    if (validationResult) errors.push(validationResult);
  }

  if (errors.length > 0) {
    if (errorMsg == null)  // null or undefined
      throw new Error(`Validation error.\n${JSON.stringify(errors)}`);
    else
      throw new Error(`Validation error.\n${errorMsg}\n${JSON.stringify(errors)}`);
  }
}

/**
 * Validate Object, throw error for validation error. If obj is array, the validation is done on contained objects.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function'; class is 'function', class instance is 'object'.
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.validation - Validation object {key1: 'typeA', key2: 'typeB'}
 * @param {string} [p.errorMsg] - Optional error message
 */
// see https://github.com/iarna/aproba for inspiration
function validateObj ({ obj, validation, errorMsg }) {
  /** @type {string[]} */
  const errors = [];

  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    errors.push(`'obj' parameter must be an object`);
  if (validation == null || typeof validation !== 'object')  // double check, because typeof null is object
    errors.push(`'validation' parameter must be an object`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    errors.push(`'errorMsg' parameter must be null/undefined or string`);

  if (errors.length === 0) {  // validate 'obj' if there are no parameters error
    if (Array.isArray(obj)) {
      for (const elem of obj) {
        _validateObj(elem);
      }
    } else
      _validateObj(obj);
  }

  if (errors.length > 0) {
    if (errorMsg == null)  // null or undefined
      throw new Error(`Validation error.\n${JSON.stringify(errors)}`);
    else
      throw new Error(`Validation error.\n${errorMsg}\n${JSON.stringify(errors)}`);
  }

  /**
   * Internal validation function
   * @param {*} _obj - Object to validate
   */
  function _validateObj (_obj) {
    for (const key of Object.keys(validation)) {

      const optionalValidation = (validation[key].toString().trim().slice(-1) === '?');

      if (!(key in _obj)) {  // if validation key is missing in the object to validate
        if (!optionalValidation) {  // if validation is not optional
          errors.push(`${key} is missing`);  // append validation error
        }
        continue;  // skip validation
      }

      const validationResult = _validateValue({
        value: _obj[key],
        validation: validation[key].toString(),
        errorMsg: key
      });
      if (validationResult) errors.push(validationResult);
    }
  }
}
