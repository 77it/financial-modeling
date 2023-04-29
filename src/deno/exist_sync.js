/**
 * Returns true if the path exists (file or folder), false otherwise
 *
 * @param {string} path - The path of the local file to check
 * @returns {boolean} - True if the path exists (file or folder), false otherwise
 */
export function existSync (path) {
  // see https://deno.land/api@v1.33.1?s=Deno.statSync
  // see https://deno.land/api@v1.33.1?s=Deno.FileInfo
  //
  // existsSync is no more deprecated, then you can use it directly
  //    import { existsSync } from "https://deno.land/std@0.185.0/fs/mod.ts";
  //    assert(existsSync('./converter.exe'));
  //    // BEWARE, from docs: Note: do not use this function if performing a check before another operation on that file.
  //    // Doing so creates a race condition. Instead, perform the actual file operation directly.
  // see https://deno.com/blog/v1.33#deprecation-of-fsexists-has-been-canceled
  // see https://deno.land/std@0.185.0/fs/mod.ts?s=existsSync

  try {
    const fileInfo = Deno.statSync(path);  // throws if file does not exist
    if (fileInfo.isDirectory || fileInfo.isFile || fileInfo.isSymlink)
      return true;
    return false;
  } catch (_) {
    return false;
  }
}
