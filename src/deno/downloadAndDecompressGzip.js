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

  const response = await fetch(url);

  const dest = await Deno.open(path, {
    create: true,
    write: true,
  });

  await response.body?.pipeThrough(new DecompressionStream('gzip'))?.pipeTo(dest.writable);
}
