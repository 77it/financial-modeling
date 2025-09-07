export { cachedParseJSON5relaxed, parseJSON5relaxed, parseJSON5strict };

// see https://json5.org/
// see also https://github.com/json5/json5
// @deno-types='https://unpkg.com/json5@2/lib/index.d.ts'
import JSON5 from '../../vendor/json5/index.min.mjs';
import { quoteNumbersAndDatesForRelaxedJSON5 } from './json5_relaxed_utils.js';
import { deepFreeze } from './obj_utils.js';
import { lru } from '../../vendor/tiny_lru/lru.js';
import { JSON_CACHE_SIZE, JSON_CACHE_SIZE__MAX_CACHEABLE_CHARS } from '../config/engine.js';

const parsedJSON5relaxed_cache = lru(JSON_CACHE_SIZE);

/**
 * Parse a JSON5 string (relaxed mode), returns input value if parsing fails.
 * Before parsing the string with JSON5, it quotes unquoted keys and string values that are numbers or dates.
 *
 * This version caches with an LRU the last parsed value and its result to optimize repeated calls with the same input.
 * @param {*} value the input value to parse
 * @returns {*} If input is not a string or parsing fails, returns the original input.
 *              On success, returns the parsed value (objects/arrays are deeply frozen).
 *              Note: failures are negative-cached; the same bad input will return the original string.
 */
function cachedParseJSON5relaxed (value) {
  if (value == null || typeof value !== 'string') return value;

  // Length check is ~free; protects your LRU and CPU on giant inputs.
  if (value.length > JSON_CACHE_SIZE__MAX_CACHEABLE_CHARS) {
    try {
      return JSON5.parse(quoteNumbersAndDatesForRelaxedJSON5(value));
    } catch {
      return value; // no negative-cache for very large bad inputs
    }
  }

  const cached = parsedJSON5relaxed_cache.get(value);
  if (cached !== undefined) return cached;

  try {
    const parsed = JSON5.parse(quoteNumbersAndDatesForRelaxedJSON5(value));
    const out = (parsed && typeof parsed === 'object') ? deepFreeze(parsed) : parsed;
    parsedJSON5relaxed_cache.set(value, out);
    return out;
  } catch (e) {
    // Negative-cache failures to avoid repeated work on hot bad string inputs
    parsedJSON5relaxed_cache.set(value, value);
    return value;
  }
}

/**
 * Parse a JSON5 string (relaxed mode), returns input value if parsing fails.
 * Before parsing the string with JSON5, it quotes unquoted keys and string values that are numbers or dates.
 * @param {*} value
 * @returns {*} input value if parsing input value is not parseable, otherwise the parsed value
 */
function parseJSON5relaxed (value) {
  try {
    if (value == null)
      return value;

    if (typeof value !== 'string')
      return value;

    return JSON5.parse(quoteNumbersAndDatesForRelaxedJSON5(value));
  } catch (e) {
    return value;
  }
}

/**
 * Parse a JSON5 string (strict mode), returns null if parsing fails
 * @param {*} value
 * @returns {null | *} null if parsing input string goes in error, otherwise the parsed value; if input is not a string, returns the input value
 */
function parseJSON5strict (value) {
  try {
    if (value == null)
      return value;

    if (typeof value !== 'string')
      return value;

    return JSON5.parse(value);
  } catch (e) {
    return null;
  }
}
