/**
 * To check whether the date is valid
 * @param {*} value
 * @returns {Boolean}
 */
// see from https://stackoverflow.com/a/44198641/5288052 + https://stackoverflow.com/questions/643782/how-to-check-whether-an-object-is-a-date
export function isInvalidDate (value) {
  if (value instanceof Date) {
    return isNaN(value.getTime());
  }
  return true;  // is not a date
}

/**
 * To check whether the number is >= 0
 *
 * @param {number} value
 * @return {Boolean}
 */
export function isPositive (value) {
  return value >= 0;
}

/**
 * Validate Object, throw error for validation error
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.validation - Validation object {name: 'type'}[]
 * @param {boolean} [p.array] - Optional flag, object is an array and the validation is done on contained objects
 * @param {string} [p.errorMsg] - Optional error message
 */
// see https://github.com/iarna/aproba for inspiration
export function validate ({ obj, validation, array, errorMsg }) {
  /** @type {string[]} */
  const errors = [];

  if (array) {
    for (const elem of obj) {
      _validate(elem);
    }
  } else
    _validate(obj);

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
      switch (validation[key]) {  // switch validations
        case 'string':
          if (typeof _obj[key] !== 'string')
            errors.push(`${key} = ${_obj[key]}, must be string`);
          break;
        case 'number':
          if (typeof _obj[key] !== 'number' || !isFinite(_obj[key]))
            errors.push(`${key} = ${_obj[key]}, must be a valid number`);
          break;
        case 'boolean':
          if (typeof _obj[key] !== 'boolean')
            errors.push(`${key} = ${_obj[key]}, must be boolean`);
          break;
        case 'date':
          if (!(_obj[key] instanceof Date) || isNaN(_obj[key].getTime()))
            errors.push(`${key} = ${_obj[key]}, must be valid date`);
          break;
        case 'array':
          if (!Array.isArray(_obj[key]))
            errors.push(`${key} = ${_obj[key]}, must be an array`);
          break;
        case 'object':
          if (typeof _obj[key] !== 'object')
            errors.push(`${key} = ${_obj[key]}, must be an object`);
          break;
        case 'function':
          if (typeof _obj[key] !== 'function')
            errors.push(`${key} = ${_obj[key]}, must be a function`);
          break;
        default:
          throw new Error('unrecognized type to validate');
      }
    }
  }
}
