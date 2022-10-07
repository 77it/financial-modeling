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

XXX validate/sanitize accetta tipi con ?
XXX validate non va in errore se mancano le variabili con ?
XXX sanitize function: non impostare parametri mancanti, lascia a undefined; se null forza a undefined; se c'è un valore, convertilo.

/**
 * Validate Object, throw error for validation error. If obj is array, the validation is done on contained objects.
 * @param {Object} p
 * @param {*} p.obj - Object to validate
 * @param {*} p.validation - Validation object {name: 'type'}[]
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

      xxx implementa check di tipi con ?

      if (!(key in _obj) && tipo termina con ?)
      {
        errors.push(`${key} is missing`);
        continue;
      }

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
            errors.push(`${key} = ${_obj[key]}, must be a valid date`);
          break;
        case 'array':
          if (!Array.isArray(_obj[key]))
            errors.push(`${key} = ${_obj[key]}, must be an array`);
          break;
        case 'object':
          if (typeof _obj[key] !== 'object' || !(_obj[key]))  // see https://stackoverflow.com/a/12535493/5288052
            errors.push(`${key} = ${_obj[key]}, must be an object`);
          break;
        case 'function':
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
