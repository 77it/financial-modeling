export { deepFreeze, ensureArrayValuesAreUnique };

// see json5.js  // function objectKeysToLowerCase

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
/**
 * Deep freeze an object or an array (recursively freeze all properties, also nested objects and arrays).
 * @param {*} object
 * @returns {*}
 */
function deepFreeze(object) {
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
}

/**
 * Ensure that array values are unique. Returns the same array if values are unique, without modifying it.
 * @param {any[]} array
 * @returns {any[]} the same array, if values are unique
 * @throws {Error} if array values are not unique
 */
function ensureArrayValuesAreUnique(array) {
  const set = new Set(array);
  if (set.size !== array.length) {
    throw new Error("array values are not unique");
  }
  return array;
}
