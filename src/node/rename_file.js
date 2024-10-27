import fs from 'node:fs';

/**
 * Rename a file
 *
 * @param {string} source - The path of the local file to rename
 * @param {string} destination - The new path of the local file
 */
export function renameFile (source, destination) {
  fs.renameSync(source, destination);
}
