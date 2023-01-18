/**
 * Download from `url` a file zipped in gzip and unzip it
 *
 * @param {Object} p
 * @param {string} p.url - Url in which is stored the file to download
 * @param {string} p.path - The path of the local file to create
 */
export async function downloadAndDecompressGzip ({url, path}) {
  // try to delete `path`  // see https://deno.land/api@v1.28.1?s=Deno.removeSync + https://www.woolha.com/tutorials/deno-delete-file-directory-examples + https://arjunphp.com/delete-file-deno/
  try {
    Deno.removeSync(path);
  } catch (_) { }

  // see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_that_the_fetch_was_successful
  // see https://www.builder.io/blog/safe-data-fetching
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Bad fetch response')
  }

  const dest = await Deno.open(path, {
    create: true,
    write: true,
  });

  // gzip   https://medium.com/deno-the-complete-reference/zip-and-unzip-files-in-deno-ee282da7369f
  // tar/untar   https://stackoverflow.com/questions/71365204/untar-from-a-fetch-reader-in-deno
  // https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream/DecompressionStream
  // https://deno.land/api@v1.21.3?s=DecompressionStream
  await response.body?.pipeThrough(new DecompressionStream('gzip'))?.pipeTo(dest.writable);
}
