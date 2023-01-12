/**
 * Returns true if the path exists (file or folder), false otherwise
 *
 * @param {string} path - The path of the local file to check
 */
export function existSync (path) {
  // see https://deno.land/api@v1.28.3?s=Deno.statSync
  // see https://deno.land/api@v1.29.2?s=Deno.FileInfo
  //
  // existsSync is deprecated from https://deno.land/std@0.171.0/fs/mod.ts
  // assert(existsSync('./converter.exe'));

  try {
    const fileInfo = Deno.statSync('./converter.exe');  // throws if file does not exist
    if (fileInfo.isDirectory || fileInfo.isFile || fileInfo.isSymlink)
      return true;
    return false;
  } catch (_) {
    return false;
  }
}
