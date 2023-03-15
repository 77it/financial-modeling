export { parse };

// see https://json5.org/
// see also https://github.com/json5/json5
import JSON5 from 'https://unpkg.com/json5@2/dist/index.min.mjs';

/**
 * To check whether the date is valid
 * @param {string} value
 * @returns {undefined | *} undefined if not valid, otherwise the parsed value
 */
function parse (value) {
  try {
    return JSON5.parse(value);
  } catch (e) {
    return undefined;
  }
}
