// run with `deno test --allow-read --allow-net --allow-write`

import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../deps.js';

import { downloadAndDecompressGzip } from '../../src/deno/downloadAndDecompressGzip.js';

Deno.test('downloadAndDecompressGzip tests', async () => {
  const url = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter.exe.gz';
  const path = './converter.exe';

  await downloadAndDecompressGzip({ url, path });

  //#region check if file exists
  // see https://deno.land/api@v1.28.3?s=Deno.statSync
  //
  // existsSync is deprecated from https://deno.land/std@0.171.0/fs/mod.ts
  // assert(existsSync(path));
  const fileInfo = Deno.statSync(path);  // throws if file does not exist
  assert(fileInfo.isFile);
  //#endregion

  //#region delete file
  // see https://www.woolha.com/tutorials/deno-delete-file-directory-examples
  // see https://arjunphp.com/delete-file-deno/
  Deno.removeSync(path);  // throws if file does not exist
  //#endregion
});
