/**
 * Data Parser Adapter
 * 
 * Intermediate layer for parsing structured data (YAML, JSON, lossless-json, etc.)
 */

// Current implementation: YAML
import { customParseYAML } from '../../../src/lib/unused/yaml.js';

/**
 * Parse structured data string
 * @param {string} text - The data string to parse
 * @returns {*} Parsed data structure
 */
export function parseJSONX(text) {
  return customParseYAML(text);
}
