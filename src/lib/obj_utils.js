export { deepFreeze, ensureArrayValuesAreUnique };

// see json5.js  // function objectKeysToLowerCase

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
