export { sanitize };

import * as schema from './schema.js';
import { ValidateSanitizeResult } from './validate_sanitize_result.js';
import { parseJsonToLocalDate, parseJsonToUTCDate, excelSerialDateToLocalDate, excelSerialDateToUTCDate, localDateToUTC } from './date_utils.js';
import { validate as validateFunc } from './schema_validation_utils.js';
import { eq2, get2 } from './obj_utils.js';
import { anyToDecimalOrDefault } from './decimal_utils.js';
import { Decimal } from '../../vendor/decimaljs/decimal.js';

//#region defaults
const DEFAULT__NUMBER_TO_DATE = schema.NUMBER_TO_DATE_OPTS.NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE;
// if true, conversion from string or number to dates return UTC dates;
// if true, conversion from dates assumes that dates are in UTC time.
const DEFAULT__DATE_UTC = false;
const DEFAULT_STRING = '';
const DEFAULT_NUMBER = 0;
const DEFAULT_DATE = new Date(0);
const DEFAULT_BIGINT = BigInt(0);
const DEFAULT_DECIMAL = new Decimal(0);

//#endregion defaults

/**
 * Sanitize input Value and return it to allow chaining; if value is an Object or Array, modify it in place and return the same object.
 *
 * If `sanitization` parameter is an object, sanitize as described in "Object Sanitization"
 * otherwise sanitize as described in "Value Sanitization".
 *
 * # Value Sanitization
 * Accepted sanitization types are many: see `schema.js` (class is 'function', class instance is 'object');
 * BigInt is supported: 'bigint', 'bigint_number' (a BigInt that can be converted to a number), 'array[bigint]', 'array[bigint_number]'.
 * To sanitize an object, see section below.
 * To sanitize a value applying a function, pass a function returning with class `ValidateSanitizeResult` the validation result and the sanitized value.
 * For optional values (null/undefined are accepted) append schema.OPTIONAL to the type.
 * If sanitization is an array containing a single function [func], the sanitization will be done with the function and an array will be returned.
 * enum will be ignored during sanitization, optionally validated.
 * Sanitization types ANY_TYPE, FUNCTION_TYPE are ignored and the value is returned as is.
 * Array are sanitized without cloning them.
 * A non-array value sanitized to array becomes an array with the value added as first element.
 * Null/undefined are sanitized to an empty array [].
 * ANY_TYPE, FUNCTION_TYPE, SYMBOL_TYPE are ignored and returned as is.
 * With `STRING_TYPE` whitespaces are trimmed if the string is empty.
 * String to dates are parsed as JSON to dates (in local time or UTC, depending on options.dateUTC).
 * Number to dates are considered by default Excel serial dates (stripping hours); can be changed with options.
 *
 * # Object Sanitization
 * To sanitize an object pass one as `sanitization` parameter   {key1: STRING_TYPE, key2: NUMBER_TYPE + OPTIONAL}
 * or pass the sanitization type OBJECT_TYPE or ARRAY_OF_OBJECTS_TYPE.
 *
 * Sanitize Object, modifying it in place and returning the same object to allow function chaining.
 * If obj is array, the sanitization is done on contained objects;
 * arrays are sanitized without cloning them.
 * If obj is null/undefined or other non-objects returns an empty object {}.
 * If obj is null/undefined or other non-objects returns an empty array [].
 * `sanitization` parameter is an object with keys corresponding to the keys of the object to sanitize and values corresponding to the sanitization types;
 * accepted types are many: see `schema.js`; class is 'function', class instance is 'object';
 * for optional parameters (null/undefined are accepted) append `schema.OPTIONAL` to type, e.g. 'any + OPTIONAL', 'string + OPTIONAL', 'number + OPTIONAL', etc.
 * If sanitization is an array:
 *   if is an array containing a single object [{obj}], the sanitization will be done with the object and an array will be returned;
 *   in any other case the array will be considered an enum, ignored during sanitization, optionally validated.
 * Object keys missing from the sanitization object are ignored and not sanitized.
 * @param {Object} p
 * @param {*} p.value - Value to sanitize
 * @param {*} p.sanitization - Sanitization type (object, string, array of strings, sanitization function, array containing a sanitization function)
 * @param {Object} [p.options]
 * @param {schema.NUMBER_TO_DATE_OPTS} [p.options.numberToDate=schema.NUMBER_TO_DATE_OPTS.NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE] - one of NUMBER_TO_DATE_OPTS
 * @param {boolean} [p.options.dateUTC=false]
 * @param {*} [p.options.defaultString='']
 * @param {*} [p.options.defaultNumber=0]
 * @param {*} [p.options.defaultDate=new Date(0)]
 * @param {*} [p.options.defaultBigInt=BigInt(0)]
 * @param {*} [p.options.defaultDecimal=new Decimal(0)]
 * @param {boolean} [p.validate=false] - Optional validation flag; if true validate the value after sanitization, throwing an error if the validation fails
 * @param {boolean} [p.keyInsensitiveMatch=false] - Used only if `sanitization` is an object; optional, default false; if true match keys between sanitization and obj to sanitize in a case insensitive way (case and trim)
 * @return {*} Sanitized value
 * @throws {Error} Will throw an error if the validation fails
 */
function sanitize ({ value, sanitization, options, validate = false, keyInsensitiveMatch = false }) {
  if (sanitization == null)
    throw new Error(`'sanitization' parameter can't be null or undefined`);
  if (typeof sanitization !== 'string' && typeof sanitization !== 'object' && !Array.isArray(sanitization) && typeof sanitization !== 'function')
    throw new Error(`'sanitization' parameter must be a string, an object, an array or a function`);

  if (options == null) options = {};  // init sanitize options, otherwise the following code won't work
  const _NUMBER_TO_DATE = ('numberToDate' in options) ? options.numberToDate : DEFAULT__NUMBER_TO_DATE;
  validateFunc({ value: _NUMBER_TO_DATE, validation: Object.values(schema.NUMBER_TO_DATE_OPTS) });
  /** @type {boolean} */
  const _DATE_UTC = options?.dateUTC ?? DEFAULT__DATE_UTC;

  // default values: checks are done in this way to preserve the explicitly passed `undefined` values
  const _DEFAULT_STRING = ('defaultString' in options) ? options.defaultString : DEFAULT_STRING;
  const _DEFAULT_NUMBER = ('defaultNumber' in options) ? options.defaultNumber : DEFAULT_NUMBER;
  const _DEFAULT_DATE = ('defaultDate' in options) ? options.defaultDate : DEFAULT_DATE;
  const _DEFAULT_BIGINT = ('defaultBigInt' in options) ? options.defaultBigInt : DEFAULT_BIGINT;
  const _DEFAULT_DECIMAL = ('defaultDecimal' in options) ? options.defaultDecimal : DEFAULT_DECIMAL;

  // if `sanitization` is an array
  // * and `sanitization[0]` is an object, sanitize as object returning an array as output;
  // * and `sanitization[0]` is a function, use it to sanitize the array;
  // * otherwise, the sanitization array is considered an enum and is used only for validation.
  //
  // if `sanitization` is not an array sanitize as object, or function, or following the sanitization type
  // if Array
  if (Array.isArray(sanitization)) {
    // if sanitization array is long 1 && sanitization[0] is an object, sanitize as object with flag to generate an array as output
    if (sanitization.length === 1 && typeof sanitization[0] === 'object') {
      value = _sanitizeToObjectOrArrayOfObjects({
        obj: value, sanitization: sanitization[0], toArray: true, options: options, validate: validate, keyInsensitiveMatch: keyInsensitiveMatch
      });
      // if array is long 1 && sanitization[0] is a function, use it to sanitize the array
    } else if (sanitization.length === 1 && typeof sanitization[0] === 'function') {
      value = _sanitizeToArray({ value: value, sanitization: sanitization[0] });
    } else {
      // at this point the array is considered enum, not sanitized
    }

    return _validateIfTrue({ value: value, validation: sanitization, flag: validate });
  } else {  // if sanitization !Array
    if (typeof sanitization === 'object') {  // if sanitization !Array & is Object
      value = _sanitizeToObjectOrArrayOfObjects({
        obj: value, sanitization: sanitization, toArray: false, options: options, validate: validate, keyInsensitiveMatch: keyInsensitiveMatch
      });

      return _validateIfTrue({ value: value, validation: sanitization, flag: validate });
    } else if (typeof sanitization === 'function') {  // if sanitization is function
      // if sanitization is a function call it and read the validation and sanitization result stored in the `ValidateSanitizeResult` type
      /** @type {ValidateSanitizeResult} */
      const validationResult = sanitization(value);
      if (!(validationResult instanceof ValidateSanitizeResult))
        throw new Error('sanitization function must return a `ValidateSanitizeResult` object');

      return _validateIfTrue({ value: validationResult.sanitizedValue, validation: sanitization, flag: validate });
    } else {
      // if sanitization is not an object and not a function
      // continue below with sanitization following the sanitization type
    }
  }

  let optionalSanitization = false;
  let sanitizationType = sanitization.toString().trim().toLowerCase();
  if (sanitization.trim().slice(-schema.OPTIONAL.length) === schema.OPTIONAL) {  // set optional sanitization flag
    optionalSanitization = true;
    sanitizationType = sanitization.toString().trim().toLowerCase().slice(0, -schema.OPTIONAL.length);
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
        else if ((typeof value === 'number' && isFinite(value)) || typeof value === 'bigint' || value instanceof Decimal)
          retValue = String(value);
        else if (value instanceof Date)
          if (_DATE_UTC) {
            // if `_DATE_UTC` is true, the date is presumed to be UTC then is not needed to convert it to UTC before converting the date to ISO string
            retValue = value.toISOString();
          } else {
            // if `_DATE_UTC` is false, the date is presumed to be in local time then is generated a UTC date with the date components (ignoring the time zone) and then the date is converted to ISO string
            retValue = localDateToUTC(value).toISOString();
          }
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
        else {
          retValue = isFinite(Number(value)) ? Number(value) : _DEFAULT_NUMBER;
          retValue = Object.is(retValue, -0) ? 0 : retValue;  // convert -0 to 0
        }
      } catch (_) {
        retValue = _DEFAULT_NUMBER;
      }
      break;
    }
    case schema.DECIMAL_TYPE: {
      retValue = anyToDecimalOrDefault(value, _DEFAULT_DECIMAL);
      break;
    }
    case schema.BOOLEAN_TYPE: {
      if (typeof value === 'string') {
        const _value = value.trim().toLowerCase();
        if (_value === 'false' || _value === '') {
          retValue = false;
          break;
        }
      } else if (value instanceof Decimal) {
        retValue = !value.isZero();
        break;
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
          } else if (typeof value === 'number' || typeof value === 'bigint' || value instanceof Decimal) {  // if `value` is number, BigInt or Decimal, convert it as Excel serial date to date in local time or UTC
            const _numValue = Number(value);
            if (_NUMBER_TO_DATE === schema.NUMBER_TO_DATE_OPTS.NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE) {
              if (_DATE_UTC)
                _value = excelSerialDateToUTCDate(_numValue);
              else
                _value = excelSerialDateToLocalDate(_numValue);
            } else if (_NUMBER_TO_DATE === schema.NUMBER_TO_DATE_OPTS.NUMBER_TO_DATE__JS_SERIAL_DATE)
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
        if (value == null)
          retValue = [];
        else
          retValue = [value];
      else
        retValue = value;
      break;
    }
    case schema.ARRAY_OF_STRINGS_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.STRING_TYPE });
      break;
    }
    case schema.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.STRINGLOWERCASETRIMMED_TYPE });
      break;
    }
    case schema.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.STRINGUPPERCASETRIMMED_TYPE });
      break;
    }
    case schema.ARRAY_OF_NUMBERS_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.NUMBER_TYPE });
      break;
    }
    case schema.ARRAY_OF_DECIMAL_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.DECIMAL_TYPE });
      break;
    }
    case schema.ARRAY_OF_BOOLEANS_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.BOOLEAN_TYPE });
      break;
    }
    case schema.ARRAY_OF_DATES_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.DATE_TYPE });
      break;
    }
    case schema.ARRAY_OF_OBJECTS_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.OBJECT_TYPE });
      break;
    }
    case schema.OBJECT_TYPE: {
      retValue = _sanitizeToObjectOrArrayOfObjects({
        obj: value, sanitization: sanitization, toArray: false, options: options, validate: validate, keyInsensitiveMatch: keyInsensitiveMatch
      });
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
      retValue = _sanitizeToArray({ value: value, sanitization: schema.BIGINT_TYPE });
      break;
    }
    case schema.ARRAY_OF_BIGINT_NUMBER_TYPE: {
      retValue = _sanitizeToArray({ value: value, sanitization: schema.BIGINT_NUMBER_TYPE });
      break;
    }
    default:
      throw new Error(
        `sanitization error, ${sanitizationType} type is unrecognized`);
  }

  return _validateIfTrue({ value: retValue, validation: sanitization, flag: validate });

  //#region local functions
  /**
   * Local sanitization function
   *
   * Being a local function, reads `options` from the parent function
   *
   * @param {Object} p
   * @param {*} p.value - Value to sanitize
   * @param {string|function} p.sanitization - Sanitization string or function
   * @return {*} Sanitized array
   */
  function _sanitizeToArray ({ value, sanitization }) {
    if (!Array.isArray(value)) { // if `value` is not an array
      if (value == null)
        // if `value` is not an array && is null/undefined, return an empty array
        return [];
      else
        // if `value` is not an array && is not null/undefined, return a new array with sanitized `value` as first element
        return [sanitize({ value: value, sanitization: sanitization, options: options })];
    }

    // if `value` is an array, sanitize every element of the array
    for (let i = 0; i < value.length; i++) {
      value[i] = sanitize({ value: value[i], sanitization: sanitization, options: options });
    }
    return value;
  }

  //#endregion local functions
}

//#region private functions
/**
 @private
 * Private function: Validate if flag is true; always returns the input value
 * @param {Object} p
 * @param {*} p.value - Value to be optionally validate
 * @param {*} p.validation - Validation object
 * @param {boolean} p.flag - Validation flag
 * @return {*} Input value
 * @throws {Error} Will throw an error if the validation fails
 */
function _validateIfTrue ({ value, validation, flag }) {
  if (flag)
    return validateFunc({ value: value, validation: validation });
  else
    return value;
}

/**
 @private
 * Private function: Check if a value is empty string or whitespace
 * @param {*} value
 * @returns {boolean}
 */
function _isEmptyOrWhiteSpace (value) {
  try {
    if (typeof value !== 'string')
      return false;
    return value === '' || value.toString().trim() === '';
  } catch (_) {
    return false;
  }
}

/**
 @private
 * See function description of `function sanitize`, section "# Object Sanitization"
 *
 * @param {Object} p
 * @param {*} p.obj - Object to sanitize
 * @param {*} p.sanitization - Sanitization object; e.g.  {key1: 'string', key2: 'number?'}
 * @param {boolean} p.toArray - Flag to generate an array as output
 * @param {Object} [p.options]
 * @param {schema.NUMBER_TO_DATE_OPTS} [p.options.numberToDate=schema.NUMBER_TO_DATE_OPTS.NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE] - one of NUMBER_TO_DATE_OPTS
 * @param {boolean} [p.options.dateUTC=false]
 * @param {*} [p.options.defaultString='']
 * @param {*} [p.options.defaultNumber=0]
 * @param {*} [p.options.defaultDate=new Date(0)]
 * @param {*} [p.options.defaultBigInt=BigInt(0)]
 * @param {boolean} [p.validate=false] - Optional validation flag
 * @param {boolean} [p.keyInsensitiveMatch=false] - Optionally match keys between sanitization and obj to sanitize in a case insensitive way (case and trim)
 * @return {*} Sanitized object
 */
function _sanitizeToObjectOrArrayOfObjects ({ obj, sanitization, toArray, options, validate = false, keyInsensitiveMatch = false }) {
  let retValue;

  if (obj == null || typeof obj !== 'object') {  // catches null/undefined values and non-objects values
    if (toArray)
      return [];  // returns an empty array if `toArray` is true and the `obj` to sanitize is null/undefined or not an object
    else
      obj = {};  // init `obj` to an empty object if `toArray` is false && the `obj` to sanitize is null/undefined or not an object, and continue with sanitization
  }

  if (sanitization == null || typeof sanitization !== 'object' || Array.isArray(sanitization))  // double check, because typeof null is object and typeof array is object
    retValue = obj;
  else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {  // sanitize every element of the array
      if (keyInsensitiveMatch)
        obj[i] = _sanitizeObj2_keyInsensitiveMatch(obj[i]);
      else
        obj[i] = _sanitizeObj2(obj[i]);
    }
    retValue = obj;
  } else {
    if (keyInsensitiveMatch)
      retValue = _sanitizeObj2_keyInsensitiveMatch(obj);
    else
      retValue = _sanitizeObj2(obj);
  }

  if (toArray && !Array.isArray(retValue))
    retValue = [retValue];

  return _validateIfTrue({ value: retValue, validation: sanitization, flag: validate });

  //#region local functions
  /**
   * Local sanitization function
   * @param {*} _obj - Object to sanitize
   * @return {*} Sanitized object
   */
  function _sanitizeObj2 (_obj) {
    for (const key of Object.keys(sanitization)) {
      // if sanitization key is missing in the object to sanitize and the sanitization is optional, skip sanitization
      const optionalSanitization =
        (typeof sanitization[key] === 'string') &&
        (sanitization[key].toString().trim().slice(-schema.OPTIONAL.length) === schema.OPTIONAL);
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

      _obj[key] = sanitize({ value: _obj[key], sanitization: get2(sanitization, key), options: options });
    }

    // code that generate properties with default values if they are missing in the object to sanitize;
    // loop sanitization keys, not object to sanitize keys
    for (const key of Object.keys(sanitization)) {
      // if the sanitization is optional, skip sanitization
      if ((typeof sanitization[key] === 'string') && (sanitization[key].toString().trim().slice(-schema.OPTIONAL.length) === schema.OPTIONAL))
        continue;

      // if there is a key in the object to sanitize that match the sanitization key, skip sanitization
      if (Object.keys(_obj).find(_ => eq2(_, key)))
        continue;

      // if we are here, the sanitization key is missing in the object to sanitize, so add it with default value
      _obj[key] = sanitize({ value: _obj[key], sanitization: sanitization[key], options: options });
    }
    return _obj;
  }

  //#endregion local functions
}

//#endregion private functions
