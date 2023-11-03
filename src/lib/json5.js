export { parseJSON5 };

// see https://json5.org/
// see also https://github.com/json5/json5
// @deno-types='https://unpkg.com/json5@2/lib/index.d.ts'
import JSON5 from '../../vendor/json5/index.min.mjs';

/**
 * Parse a JSON5 string
 * @param {*} value
 * @returns {undefined | *} undefined if not valid, otherwise the parsed value
 */
function parseJSON5 (value) {
  try {
    if (value == null)
      return undefined;

    return JSON5.parse(value);
  } catch (e) {
    return undefined;
  }
}
