export { deepFreeze, ensureArrayValuesAreUnique, eq, eq2, eqObj, get2, mergeNewKeys, _extractKeys };

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
    // Retrieve the property names defined on object
    const propNames = Reflect.ownKeys(object);

    // Freeze properties before freezing self
    for (const name of propNames) {
      const value = object[name];

      if ((value && typeof value === 'object') || typeof value === 'function') {
        deepFreeze(value);
      }
    }

    return Object.freeze(object);
  } catch (e) {
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
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function eq (a, b) {
  // call deepEqual from fast-equals, https://github.com/planttheidea/fast-equals
  return deepEqual(a, b);
}

/**
 * Equality of two values, with deep comparison of objects and arrays.
 * The difference from eq() is that eq2() is that if a and b are strings, they are compared after trim & case insensitive.
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function eq2 (a, b) {
  // if a and b are strings, compare them after trim & case insensitive
  if (typeof a === 'string' && typeof b === 'string')
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  // else call eq()
  else
    return eq(a, b);
}

/**
 * Equality of two objects (plain objects or classes instances), with deep comparison of objects and arrays.
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function eqObj (a, b) {
  try {
    // if a and b are null or undefined, compare them with eq()
    if (a == null || b == null)
      return eq(a, b);

    // if a or b are arrays, compare them with eq()
    if (Array.isArray(a) || Array.isArray(b))
      return eq(a, b);

    // if a or b are dates, compare them with eq()
    if (a instanceof Date || b instanceof Date)
      return eq(a, b);

    // if a or b are functions, compare them with eq()
    if (typeof a === 'function' || typeof b === 'function')
      return eq(a, b);

    // if a or b are regex, compare them with eq()
    if (a instanceof RegExp || b instanceof RegExp)
      return eq(a, b);

    // if a and b are objects, extract keys then compare them
    if (typeof a === 'object' && typeof b === 'object')
      return eq(_extractKeys(a), _extractKeys(b));

    // fallback, compare them with eq()
    return eq(a, b);
  }
  catch (e) {
    return eq(a, b);
  }
}

/**
 * Get value from an object, querying the key in a case insensitive way.
 * Try to get the exact key, then try to get the key after trim & case insensitive.
 * @param {Record<string, any>} obj
 * @param {string|number} key
 * @returns {any}
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
  if (obj.hasOwnProperty(key))
    return obj[key];

  // if obj has the key after trim & case insensitive, return it
  for (const _key in obj) {
    if (eq2(_key, key))
      return obj[_key];
  }

  // else return undefined
  return undefined;
}

/**
 * Takes keys from source object and merge them into target.
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
      if (source.hasOwnProperty(key) && !target.hasOwnProperty(key))
        target[key] = source[key];
    }

  } catch (e) {
    return target;
  }
}

/**
 * Function used by 'eqObj' to compare classes and objects.
 *
 * Extract keys from a class to a plain object. Can be used also on a plain object, but is not useful because it returns a similar object, cloned.
 * Key values are NOT cloned.
 * If errors occur, returns an empty object.
 * @param {Object} obj
 * @returns {any}
 */
function _extractKeys (obj) {
  // catch errors, if any returns empty object
  try {
    // if source is null or not an object, return empty object
    if (obj == null || !(typeof obj === 'object' || typeof obj === 'function'))
      return {};

    // if source is an array, return empty object
    if (Array.isArray(obj))
      return {};

    // loop object keys and copy them to a plain object (with structuredClone)
    const _keys = {};
    for (const key in obj) {
      //@ts-ignore
      _keys[key] = obj[key];
    }

    return _keys;
  } catch (e) {
    return {};
  }
}
