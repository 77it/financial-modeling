export { sanitize, sanitizeObj };

import * as schema from './schema.js';
import { parseJsonToLocalDate, parseJsonToUTCDate, excelSerialDateToLocalDate, excelSerialDateToUTCDate, toUTC } from './date_utils.js';
import { validate as validateFunc, validateObj as validateObjFunc } from './schema_validation_utils.js';
import { eq2, get2 } from './obj_utils.js';

//#region defaults
const DEFAULT__NUMBER_TO_DATE = schema.NUMBER_TO_DATE_OPTS__EXCEL_1900_SERIAL_DATE;
// if true, conversion from string or number to dates return UTC dates;
// if true, conversion from dates assumes that dates are in UTC time.
const DEFAULT__DATE_UTC = false;
const DEFAULT_STRING = '';
const DEFAULT_NUMBER = 0;
const DEFAULT_DATE = new Date(0);
const DEFAULT_BIGINT = BigInt(0);

//#endregion defaults

/**
 * Sanitize value returning a sanitized value without modifying the original value.
 * Accepted sanitization types are many: see `schema.js`; class is 'function', class instance is 'object';
 * BigInt is supported: 'bigint', 'bigint_number' (a BigInt that can be converted to a number), 'array[bigint]', 'array[bigint_number]'.
 * To sanitize a value with a function pass the function as sanitization type: the function will be called with the value to sanitize as parameter.
 * For optional values (null/undefined are accepted) append '?' to the type.
 * For enum sanitization use an array of values (values will be ignored, optionally validated).
 * Sanitization types ANY_TYPE, OBJECT_TYPE, FUNCTION_TYPE are ignored and the value is returned as is.
 * Array are sanitized without cloning them.
 * A non-array value sanitized to array becomes an array with the value added as first element.
 * ANY_TYPE, OBJECT_TYPE, FUNCTION_TYPE, SYMBOL_TYPE are ignored and returned as is.
 * With `STRING_TYPE` whitespaces are trimmed if the string is empty.
 * String to dates are parsed as JSON to dates (in local time or UTC, depending on options.dateUTC).
 * Number to dates are considered by default Excel serial dates (stripping hours); can be changed with options.
 * @param {Object} p
 * @param {*} p.value - Value to sanitize
 * @param {*} p.sanitization - Sanitization type (string, array of strings, function, array containing a function)
 * @param {Object} [p.options]
 * @param {string} [p.options.numberToDate=schema.NUMBER_TO_DATE_OPTS__EXCEL_1900_SERIAL_DATE] - one of NUMBER_TO_DATE_OPTS
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
    throw new Error(`'sanitization' parameter must be a string, an array or a function`);

  if (options == null) options = {};  // sanitize options, otherwise the following code won't work
  const _NUMBER_TO_DATE = ('numberToDate' in options) ? options.numberToDate : DEFAULT__NUMBER_TO_DATE;
  validateFunc({ value: _NUMBER_TO_DATE, validation: [schema.NUMBER_TO_DATE_OPTS__EXCEL_1900_SERIAL_DATE, schema.NUMBER_TO_DATE_OPTS__JS_SERIAL_DATE, schema.NUMBER_TO_DATE_OPTS__NO_CONVERSION] });
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
    case schema.ANY_TYPE: {
      retValue = value;  // return value as is without sanitization
      break;
    }
    case schema.STRING_TYPE: {
      try {
        if (_isEmptyOrWhiteSpace(value))  // sanitize whitespace string to empty string (not to `_DEFAULT_STRING`)
          retValue = '';
        else if (typeof value === 'string')
          retValue = value;
        else if (value instanceof Date)
          if (_DATE_UTC) {
            retValue = value.toISOString();  // if `_DATE_UTC` is true, the date is presumed to be UTC then is not needed to convert it to UTC before converting the date to string
          } else {
            retValue = toUTC(value).toISOString();
          }
        else if ((typeof value === 'number' && isFinite(value)) || typeof value === 'bigint')
          retValue = String(value);
        else if (value === true)
          retValue = 'true';
        else if (value === false)
          retValue = 'false';
        else if (Array.isArray(value))
          retValue = String(value);
        else if (isNaN(value) || typeof value === 'object' || typeof value === 'function')
          retValue = _DEFAULT_STRING;
        else
          retValue = String(value);

        if (retValue == null)  // last check before returning a value
          retValue = _DEFAULT_STRING;
      } catch (_) {
        retValue = _DEFAULT_STRING;
      }
      break;
    }
    case schema.STRINGLOWERCASETRIMMED_TYPE: {
      retValue = sanitize({ value: value, sanitization: schema.STRING_TYPE, options: options }).toLowerCase().trim();
      break;
    }
    case schema.STRINGUPPERCASETRIMMED_TYPE: {
      retValue = sanitize({ value: value, sanitization: schema.STRING_TYPE, options: options }).toUpperCase().trim();
      break;
    }
    case schema.NUMBER_TYPE: {
      try {
        if (value == null)
          retValue = _DEFAULT_NUMBER;
        else
          retValue = isFinite(Number(value)) ? Number(value) : _DEFAULT_NUMBER;
      } catch (_) {
        retValue = _DEFAULT_NUMBER;
      }
      break;
    }
    case schema.BOOLEAN_TYPE: {
      if (typeof value === 'string') {
        const _value = value.trim().toLowerCase();
        if (_value === 'false' || _value === '') {
          retValue = false;
          break;
        }
      }
      retValue = Boolean(value);
      break;
    }
    case schema.DATE_TYPE: {
      try {
        if (value instanceof Date) {
          retValue = isNaN(value.getTime()) ? _DEFAULT_DATE : new Date(value);
        } else {
          let _value = value;
          if (typeof value === 'string') {  // if `value` is string, replace it with a date from a parsed string; date in local time or UTC
            if (_DATE_UTC)
              _value = parseJsonToUTCDate(value);
            else
              _value = parseJsonToLocalDate(value);
          } else if (typeof value === 'number' || typeof value === 'bigint') {  // if `value` is number or BigInt, convert it as Excel serial date to date in local time or UTC
            const _numValue = Number(value);
            if (_NUMBER_TO_DATE === schema.NUMBER_TO_DATE_OPTS__EXCEL_1900_SERIAL_DATE) {
              if (_DATE_UTC)
                _value = excelSerialDateToUTCDate(_numValue);
              else
                _value = excelSerialDateToLocalDate(_numValue);
            } else if (_NUMBER_TO_DATE === schema.NUMBER_TO_DATE_OPTS__JS_SERIAL_DATE)
              _value = new Date(_value);
            else  // no conversion
              _value = _DEFAULT_DATE;
          } else if (value == null) {
            _value = _DEFAULT_DATE;
          }
          retValue = isNaN(new Date(_value).getTime())
            ? _DEFAULT_DATE : new Date(_value);  // normalize `_value` (and not `value`), because also `parseJsonToLocalDate`|`parseJsonToUTCDate` can return a not valid date
        }
      } catch (_) {
        retValue = _DEFAULT_DATE;
      }
      break;
    }
    case schema.ARRAY_TYPE: {
      if (!Array.isArray(value))  // if `value` is not an array return a new array with `value` as first element
        retValue = [value];
      else
        retValue = value;
      break;
    }
    case schema.ARRAY_OF_STRINGS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.STRING_TYPE });
      break;
    }
    case schema.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.STRINGLOWERCASETRIMMED_TYPE });
      break;
    }
    case schema.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.STRINGUPPERCASETRIMMED_TYPE });
      break;
    }
    case schema.ARRAY_OF_NUMBERS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.NUMBER_TYPE });
      break;
    }
    case schema.ARRAY_OF_BOOLEANS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.BOOLEAN_TYPE });
      break;
    }
    case schema.ARRAY_OF_DATES_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.DATE_TYPE });
      break;
    }
    case schema.ARRAY_OF_OBJECTS_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.OBJECT_TYPE });
      break;
    }
    case schema.OBJECT_TYPE: {
      retValue = value;  // return value as is without sanitization
      break;
    }
    case schema.FUNCTION_TYPE: {
      retValue = value;  // return value as is without sanitization
      break;
    }
    case schema.SYMBOL_TYPE: {
      retValue = value;  // return value as is without sanitization
      break;
    }
    case schema.BIGINT_TYPE: {
      try {
        retValue = (typeof value === 'bigint') ? value : BigInt(value);
      } catch (_) {
        retValue = _DEFAULT_BIGINT;
      }
      break;
    }
    case schema.BIGINT_NUMBER_TYPE: {
      try {
        retValue = (typeof value === 'bigint') ? value : BigInt(value);
      } catch (_) {
        retValue = _DEFAULT_BIGINT;
      }
      break;
    }
    case schema.ARRAY_OF_BIGINT_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.BIGINT_TYPE });
      break;
    }
    case schema.ARRAY_OF_BIGINT_NUMBER_TYPE: {
      retValue = _sanitizeArray({ array: value, sanitization: schema.BIGINT_NUMBER_TYPE });
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

  //#region local functions
  /**
   * Local sanitization function
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

  /**
   * Local function to check if a value is empty string or whitespace
   * @param {*} value
   * @returns {boolean}
   */
  function _isEmptyOrWhiteSpace (value) {
    try {
      if (typeof value !== 'string')
        return false;
      return value === '' || value.toString().trim() === '';
    } catch (e) {
      return false;
    }
  }

  //#endregion local functions
}

/**
 * Sanitize Object, modifying it in place and returning the same object to allow chaining.
 * If obj is array, the sanitization is done on contained objects;
 * array are sanitized without cloning them.
 * If obj is null/undefined or other non-objects returns empty object {}.
 * Sanitization is an object with keys corresponding to the keys of the object to sanitize and values corresponding to the sanitization types;
 * accepted types are many: see `schema.js`; class is 'function', class instance is 'object';
 * for optional parameters (null/undefined are accepted) append '?' to type, e.g. 'any?', 'string?', 'number?', etc.
 * If sanitization is an array, skip the sanitization because it is an enum that can't be applied to an object.
 * For enum sanitization use an array of values (values will be ignored, optionally validated).
 * Object keys missing from the sanitization object are ignored and not sanitized.
 * @param {Object} p
 * @param {*} p.obj - Object to sanitize
 * @param {*} p.sanitization - Sanitization object; e.g.  {key1: 'string', key2: 'number?'}
 * @param {Object} [p.options]
 * @param {string} [p.options.numberToDate=schema.NUMBER_TO_DATE_OPTS__EXCEL_1900_SERIAL_DATE] - one of NUMBER_TO_DATE_OPTS
 * @param {boolean} [p.options.dateUTC=false]
 * @param {*} [p.options.defaultString='']
 * @param {*} [p.options.defaultNumber=0]
 * @param {*} [p.options.defaultDate=new Date(0)]
 * @param {*} [p.options.defaultBigInt=BigInt(0)]
 * @param {boolean} [p.validate=false] - Optional validation flag
 * @param {boolean} [p.keyInsensitiveMatch=false] - Optionally match keys between sanitization and obj to sanitize in a case insensitive way (case and trim)
 * @return {*} Sanitized object
 */
function sanitizeObj ({ obj, sanitization, options, validate = false, keyInsensitiveMatch = false }) {
  let retValue;

  if (obj == null || typeof obj !== 'object')  // double check, because typeof null is object
    retValue = {};  // return an empty object if `obj` is not an object
  else if (sanitization == null || typeof sanitization !== 'object' || Array.isArray(sanitization))  // double check, because typeof null is object and typeof array is object
    retValue = obj;
  else if (Array.isArray(obj)) {
    for (const elem of obj) {
      for (let i = 0; i < obj.length; i++) {  // sanitize every element of the array
        if (keyInsensitiveMatch)
          obj[i] = _sanitizeObj2_keyInsensitiveMatch(obj[i]);
        else
          obj[i] = _sanitizeObj2(obj[i]);
      }
    }
    retValue = obj;
  } else {
    if (keyInsensitiveMatch)
      retValue = _sanitizeObj2_keyInsensitiveMatch(obj);
    else
      retValue = _sanitizeObj2(obj);
  }

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

  /**
   * Local sanitization function, with key insensitive match
   * @param {*} _obj - Object to sanitize
   * @return {*} Sanitized object
   */
  function _sanitizeObj2_keyInsensitiveMatch (_obj) {
    // loop object to sanitize keys
    for (const key of Object.keys(_obj)) {
      // get sanitization with get2 (get key after trim & case insensitive)
      const _sanitization = get2(sanitization, key);
      // skip loop if sanitization is undefined
      if (_sanitization == null)
        continue;

      // skip enum sanitization (if the sanitization array contains values different from functions means that it is an enum)
      if (Array.isArray(_sanitization) && typeof _sanitization[0] !== 'function')
        continue;

      _obj[key] = sanitize({ value: _obj[key], sanitization: get2(sanitization, key), options: options });
    }

    // code that generate properties with default values if they are missing in the object to sanitize;
    // loop sanitization keys, not object to sanitize keys
    for (const key of Object.keys(sanitization)) {
      // if the sanitization is optional, skip sanitization
      if ((typeof sanitization[key] === 'string') && (sanitization[key].toString().trim().slice(-1) === '?'))
        continue;

      // if there is a key in the object to sanitize that match the sanitization key, skip sanitization
      if (Object.keys(_obj).find(_ => eq2(_, key)))
        continue;

      // if we are here, the sanitization key is missing in the object to sanitize, so add it with default value
      _obj[key] = sanitize({ value: _obj[key], sanitization: sanitization[key], options: options });
    }
    return _obj;
  }
}
