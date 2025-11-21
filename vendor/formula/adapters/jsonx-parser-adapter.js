/**
 * Data Parser Adapter
 * 
 * Intermediate layer for parsing structured data (YAML, JSON, lossless-json, etc.)
 */

export { parseJSONX };

// JSON relaxed
import { cachedParseJSONrelaxed as parse } from '../../../src/lib/json.js';
// YAML
//import { customParseYAML as parse } from '../../../src/lib/unused/yaml.js';

/**
 * Parse structured data string
 * @param {string} text - The data string to parse
 * @returns {*} Parsed data structure
 */
function parseJSONX(text) {
  return parse(text);
}
