export { sanitize, sanitizeObj, resetOptions };

import { parseJSON, excelSerialDateToDate, excelSerialDateToUTCDate } from './date_utils.js';
import { validate as validateFunc, validateObj as validateObjFunc } from './validation_utils.js';
import { deepFreeze } from './obj_utils.js';

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
export const BIGINT_TYPE = 'bigint';
export const BIGINT_NUMBER_TYPE = 'bigint_number';
export const ARRAY_OF_BIGINT_TYPE = 'array[bigint]';
export const ARRAY_OF_BIGINT_NUMBER_TYPE = 'array[bigint_number]';
export const OPTIONAL = '?';
//#endregion types

export const NUMBER_TO_DATE_OPTS = {
  EXCEL_1900_SERIAL_DATE: 'NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE',
  JS_SERIAL_DATE: 'NUMBER_TO_DATE__JS_SERIAL_DATE',
  NO_CONVERSION: 'NUMBER_TO_DATE__NO_CONVERSION'
};
deepFreeze(NUMBER_TO_DATE_OPTS);

//#region module options
export const OPTIONS = {};
OPTIONS.NUMBER_TO_DATE = NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE;
OPTIONS.DATE_UTC = false;  // if true, dates are converted to UTC

//#endregion module options

/** Reset module options to default values */
function resetOptions () {
  OPTIONS.NUMBER_TO_DATE = NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE;
  OPTIONS.DATE_UTC = false;
}

/**
 * Sanitize value returning a sanitized value without modifying the original value.
 * Accepted sanitization types are many: see exported strings; class is 'function', class instance is 'object'.
 * BigInt is supported: 'bigint', 'bigint_number' (a BigInt that can be converted to a number), 'array[bigint]', 'array[bigint_number]'.
 * To sanitize a value to an instance of a class or a function pass the class or function as sanitization: the function/class will be called with the value to sanitize as parameter.
 * For optional values (null/undefined are accepted) append '?' to the type.
 * For enum sanitization use an array of values (values will be ignored, optionally validated).
 * As types you can use also exported const as 'ANY_TYPE'.
 * Any, object, function, class are ignored and returned as is.
 * Array are sanitized without cloning them.
 * A non-array value sanitized to array becomes an array with the value added as first element.
 * String to dates are parsed as JSON to dates (in local time or UTC, depending on OPTIONS.DATE_UTC).
 * Number to dates are considered Excel serial dates (stripping hours)
 * @param {Object} p
 * @param {*} p.value - Value to sanitize
 * @param {*} p.sanitization - Sanitization type (string, array of strings, class or function, array containing a class or function)
 * @param {boolean} [p.validate=false] - Optional validation flag
 * @return {*} Sanitized value
 */
function sanitize ({ value, sanitization, validate = false }) {
  if (typeof sanitization !== 'string' && !Array.isArray(sanitization) && typeof sanitization !== 'function')
    throw new Error(`'sanitization' parameter must be a string or an array`);

  if (Array.isArray(sanitization)) {
    let _value = value;

    // if sanitization[0] is a function, use it to sanitize the array
    if (typeof sanitization[0] === 'function')
      _value = _sanitizeArray({ array: _value, sanitization: sanitization[0] });

    if (validate)
      return validateFunc({ value: _value, validation: sanitization });
    else
      return _value;
  } else if (typeof sanitization === 'function') {
    let _value;
    try {
      //@ts-ignore
      _value = sanitization(value);
    } catch (_) {
      _value = value;
    }
    if (validate)
      return validateFunc({ value: _value, validation: sanitization });
    else
      return _value;
  }

  let optionalSanitization = false;
  let sanitizationType = sanitization.toString().trim().toLowerCase();
  if (sanitization.trim().slice(-1) === '?') {  // set optional sanitization flag
    optionalSanitization = true;
    sanitizationType = sanitization.toString().trim().toLowerCase().slice(0, -1);
  }

  if (value == null && optionalSanitization) {  // if value to sanitize is null/undefined and sanitization is optional, return value without sanitization
    return value;
  }

  let retValue;

  switch (sanitizationType.toLowerCase()) {  // switch sanitizations
    case ANY_TYPE:
      retValue = value;  // return value as is without sanitization
      break;
    case STRING_TYPE:
      try {
        if (value instanceof Date)
          retValue = value.toISOString();
        else if (typeof value === 'number' && isFinite(value))
          retValue = String(value);
        else if (value === true)
          retValue = 'true';
        else if (value === false)
          retValue = 'false';
        else
          // Set to '' when whitespaces, '', null, undefined, false, 0, -0, 0n, NaN.
          // First condition to check truthy (not: false, 0, -0, 0n, "", null, undefined, and NaN)
          // Second condition to check for whitespaces.
          retValue = (value && value.toString().trim()) ? String(value) : '';
      } catch (_) {
        retValue = '';
      }
      break;
    case NUMBER_TYPE:
      try {
        retValue = isFinite(Number(value)) ? Number(value) : 0;
      } catch (_) {
        retValue = 0;
      }
      break;
    case BOOLEAN_TYPE:
      retValue = Boolean(value);
      break;
    case DATE_TYPE:
      try {
        let _value = value;
        if (typeof value === 'string')  // if `value` is string, replace it with a date from a parsed string; date in local time or UTC
          _value = parseJSON(value, { asUTC: OPTIONS.DATE_UTC });
        else if (typeof value === 'number')  // if `value` is number, convert it as Excel serial date to date in local time or UTC
        {
          if (OPTIONS.NUMBER_TO_DATE === NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE) {
            if (OPTIONS.DATE_UTC)
              _value = excelSerialDateToUTCDate(value);
            else
              _value = excelSerialDateToDate(value);
          } else if (OPTIONS.NUMBER_TO_DATE === NUMBER_TO_DATE_OPTS.JS_SERIAL_DATE)
            _value = new Date(value);
          else
            _value = new Date(0);
        }
        retValue = isNaN(new Date(_value).getTime())
          ? new Date(0) : new Date(_value);  // normalize `_value` (and not `value`), because also `parseJSON` can return a not valid date
      } catch (_) {
        retValue = new Date(0);
      }
      break;
    case ARRAY_TYPE:
      if (!Array.isArray(value))  // if `value` is not an array return a new array with `value` as first element
        retValue = [value];
      else
        retValue = value;
      break;
    case ARRAY_OF_STRINGS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: STRING_TYPE });
      break;
    }
    case ARRAY_OF_NUMBERS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: NUMBER_TYPE });
      break;
    }
    case ARRAY_OF_BOOLEANS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: BOOLEAN_TYPE });
      break;
    }
    case ARRAY_OF_DATES_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: DATE_TYPE });
      break;
    }
    case ARRAY_OF_OBJECTS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: OBJECT_TYPE });
      break;
    }
    case OBJECT_TYPE: {
      retValue = value;  // return value as is without sanitization
      break;
    }
    case FUNCTION_TYPE: {
      retValue = value;  // return value as is without sanitization
      break;
    }
    case SYMBOL_TYPE: {
      retValue = value;  // return value as is without sanitization
      break;
    }
    case BIGINT_TYPE: {
      try {
        retValue = (typeof value === 'bigint') ? value : BigInt(value);
      } catch (_) {
        retValue = BigInt(0);
      }
      break;
    }
    case BIGINT_NUMBER_TYPE: {
      try {
        retValue = (typeof value === 'bigint') ? value : BigInt(value);
      } catch (_) {
        retValue = BigInt(0);
      }
      break;
    }
    case ARRAY_OF_BIGINT_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: BIGINT_TYPE });
      break;
    }
    case ARRAY_OF_BIGINT_NUMBER_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: BIGINT_NUMBER_TYPE });
      break;
    }
    default:
      throw new Error(
        `sanitization error, ${sanitizationType} type is unrecognized`);
  }

  if (validate)
    return validateFunc({ value: retValue, validation: sanitization });
  else
    return retValue;

  /**
   * Internal sanitization function
   * @param {Object} p
   * @param {[*]} p.array - Array to sanitize
   * @param {string|function} p.sanitization - Sanitization string or function
   * @return {*} Sanitized array
   */
  function _sanitizeArray ({ array, sanitization }) {
    if (!Array.isArray(array))  // if `value` is not an array return a new array with `value` as first element
      return [sanitize({ value: array, sanitization: sanitization })];

    for (let i = 0; i < array.length; i++) {  // sanitize every element of the array
      array[i] = sanitize({ value: array[i], sanitization: sanitization });
    }

    return array;
  }
}

/**
 * Sanitize Object, modifying it in place and returning the same object to allow chaining.
 * If obj is array, the sanitization is done on contained objects.
 * If obj is null/undefined or other non-objects returns empty object {}.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function', 'symbol'; class is 'function', class instance is 'object'.
 * For optional parameters (null/undefined are accepted) use 'any?', 'string?', 'number?', 'boolean?', 'date?', 'array?', 'object?', 'function?', 'symbol?'.
 * For enum sanitization use an array of values (values will be ignored, optionally validated).
 * As types you can use also exported const as 'ANY_TYPE'.
 * Any, object, function, class are ignored and returned as is.
 * Array are sanitized without cloning them.
 * A non-array value sanitized to array becomes an array with the value added as first element.
 * @param {Object} p
 * @param {*} p.obj - Object to sanitize
 * @param {*} p.sanitization - Sanitization object {key1: 'string', key2: 'number?'}
 * @param {boolean} [p.validate=false] - Optional validation flag
 * @return {*} Sanitized object
 */
function sanitizeObj ({ obj, sanitization, validate = false }) {
  let retValue;

  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    retValue = {};  // return an empty object if `obj` is not an object
  else if (sanitization == null || typeof sanitization !== 'object')  // double check, because typeof null is object
    retValue = obj;
  else if (Array.isArray(obj)) {
    for (const elem of obj) {
      for (let i = 0; i < obj.length; i++) {  // sanitize every element of the array
        obj[i] = _sanitizeObj2(obj[i]);
      }
    }
    retValue = obj;
  } else
    retValue = _sanitizeObj2(obj);

  if (validate)
    return validateObjFunc({ obj: retValue, validation: sanitization });
  else
    return retValue;

  /**
   * Local sanitization function
   * @param {*} _obj - Object to sanitize
   * @return {*} Sanitized object
   */
  function _sanitizeObj2 (_obj) {
    for (const key of Object.keys(sanitization)) {
      // skip enum sanitization
      if (Array.isArray(sanitization[key]) && typeof sanitization[key][0] !== 'function')
        continue;

      // if sanitization key is missing in the object to sanitize and the sanitization is optional, skip sanitization
      const optionalSanitization =
        (typeof sanitization[key] === 'string') &&
        (sanitization[key].toString().trim().slice(-1) === '?');
      if (!(key in _obj) && optionalSanitization)
        continue;

      _obj[key] = sanitize({ value: _obj[key], sanitization: sanitization[key] });
    }
    return _obj;
  }
}
