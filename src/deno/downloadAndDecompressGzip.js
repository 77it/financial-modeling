// run with `deno run --allow-net --allow-read --allow-write src\deno\downloadAndDecompressGzip.js`

export { downloadAndDecompressGzip };

import { ensureFile } from 'https://deno.land/std@0.181.0/fs/mod.ts';

/**
 * Download from `url` a file zipped in gzip and unzip it
 * inspired to https://deno.land/std@0.177.0/_util/download_file.ts?source
 *
 * @param {Object} p
 * @param {string} p.url - Url in which is stored the file to download
 * @param {string} p.path - The path of the local file to create
 */
async function downloadAndDecompressGzip ({ url, path }) {
  // Ensures that the file exists. If the file that is requested to be created is in directories that do not exist.
  // these directories are created. If the file already exists, it is NOTMODIFIED.
  await ensureFile(path);

  // try to delete `path`  // see https://deno.land/api@v1.28.1?s=Deno.removeSync + https://www.woolha.com/tutorials/deno-delete-file-directory-examples + https://arjunphp.com/delete-file-deno/
  try {
    Deno.removeSync(path);
  } catch (_) { }

  // see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful
  // see https://www.builder.io/blog/safe-data-fetching
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  } else if (!response.body) {
    throw new Error(
      `The requested download url ${url} doesn't contain an archive to download`,
    );
  } else if (response.status === 404) {
    throw new Error(
      `The requested url "${url}" could not be found`,
    );
  }

  const dest = await Deno.open(path, {
    create: true,
    write: true,
    truncate: true
  });

  // gzip   https://medium.com/deno-the-complete-reference/zip-and-unzip-files-in-deno-ee282da7369f
  // tar/untar   https://stackoverflow.com/questions/71365204/untar-from-a-fetch-reader-in-deno
  // https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream/DecompressionStream
  // https://deno.land/api@v1.21.3?s=DecompressionStream
  await response.body?.pipeThrough(new DecompressionStream('gzip'))?.pipeTo(dest.writable);
  // to download without decompressing...
  //await response.body?.pipeTo(dest.writable);
}
