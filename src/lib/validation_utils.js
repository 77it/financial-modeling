export { isInvalidDate } from './date_utils.js';

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
export function isPositive (value) {
  return value >= 0;
}

// XXX sanitize function: se opzionale (?) e === undefined lascia a undefined; in ogni altro caso converti in stringa (se == null -> "", ecc).

/**
 * Validate Object, throw error for validation error. If obj is array, the validation is done on contained objects.
 * Accepted types are: 'any', 'string', 'number', 'boolean', 'date', 'array', 'object', 'function'; class is 'function', class instance is 'object'.
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.validation - Validation object {key1: 'typeA', key2: 'typeB'}
 * @param {string} [p.errorMsg] - Optional error message
 */
// see https://github.com/iarna/aproba for inspiration
export function validate ({ obj, validation, errorMsg }) {
  /** @type {string[]} */
  const errors = [];

  if (typeof obj !== 'object' || !(obj))
    errors.push(`'obj' parameter must be an object`);
  if (typeof validation !== 'object'|| !(validation))
    errors.push(`'validation' parameter must be an object`);
  if (errorMsg != null && typeof errorMsg !== 'string')
    errors.push(`'errorMsg' parameter must be string`);

  if (errors.length === 0) {  // validate 'obj' if there are no parameters error
    if (Array.isArray(obj)) {
      for (const elem of obj) {
        _validate(elem);
      }
    } else
      _validate(obj);
  }

  if (errors.length > 0) {
    if (errorMsg == null)
      throw new Error(`Validation error.\n${JSON.stringify(errors)}`);
    else
      throw new Error(`Validation error.\n${errorMsg}\n${JSON.stringify(errors)}`);
  }

  /**
   * Internal validation function
   * @param {*} _obj - Object to validate
   */
  function _validate (_obj) {
    for (const key of Object.keys(validation)) {

      let optionalValidation = false;
      let validationType = '';
      if (validation[key].toString().trim().slice(-1) === '?') {
        optionalValidation = true;
        validationType = validation[key].toString().trim().toLowerCase().slice(0, -1);
      }
      else {
        validationType = validation[key].toString().trim().toLowerCase();
      }

      if (!(key in _obj)) {  // if validation key is missing in the object to validate
        if (!optionalValidation) {  // if validation is not optional
          errors.push(`${key} is missing`);  // append validation error
        }
        continue;  // skip validation
      }

      switch (validationType) {  // switch validations
        case ANY_TYPE:
          if (_obj[key] === undefined)
            errors.push(`${key} = ${_obj[key]}, must be !== undefined`);
          break;
        case STRING_TYPE:
          if (typeof _obj[key] !== 'string')
            errors.push(`${key} = ${_obj[key]}, must be string`);
          break;
        case NUMBER_TYPE:
          if (typeof _obj[key] !== 'number' || !isFinite(_obj[key]))
            errors.push(`${key} = ${_obj[key]}, must be a valid number`);
          break;
        case BOOLEAN_TYPE:
          if (typeof _obj[key] !== 'boolean')
            errors.push(`${key} = ${_obj[key]}, must be boolean`);
          break;
        case DATE_TYPE:
          if (!(_obj[key] instanceof Date) || isNaN(_obj[key].getTime()))
            errors.push(`${key} = ${_obj[key]}, must be a valid date`);
          break;
        case ARRAY_TYPE:
          if (!Array.isArray(_obj[key]))
            errors.push(`${key} = ${_obj[key]}, must be an array`);
          break;
        case OBJECT_TYPE:
          if (typeof _obj[key] !== 'object' || !(_obj[key]))  // see https://stackoverflow.com/a/12535493/5288052
            errors.push(`${key} = ${_obj[key]}, must be an object`);
          break;
        case FUNCTION_TYPE:
          if (typeof _obj[key] !== 'function')
            errors.push(`${key} = ${_obj[key]}, must be a function`);
          break;
        default:
          errors.push(`${validation[key]}, unrecognized type to validate`);
          break;
      }
    }
  }
}
