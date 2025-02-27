export { deepFreeze, ensureArrayValuesAreUnique, eq2, get2, mergeNewKeys };

import { deepEqual } from '../../vendor/fast-equals/fast-equals.js';

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
/**
 * Deep freeze public properties of an object (also a class instance), an array or a function
 * (recursively freeze all public properties, also nested objects and arrays).
 * Class instance private properties (properties starting with #) are not frozen.
 * Freeze is not reversible, so it's not possible to unfreeze the object.
 * @param {*} object
 * @returns {*} the same object, frozen; we can use directly the source object, that will be modified in place, without the need to use  result of this function
 */
function deepFreeze (object) {
  if ((object == null || !((typeof object === 'object') || typeof object === 'function')))
    return object;

  try {
    // if object is a map, loop and freeze its values: loop every key and replace with frozen value
    if (object instanceof Map) {
      for (const [key, value] of object) {
        object.set(key, deepFreeze(value));
      }
    } else {
      // Retrieve the property names defined on object
      const propNames = Reflect.ownKeys(object);

      // Freeze properties before freezing self
      for (const name of propNames) {
        const value = object[name];

        if ((value && typeof value === 'object') || typeof value === 'function') {
          deepFreeze(value);
        }
      }
    }

    return Object.freeze(object);
  } catch (_) {
    return object;
  }
}

/**
 * Ensure that array values are unique. Returns the same array if values are unique, without modifying it.
 * @param {any[]} array
 * @returns {any[]} the same array, if values are unique
 * @throws {Error} if array values are not unique
 */
function ensureArrayValuesAreUnique (array) {
  const set = new Set(array);
  if (set.size !== array.length) {
    throw new Error('array values are not unique');
  }
  return array;
}

/**
 * Equality of two values, with deep comparison of objects and arrays.
 * If a and b are strings, they are compared after trim & case insensitive.
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function eq2 (a, b) {
  // if a and b are strings, compare them after trim & case insensitive
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  } else {  // else call deepEqual()
    // call deepEqual from fast-equals, https://github.com/planttheidea/fast-equals
    return deepEqual(a, b);
  }
}

/**
 * Get value from an object, querying the key in a case insensitive way.
 * Try to get the exact key, then try to get the key after trim & case insensitive.
 * Returns undefined if key is not found.
 * @param {Record<string, *>} obj
 * @param {string | number} key
 * @returns {undefined | *}
 * @throws {Error} if during the case insensitive search, two keys are found that match the query
 */
function get2 (obj, key) {
  // if obj or key are null or undefined, return undefined
  if (obj == null || key == null)
    return undefined;

  // if obj is not an object, return undefined
  if (!(typeof obj === 'object' || typeof obj === 'function'))
    return undefined;

  // if key is of number type, convert it to string
  if (typeof key === 'number')
    key = key.toString();

  // if obj has the key, return it
  if (Object.prototype.hasOwnProperty.call(obj, key))
    return obj[key];

  let retVal = undefined;
  let found = false;

  // if obj has the key after trim & case insensitive, save it for later return and set ro true the found flag
  for (const _key in obj) {
    if (eq2(_key, key)) {
      if (found)
        throw new Error(`two keys found that match the query: ${key}`);
      else {
        found = true;
        retVal = obj[_key];
      }
    }
  }

  // else return undefined
  return retVal;
}

/**
 * Takes keys from source object and merge them into target.
 * If keys are of the source object (and not inherited), copy them to target if target does not have them.
 * @param {Object} p
 * @param {any} p.target
 * @param {any} p.source
 * @returns {any}
 */
function mergeNewKeys ({ target, source }) {
  // catch errors, if any returns target
  try {
    // if target or source are null, return target
    if (target == null || source == null)
      return target;

    // if target or source are not objects, return target
    if (!(typeof target === 'object' || typeof target === 'function') || !(typeof source === 'object' || typeof source === 'function'))
      return target;

    // loop on source keys; if keys are of the source object (and not inherited), copy them to target if target does not have them
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key) && !Object.prototype.hasOwnProperty.call(target, key))
        target[key] = source[key];
    }

  } catch (e) {
    return target;
  }
}
