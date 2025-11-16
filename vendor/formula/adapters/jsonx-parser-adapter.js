/**
 * Data Parser Adapter
 * 
 * Intermediate layer for parsing structured data (YAML, JSON, lossless-json, etc.)
 * Swap implementations by changing this file without touching core code
 */

// Current implementation: YAML
import { customParseYAML as parseYAML } from '../../../src/lib/unused/yaml.js';

/**
 * Parse structured data string
 * @param {string} text - The data string to parse
 * @returns {*} Parsed data structure
 */
export function parseData(text) {
  return parseYAML(text);
}

// Alternative implementations (comment/uncomment as needed):

// // Option 2: Standard JSON
// export function parseData(text) {
//   return JSON.parse(text);
// }

// // Option 3: Lossless JSON (preserves precision)
// import LosslessJSON from 'lossless-json';
// export function parseData(text) {
//   return LosslessJSON.parse(text);
// }

// // Option 4: JSON5 (allows comments, trailing commas)
// import JSON5 from 'json5';
// export function parseData(text) {
//   return JSON5.parse(text);
// }
