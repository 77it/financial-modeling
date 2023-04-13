export { parseJSON5, parseJSON5Lowercased, objectKeysToLowerCase };

// see https://json5.org/
// see also https://github.com/json5/json5
// @deno-types='https://unpkg.com/json5@2/lib/index.d.ts'
import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs';

/**
 * Parse a JSON5 string
 * @param {*} value
 * @returns {undefined | *} undefined if not valid, otherwise the parsed value
 */
function parseJSON5 (value) {
  try {
    return JSON5.parse(value);
  } catch (e) {
    return undefined;
  }
}

/**
 * Parse a JSON5 string, returning an object with all keys lowercased
 * @param {*} value
 * @returns {undefined | *} undefined if not valid, otherwise the parsed value
 */
function parseJSON5Lowercased (value) {
  try {
    const _parsedObject = JSON5.parse(value);

    // see https://stackoverflow.com/a/54985484/5288052 + https://stackoverflow.com/questions/12539574/whats-the-best-way-most-efficient-to-turn-all-the-keys-of-an-object-to-lower
    // and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
    return objectKeysToLowerCase(_parsedObject);
  } catch (e) {
    return undefined;
  }
}

// from https://stackoverflow.com/a/41072596/5288052 + edit from comment
/**
 * Convert all keys of an object to lowercase
 * @param {*} input
 * @returns {{}|*}
 */
function objectKeysToLowerCase (input) {
  if (typeof input !== 'object' || input === null) return input;
  if (Array.isArray(input)) return input.map(objectKeysToLowerCase);
  return Object.keys(input).reduce(
    /** @param {*} newObj
     * @param key */
    function (newObj, key) {
      const val = input[key];
      newObj[key.toLowerCase()] = (typeof val === 'object') && val !== null ? objectKeysToLowerCase(val) : val;
      return newObj;
    }, {});
}
