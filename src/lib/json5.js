export { parseJSON5 };

// see https://json5.org/
// see also https://github.com/json5/json5
// @deno-types='https://unpkg.com/json5@2/lib/index.d.ts'
import JSON5 from '../../vendor/json5/index.min.mjs';

/**
 * Parse a JSON5 string
 * @param {*} value
 * @returns {undefined | *} undefined if parsing input string goes in error, otherwise the parsed value; if input is not a string, returns the input value
 */
function parseJSON5 (value) {
  try {
    if (value == null)
      return undefined;

    if (typeof value !== 'string')
      return value;

    return JSON5.parse(value);
  } catch (e) {
    return undefined;
  }
}
