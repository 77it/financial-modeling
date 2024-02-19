// run with `deno test --allow-read --allow-net --allow-write`

import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../deps.js';

import { downloadFromUrl } from '../../src/deno/download_from_url.js';

Deno.test('downloadFromUrl tests', async () => {
  const url = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter.exe';
  const filepath = './converter.exe';

  await downloadFromUrl({ url, filepath });

  //#region check if file exists
  // see https://deno.land/api@v1.28.3?s=Deno.statSync
  //
  // existsSync is deprecated from https://deno.land/std@0.171.0/fs/mod.ts
  // assert(existsSync(path));
  const fileInfo = Deno.statSync(filepath);  // throws if file does not exist
  assert(fileInfo.isFile);
  //#endregion

  //#region delete file
  // see https://www.woolha.com/tutorials/deno-delete-file-directory-examples
  // see https://arjunphp.com/delete-file-deno/
  Deno.removeSync(filepath);  // throws if file does not exist
  //#endregion
});
