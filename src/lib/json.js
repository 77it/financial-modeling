export { cachedParseJSONrelaxed, parseJSONrelaxed };

import { quoteKeysNumbersAndDatesForRelaxedJSON } from './json_relaxed_utils_v4_x.js';
import { deepFreeze } from './obj_utils.js';
import { lru } from '../../vendor/tiny_lru/lru.js';
import { JSON_CACHE_SIZE, JSON_CACHE_SIZE__MAX_CACHEABLE_CHARS } from '../config/engine.js';

const parsedJSONrelaxed_cache = lru(JSON_CACHE_SIZE);

/**
 * Parse a JSON string (relaxed mode), returns input value if parsing fails.
 * Before parsing the string with JSON.parse(), it quotes unquoted keys and string values that are numbers or dates.
 *
 * This version caches with an LRU the last parsed value and its result to optimize repeated calls with the same input.
 * @param {*} value the input value to parse
 * @param {string} [unquotedStringsMarker=''] - optional marker to identify unquoted strings
 * @param {boolean} [formulaAdvancedParsing=false] - enable advanced formula parsing (slower, parses function calls)
 * @returns {*} If input is not a string or parsing fails, returns the original input.
 *              On success, returns the parsed value (objects/arrays are deeply frozen).
 *              Note: failures are negative-cached; the same bad input will return the original string.
 */
function cachedParseJSONrelaxed (value, unquotedStringsMarker, formulaAdvancedParsing = false) {
  if (value == null || typeof value !== 'string') return value;

  // Length check is ~free; protects your LRU and CPU on giant inputs.
  if (value.length > JSON_CACHE_SIZE__MAX_CACHEABLE_CHARS) {
    try {
      return JSON.parse(quoteKeysNumbersAndDatesForRelaxedJSON(value, unquotedStringsMarker, formulaAdvancedParsing));
    } catch {
      return value; // no negative-cache for very large bad inputs
    }
  }

  const cached = parsedJSONrelaxed_cache.get(value);
  if (cached !== undefined) return cached;

  try {
    const parsed = JSON.parse(quoteKeysNumbersAndDatesForRelaxedJSON(value, unquotedStringsMarker, formulaAdvancedParsing));
    const out = (parsed && typeof parsed === 'object') ? deepFreeze(parsed) : parsed;
    parsedJSONrelaxed_cache.set(value, out);
    return out;
  } catch (e) {
    // Negative-cache failures to avoid repeated work on hot bad string inputs
    parsedJSONrelaxed_cache.set(value, value);
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
function parseJSONrelaxed (value, unquotedStringsMarker, formulaAdvancedParsing = false) {
  try {
    if (value == null)
      return value;

    if (typeof value !== 'string')
      return value;

    return JSON.parse(quoteKeysNumbersAndDatesForRelaxedJSON(value, unquotedStringsMarker, formulaAdvancedParsing));
  } catch (e) {
    return value;
  }
}
