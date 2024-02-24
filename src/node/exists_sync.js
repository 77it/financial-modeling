import fs from 'node:fs';

/**
 * Returns true if the path exists (file or folder), false otherwise
 *
 * @param {string} path - The path of the local file to check
 * @returns {boolean} - True if the path exists (file or folder), false otherwise
 */
export function existsSync (path) {
  return fs.existsSync(path);
}
