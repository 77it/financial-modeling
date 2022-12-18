export { sanitize, sanitizeObj };
import { parseJSON, excelSerialDateToUTCDate } from './date_utils.js';

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
export const OBJECT_TYPE = 'object';
export const FUNCTION_TYPE = 'function';
export const SYMBOL_TYPE = 'symbol';
//#endregion types

//#region settings
export const OPTIONS = {};
OPTIONS.NUMBER_TO_DATE_OPTS = {}
OPTIONS.NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE = 'NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE';
OPTIONS.NUMBER_TO_DATE_OPTS.JS_SERIAL_DATE = 'NUMBER_TO_DATE__JS_SERIAL_DATE';
OPTIONS.NUMBER_TO_DATE_OPTS.NO_CONVERSION = 'NUMBER_TO_DATE__NO_CONVERSION';
OPTIONS.NUMBER_TO_DATE = OPTIONS.NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE;
//#endregion settings

/**
 * Sanitize value.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function', 'symbol'; class is 'function', class instance is 'object'.
 * For optional values (null/undefined are accepted) use 'any?', 'string?', 'number?', 'boolean?', 'date?', 'array?', 'object?', 'function?', 'symbol'.
 * As types you can use also exported const as 'ANY_TYPE'.
 * Any, object, function, class are ignored and returned as is.
 * Array are sanitized without cloning them.
 * A non-array value sanitized to array becomes an array with the value added as first element.
 * String to dates are parsed as JSON to UTC dates
 * Number to dates are considered Excel serial dates (stripping hours, in UTC)
 * @param {Object} p
 * @param {*} p.value - Value to sanitize
 * @param {string} p.sanitization - Sanitization string
 * @return {*} Sanitized value
 */
function sanitize ({ value, sanitization }) {
  if (typeof sanitization !== 'string')
    throw new Error(`'sanitization' parameter must be a string`);

  let optionalSanitization = false;
  let sanitizationType = sanitization.toString().trim().toLowerCase();
  if (sanitization.trim().slice(-1) === '?') {
    optionalSanitization = true;
    sanitizationType = sanitization.toString().
      trim().
      toLowerCase().
      slice(0, -1);
  }

  if (value == null && optionalSanitization) {  // if value to validate is null/undefined and validation is optional, return value without sanitization
    return value;
  }

  switch (sanitizationType.toLowerCase()) {  // switch sanitizations
    case ANY_TYPE:
      return value;  // return value as is without sanitization
    case STRING_TYPE:
      try {
        if (value instanceof Date)
          return value.toISOString();
        else if (typeof value === 'number' && isFinite(value))
          return String(value);
        else
          // Set to '' when whitespaces, '', null, undefined, false, 0, -0, 0n, NaN.
          // First condition to check truthy (not: false, 0, -0, 0n, "", null, undefined, and NaN)
          // Second condition to check for whitespaces.
          return !!(value && value.toString().trim()) ? String(value) : '';
      } catch (_) {
        return '';
      }
    case NUMBER_TYPE:
      try {
        return isFinite(Number(value)) ? Number(value) : 0;
      } catch (_) {
        return 0;
      }
    case BOOLEAN_TYPE:
      return Boolean(value);
    case DATE_TYPE:
      try {
        let _value = value;
        if (typeof value === 'string')  // if `value` is string, replace it with a UTC date from a parsed string
          _value = parseJSON(value);
        else if (typeof value === 'number')  // if `value` is number, convert it as Excel serial date
        {
          if (OPTIONS.NUMBER_TO_DATE === OPTIONS.NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE)
            _value = excelSerialDateToUTCDate(value);
          else if (OPTIONS.NUMBER_TO_DATE === OPTIONS.NUMBER_TO_DATE_OPTS.JS_SERIAL_DATE)
            _value = new Date(value);
          else
            _value = new Date(0);
        }
        return isNaN(new Date(_value).getTime())
          ? new Date(0) : new Date(_value);  // normalize `_value` (and not `value`), because also `parseJSON` can return a not valid date
      } catch (_) {
        return new Date(0);
      }
    case ARRAY_TYPE:
      if (!Array.isArray(value))  // if `value` is not an array return a new array with `value` as first element
        return [value];
      return value;
    case ARRAY_OF_STRINGS_TYPE: {
      return _sanitizeArray({ array: value, sanitization: STRING_TYPE });
    }
    case ARRAY_OF_NUMBERS_TYPE: {
      return _sanitizeArray({ array: value, sanitization: NUMBER_TYPE });
    }
    case ARRAY_OF_BOOLEANS_TYPE: {
      return _sanitizeArray({ array: value, sanitization: BOOLEAN_TYPE });
    }
    case ARRAY_OF_DATES_TYPE: {
      return _sanitizeArray({ array: value, sanitization: DATE_TYPE });
    }
    case OBJECT_TYPE:
      return value;  // return value as is without sanitization
    case FUNCTION_TYPE:
      return value;  // return value as is without sanitization
    case SYMBOL_TYPE:
      return value;  // return value as is without sanitization
    default:
      throw new Error(
        `sanitization error, ${sanitizationType} type is unrecognized`);
  }

  /**
   * Internal sanitization function
   * @param {Object} p
   * @param {[*]} p.array - Array to sanitize
   * @param {string} p.sanitization - Sanitization string
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
 * Sanitize Object.
 * If obj is array, the sanitization is done on contained objects.
 * If obj is null/undefined or other non-objects returns empty object {}.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function', 'symbol'; class is 'function', class instance is 'object'.
 * For optional parameters (null/undefined are accepted) use 'any?', 'string?', 'number?', 'boolean?', 'date?', 'array?', 'object?', 'function?', 'symbol?'.
 * As types you can use also exported const as 'ANY_TYPE'.
 * Any, object, function, class are ignored and returned as is.
 * Array are sanitized without cloning them.
 * A non-array value sanitized to array becomes an array with the value added as first element.
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.sanitization - Sanitization object {key1: 'string', key2: 'number?'}
 * @return {*} Sanitized object
 */
function sanitizeObj ({ obj, sanitization }) {
  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    return {};  // return an empty object if `obj` is not an object
  if (sanitization == null || typeof sanitization !== 'object')  // double check, because typeof null is object
    return obj;

  if (Array.isArray(obj)) {
    for (const elem of obj) {
      for (let i = 0; i < obj.length; i++) {  // sanitize every element of the array
        obj[i] = _sanitizeObj2(obj[i]);
      }
    }
  } else
    return _sanitizeObj2(obj);

  /**
   * Internal validation function
   * @param {*} _obj - Object to validate
   * @return {*} Sanitized object
   */
  function _sanitizeObj2 (_obj) {
    for (const key of Object.keys(sanitization)) {

      const optionalSanitization = (sanitization[key].toString().trim().slice(-1) === '?');

      // if validation key is missing in the object to validate and the validation is optional, skip validation
      if (!(key in _obj) && optionalSanitization)
        continue;

      _obj[key] = sanitize({ value: _obj[key], sanitization: sanitization[key] });
    }
    return _obj;
  }
}
