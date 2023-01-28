export { validate, validateObj };

//#region types
export const ANY_TYPE = 'any';
export const STRING_TYPE = 'string';
export const NUMBER_TYPE = 'number';
export const BOOLEAN_TYPE = 'boolean';
export const DATE_TYPE = 'date';
export const ARRAY_TYPE = 'array';
export const ARRAY_OF_STRINGS_TYPE = 'array[string]';
export const ARRAY_OF_NUMBERS_TYPE = 'array[number]';
export const ARRAY_OF_BOOLEANS_TYPE = 'array[boolean]';
export const ARRAY_OF_DATES_TYPE = 'array[date]';
export const ARRAY_OF_OBJECTS_TYPE = 'array[object]';
export const OBJECT_TYPE = 'object';
export const FUNCTION_TYPE = 'function';
export const SYMBOL_TYPE = 'symbol';
//#endregion types

const SUCCESS = '';


/**
 * Validate value, throw error for validation error.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function', 'symbol'; class is 'function', class instance is 'object'.
 * For optional values (null/undefined are accepted) use 'any?', 'string?', 'number?', 'boolean?', 'date?', 'array?', 'object?', 'function?', 'symbol?'.
 * As types you can use also exported const as 'ANY_TYPE'.
 * @param {Object} p
 * @param {*} p.value - Value to validate
 * @param {string} p.validation - Validation type
 * @param {string} [p.errorMsg] - Optional error message
 * @return {*} Validated value
 * @throws Will throw an error if the validation fails
 */
// see https://github.com/iarna/aproba for inspiration
function validate ({ value, validation, errorMsg }) {
  if (typeof validation !== 'string')
    throw new Error(`'validation' parameter must be a string`);
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
 * @return {*} Validated value
 * @throws Will throw an error if the validation fails
 */
// see https://github.com/iarna/aproba for inspiration
function validateObj ({ obj, validation, errorMsg }) {
  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    throw new Error(`'obj' parameter must be an object`);
  if (validation == null || typeof validation !== 'object')  // double check, because typeof null is object
    throw new Error(`'validation' parameter must be an object`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  const validationResult = _validateObj({
    obj: obj,
    validation: validation
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
 * @param {string} p.validation - Validation string
 * @param {string} [p.errorMsg] - Optional error message
 * @return {string} Return empty string for success; return error string for validation error.
 */
function _validateValue ({ value, validation, errorMsg }) {
  if (typeof validation !== 'string')
    throw new Error(`'validation' parameter must be a string`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    throw new Error(`'errorMsg' parameter must be null/undefined or string`);

  if (errorMsg == null) errorMsg = 'Value';

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
    case ANY_TYPE:
      if (value == null)
        return `${errorMsg} = ${value}, must be !== null or undefined`;
      return SUCCESS;
    case STRING_TYPE:
      if (typeof value !== 'string')
        return `${errorMsg} = ${value}, must be string`;
      return SUCCESS;
    case NUMBER_TYPE:
      if (typeof value !== 'number' || !isFinite(value))
        return `${errorMsg} = ${value}, must be a valid number`;
      return SUCCESS;
    case BOOLEAN_TYPE:
      if (typeof value !== 'boolean')
        return `${errorMsg} = ${value}, must be boolean`;
      return SUCCESS;
    case DATE_TYPE:
      if (!(value instanceof Date) || isNaN(value.getTime()))
        return `${errorMsg} = ${value}, must be a valid date`;
      return SUCCESS;
    case ARRAY_TYPE:
      if (!Array.isArray(value))
        return `${errorMsg} = ${value}, must be an array`;
      return SUCCESS;
    case ARRAY_OF_STRINGS_TYPE: {
      const validationResult = _validateArray({ array: value, validation: STRING_TYPE });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;
      return SUCCESS;
    }
    case ARRAY_OF_NUMBERS_TYPE: {
      const validationResult = _validateArray({ array: value, validation: NUMBER_TYPE });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;
      return SUCCESS;
    }
    case ARRAY_OF_BOOLEANS_TYPE: {
      const validationResult = _validateArray({ array: value, validation: BOOLEAN_TYPE });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;
      return SUCCESS;
    }
    case ARRAY_OF_DATES_TYPE: {
      const validationResult = _validateArray({ array: value, validation: DATE_TYPE });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;
      return SUCCESS;
    }
    case ARRAY_OF_OBJECTS_TYPE: {
      const validationResult = _validateArray({ array: value, validation: OBJECT_TYPE });
      if (validationResult)
        return `${errorMsg} array error, ${validationResult}`;
      return SUCCESS;
    }
    case OBJECT_TYPE:
      if (value == null || typeof value !== 'object')  // double check, because typeof null is object
        return `${errorMsg} = ${value}, must be an object`;
      return SUCCESS;
    case FUNCTION_TYPE:
      if (typeof value !== 'function')
        return `${errorMsg} = ${value}, must be a function`;
      return SUCCESS;
    case SYMBOL_TYPE:
      if (typeof value !== 'symbol')
        return `${errorMsg} = ${value}, must be a symbol`;
      return SUCCESS;
    default:
      return `${errorMsg} type is unrecognized`;
  }

  /**
   * Internal validation function
   * @param {Object} p
   * @param {[*]} p.array - Array to validate
   * @param {string} p.validation - Validation string
   */
  function _validateArray ({ array, validation}) {
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
 * @return {string} Return empty string for success; return error string for validation error.
 */
function _validateObj ({ obj, validation }) {
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
