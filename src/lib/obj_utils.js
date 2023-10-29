export { deepFreeze, ensureArrayValuesAreUnique, eq, eq2, get2 };

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
  if ((object == null || !((typeof object === "object") || typeof object === "function")))
    return object;

  try {
    // Retrieve the property names defined on object
    const propNames = Reflect.ownKeys(object);

    // Freeze properties before freezing self
    for (const name of propNames) {
      const value = object[name];

      if ((value && typeof value === "object") || typeof value === "function") {
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
 * Get value from an object, querying the key in a case insensitive way.
 * Try to get the exact key, then try to get the key after trim & case insensitive.
 * @param {Record<string, any>} obj
 * @param {string} key
 * @returns {any}
 */
function get2 (obj, key) {
  // if obj is not an object, return undefined
  if (!((typeof obj === "object") || typeof obj === "function"))
    return undefined;

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
