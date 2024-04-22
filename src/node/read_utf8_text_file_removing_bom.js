import fs from 'node:fs';

/**
 * Returns the content of a file as a string
 *
 * @param {string} path - The path of the local file to read
 * @returns {string} - The content of the file
 */
export function readUtf8TextFileRemovingBOM (path) {
  // see https://nodejs.org/api/fs.html#fsreadfilesyncpath-options
  let _fileContent = fs.readFileSync(path, 'utf8');
  if (_fileContent.charCodeAt(0) === 0xFEFF) {
    _fileContent = _fileContent.slice(1);
  }
  return _fileContent;
}
