export { parseJSON5 };

// see https://json5.org/
// see also https://github.com/json5/json5
// @deno-types='https://unpkg.com/json5@2/lib/index.d.ts'
import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs';

/**
 * To check whether the date is valid
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
