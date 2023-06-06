export { sanitize, sanitizeObj };

import { isEmptyOrWhiteSpace } from './string_utils.js';
import { parseJsonDate, excelSerialDateToDate, excelSerialDateToUTCDate, toUTC } from './date_utils.js';
import { validate as validateFunc, validateObj as validateObjFunc } from './validation_utils.js';
import { deepFreeze } from './obj_utils.js';

//#region types
export const ANY_TYPE = 'any';
export const STRING_TYPE = 'string';  // whitespaces are trimmed only if the string is empty
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

//#region defaults
const DEFAULT__NUMBER_TO_DATE = NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE;
const DEFAULT__DATE_UTC = false;  // if true, conversion from string or number to dates return UTC dates
const DEFAULT_STRING = '';
const DEFAULT_NUMBER = 0;
const DEFAULT_DATE = new Date(0);
const DEFAULT_BIGINT = BigInt(0);

//#endregion defaults

/**
 * Sanitize value returning a sanitized value without modifying the original value.
 * Accepted sanitization types are many: see exported strings; class is 'function', class instance is 'object'.
 * BigInt is supported: 'bigint', 'bigint_number' (a BigInt that can be converted to a number), 'array[bigint]', 'array[bigint_number]'.
 * To sanitize a value with a function pass the function as sanitization type: the function will be called with the value to sanitize as parameter.
 * For optional values (null/undefined are accepted) append '?' to the type.
 * For enum sanitization use an array of values (values will be ignored, optionally validated).
 * As types, you can use also exported const as 'ANY_TYPE'.
 * Sanitization types ANY_TYPE, OBJECT_TYPE, FUNCTION_TYPE are ignored and the value is returned as is.
 * Array are sanitized without cloning them.
 * A non-array value sanitized to array becomes an array with the value added as first element.
 * String to dates are parsed as JSON to dates (in local time or UTC, depending on options.dateUTC).
 * Number to dates are considered Excel serial dates (stripping hours)
 * @param {Object} p
 * @param {*} p.value - Value to sanitize
 * @param {*} p.sanitization - Sanitization type (string, array of strings, function, array containing a function)
 * @param {Object} [p.options]
 * @param {string} [p.options.numberToDate=NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE] - one of NUMBER_TO_DATE_OPTS
 * @param {boolean} [p.options.dateUTC=false]
 * @param {*} [p.options.defaultString='']
 * @param {*} [p.options.defaultNumber=0]
 * @param {*} [p.options.defaultDate=new Date(0)]
 * @param {*} [p.options.defaultBigInt=BigInt(0)]
 * @param {boolean} [p.validate=false] - Optional validation flag
 * @return {*} Sanitized value
 */
function sanitize ({ value, sanitization, options, validate = false }) {
  if (typeof sanitization !== 'string' && !Array.isArray(sanitization) && typeof sanitization !== 'function')
    throw new Error(`'sanitization' parameter must be a string or an array`);

  if (options == null) options = {};  // sanitize options, otherwise the following code won't work
  const _NUMBER_TO_DATE = ('numberToDate' in options) ? options.numberToDate : DEFAULT__NUMBER_TO_DATE;
  validateFunc({ value: _NUMBER_TO_DATE, validation: Object.values(NUMBER_TO_DATE_OPTS) });
  /** @type {boolean} */
  const _DATE_UTC = options?.dateUTC ?? DEFAULT__DATE_UTC;
  const _DEFAULT_STRING = ('defaultString' in options) ? options.defaultString : DEFAULT_STRING;
  const _DEFAULT_NUMBER = ('defaultNumber' in options) ? options.defaultNumber : DEFAULT_NUMBER;
  const _DEFAULT_DATE = ('defaultDate' in options) ? options.defaultDate : DEFAULT_DATE;
  const _DEFAULT_BIGINT = ('defaultBigInt' in options) ? options.defaultBigInt : DEFAULT_BIGINT;

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

  // from now on sanitization can be only a string
  switch (sanitizationType.toLowerCase()) {  // switch sanitizations
    case ANY_TYPE:
      retValue = value;  // return value as is without sanitization
      break;
    case STRING_TYPE:
      try {
        if (isEmptyOrWhiteSpace(value))  // sanitize whitespace string to empty string (not to `_DEFAULT_STRING`)
          retValue = '';
        else if (typeof value === 'string')
          retValue = value;
        else if (value instanceof Date)
          retValue = toUTC(value).toISOString();
        else if ((typeof value === 'number' && isFinite(value)) || typeof value === 'bigint')
          retValue = String(value);
        else if (value === true)
          retValue = 'true';
        else if (value === false)
          retValue = 'false';
        else if (value == null || isNaN(value) || typeof value === 'object' || typeof value === 'function')
          retValue = _DEFAULT_STRING;
        else
          retValue = String(value);
      } catch (_) {
        retValue = _DEFAULT_STRING;
      }
      break;
    case NUMBER_TYPE:
      try {
        if (value == null)
          retValue = _DEFAULT_NUMBER;
        else
          retValue = isFinite(Number(value)) ? Number(value) : _DEFAULT_NUMBER;
      } catch (_) {
        retValue = _DEFAULT_NUMBER;
      }
      break;
    case BOOLEAN_TYPE:
      retValue = Boolean(value);
      break;
    case DATE_TYPE:
      try {
        if (value instanceof Date) {
          retValue = isNaN(value.getTime()) ? _DEFAULT_DATE : new Date(value);
        } else {
          let _value = value;
          if (typeof value === 'string') {  // if `value` is string, replace it with a date from a parsed string; date in local time or UTC
            _value = parseJsonDate(value, { asUTC: _DATE_UTC });
          } else if (typeof value === 'number' || typeof value === 'bigint') {  // if `value` is number or BigInt, convert it as Excel serial date to date in local time or UTC
            const _numValue = Number(value);
            if (_NUMBER_TO_DATE === NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE) {
              if (_DATE_UTC)
                _value = excelSerialDateToUTCDate(_numValue);
              else
                _value = excelSerialDateToDate(_numValue);
            } else if (_NUMBER_TO_DATE === NUMBER_TO_DATE_OPTS.JS_SERIAL_DATE)
              _value = new Date(_value);
            else  // no conversion
              _value = _DEFAULT_DATE;
          } else if (value == null) {
            _value = _DEFAULT_DATE;
          }
          retValue = isNaN(new Date(_value).getTime())
            ? _DEFAULT_DATE : new Date(_value);  // normalize `_value` (and not `value`), because also `parseJsonDate` can return a not valid date
        }
      } catch (_) {
        retValue = _DEFAULT_DATE;
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
        retValue = _DEFAULT_BIGINT;
      }
      break;
    }
    case BIGINT_NUMBER_TYPE: {
      try {
        retValue = (typeof value === 'bigint') ? value : BigInt(value);
      } catch (_) {
        retValue = _DEFAULT_BIGINT;
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
      return [sanitize({ value: array, sanitization: sanitization, options: options })];

    for (let i = 0; i < array.length; i++) {  // sanitize every element of the array
      array[i] = sanitize({ value: array[i], sanitization: sanitization, options: options });
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
 * @param {Object} [p.options]
 * @param {string} [p.options.numberToDate=NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE] - one of NUMBER_TO_DATE_OPTS
 * @param {boolean} [p.options.dateUTC=false]
 * @param {*} [p.options.defaultString='']
 * @param {*} [p.options.defaultNumber=0]
 * @param {*} [p.options.defaultDate=new Date(0)]
 * @param {*} [p.options.defaultBigInt=BigInt(0)]
 * @param {boolean} [p.validate=false] - Optional validation flag
 * @return {*} Sanitized object
 */
function sanitizeObj ({ obj, sanitization, options, validate = false }) {
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

      _obj[key] = sanitize({ value: _obj[key], sanitization: sanitization[key], options: options });
    }
    return _obj;
  }
}
