import fs from 'node:fs';

/**
 * Delete a file
 *
 * @param {string} path - The path of the local file to delete
 */
export function deleteFile (path) {
  try {
    // see https://nodejs.org/api/fs.html#fsunlinksyncpath
    fs.unlinkSync(path);
  } catch (_) { }
}
