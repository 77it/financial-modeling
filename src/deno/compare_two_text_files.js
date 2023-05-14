export { compareTwoTextFiles };

import { win32 } from 'https://deno.land/std@0.182.0/path/mod.ts';

/**
 * Compare two text files
 * @param {URL | string} file1path
 * @param {URL | string} file2path
 * @return {boolean} true if the two files are equal, false otherwise
 */
function compareTwoTextFiles (file1path, file2path) {
  let _file1Path = (file1path instanceof URL) ? win32.fromFileUrl(file1path) : file1path;
  let _file2Path = (file2path instanceof URL) ? win32.fromFileUrl(file2path) : file2path;

  const _file1Txt = Deno.readTextFileSync(_file1Path);  // see https://deno.land/api@v1.33.3?s=Deno.readTextFileSync
  const _file2Txt = Deno.readTextFileSync(_file2Path);

  return _file1Txt === _file2Txt;
}
