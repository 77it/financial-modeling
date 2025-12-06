export { parseJSONrelaxed_v3, parseJSONrelaxed_v2, parseJSONrelaxed_v1, parseJSONrelaxed_v0 };

import { quoteKeysNumbersAndDatesForRelaxedJSON as quoteKeysNumbersAndDatesForRelaxedJSON_v0 } from './json_relaxed_utils_v0_x.js';
import { quoteKeysNumbersAndDatesForRelaxedJSON as quoteKeysNumbersAndDatesForRelaxedJSON_v1 } from './json_relaxed_utils_v1_x.js';
import { quoteKeysNumbersAndDatesForRelaxedJSON as quoteKeysNumbersAndDatesForRelaxedJSON_v2 } from './json_relaxed_utils_v2_x.js';
import { quoteKeysNumbersAndDatesForRelaxedJSON as quoteKeysNumbersAndDatesForRelaxedJSON_v3 } from './json_relaxed_utils_v3_x.js';

/**
 * Parse a JSON string (relaxed mode), returns input value if parsing fails.
 * Before parsing the string with JSON, it quotes unquoted keys and string values that are numbers or dates.
 * @param {*} value
 * @param {string} [unquotedStringsMarker=''] - optional marker to identify unquoted strings
 * @param {boolean} [formulaAdvancedParsing=false] - enable advanced formula parsing (slower, parses function calls)
 * @returns {*} input value if parsing input value is not parseable, otherwise the parsed value
 */
function parseJSONrelaxed_v0 (value, unquotedStringsMarker, formulaAdvancedParsing = false) {
  try {
    if (value == null)
      return value;

    if (typeof value !== 'string')
      return value;

    return JSON.parse(quoteKeysNumbersAndDatesForRelaxedJSON_v0(value));
  } catch (e) {
    return value;
  }
}

/**
 * Parse a JSON string (relaxed mode), returns input value if parsing fails.
 * Before parsing the string with JSON, it quotes unquoted keys and string values that are numbers or dates.
 * @param {*} value
 * @param {string} [unquotedStringsMarker=''] - optional marker to identify unquoted strings
 * @param {boolean} [formulaAdvancedParsing=false] - enable advanced formula parsing (slower, parses function calls)
 * @returns {*} input value if parsing input value is not parseable, otherwise the parsed value
 */
function parseJSONrelaxed_v1 (value, unquotedStringsMarker, formulaAdvancedParsing = false) {
  try {
    if (value == null)
      return value;

    if (typeof value !== 'string')
      return value;

    return JSON.parse(quoteKeysNumbersAndDatesForRelaxedJSON_v1(value, unquotedStringsMarker, formulaAdvancedParsing));
  } catch (e) {
    return value;
  }
}

/**
 * Parse a JSON string (relaxed mode), returns input value if parsing fails.
 * Before parsing the string with JSON, it quotes unquoted keys and string values that are numbers or dates.
 * @param {*} value
 * @param {string} [unquotedStringsMarker=''] - optional marker to identify unquoted strings
 * @param {boolean} [formulaAdvancedParsing=false] - enable advanced formula parsing (slower, parses function calls)
 * @returns {*} input value if parsing input value is not parseable, otherwise the parsed value
 */
function parseJSONrelaxed_v2 (value, unquotedStringsMarker, formulaAdvancedParsing = false) {
  try {
    if (value == null)
      return value;

    if (typeof value !== 'string')
      return value;

    return JSON.parse(quoteKeysNumbersAndDatesForRelaxedJSON_v2(value, unquotedStringsMarker, formulaAdvancedParsing));
  } catch (e) {
    return value;
  }
}

/**
 * Parse a JSON string (relaxed mode), returns input value if parsing fails.
 * Before parsing the string with JSON, it quotes unquoted keys and string values that are numbers or dates.
 * @param {*} value
 * @param {string} [unquotedStringsMarker=''] - optional marker to identify unquoted strings
 * @param {boolean} [formulaAdvancedParsing=false] - enable advanced formula parsing (slower, parses function calls)
 * @returns {*} input value if parsing input value is not parseable, otherwise the parsed value
 */
function parseJSONrelaxed_v3 (value, unquotedStringsMarker, formulaAdvancedParsing = false) {
  try {
    if (value == null)
      return value;

    if (typeof value !== 'string')
      return value;

    return JSON.parse(quoteKeysNumbersAndDatesForRelaxedJSON_v3(value, unquotedStringsMarker, formulaAdvancedParsing));
  } catch (e) {
    return value;
  }
}
