// run with `deno run --allow-net --allow-read --allow-write THIS_FILE`

export { downloadFromUrl };

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pipeline } from 'node:stream/promises';
import { deleteFile } from './delete_file.js';

/**
 * Download from `url` a file zipped in gzip and unzip it
 *
 * @param {Object} p
 * @param {string} p.url - Url in which is stored the file to download
 * @param {string} p.filepath - The path of the local file to create
 */
async function downloadFromUrl ({ url, filepath }) {
  // Ensures that the required folders exists. If the folders do not exist, are created
  let dir = path.dirname(filepath);
  // if `dir` is '.' convert it to `process.cwd()`
  dir = (dir === '.') ? process.cwd() : dir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  deleteFile(filepath);

  // open destination file
  const dest = fs.createWriteStream(filepath);

  //#region download and unzip file
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  } else if (!response.body) {
    throw new Error(`The requested download url ${url} doesn't contain an archive to download`);
  } else if (response.status === 404) {
    throw new Error(`The requested url "${url}" could not be found`);
  }

  await pipeline(
    response.body,
    dest
  );
  //#endregion
}
