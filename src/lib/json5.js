export { parse };

// see https://json5.org/
// see also https://github.com/json5/json5
import { JSON5 } from '../deps.js'

/**
 * To check whether the date is valid
 * @param {*} value
 * @returns {undefined | *} undefined if not valid, otherwise the parsed value
 */
function parse (value) {
  try {
    return JSON5.parse(value);
  } catch (e) {
    return undefined;
  }
}
