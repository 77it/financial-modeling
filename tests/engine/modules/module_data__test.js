// run with `deno test --allow-read THIS-FILE-NAME`

import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';

import { moduleData_LoadFromJson } from '../../../src/engine/modules/module_data__load_from_json.js';
import { readLines } from 'https://deno.land/std@0.152.0/io/mod.ts';

Deno.test('moduleData test: read multiline file', async () => {
  const filename = new URL('module_data__test_data+whitespace.jsonl', import.meta.url);  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186
  //const filename = "./module_data__test_data.jsonl";
  const fileReader = await Deno.open(filename);

  const jsonLines = [];

  for await (const line of readLines(fileReader))
    if (line.trim())
      jsonLines.push(line);
  fileReader.close();

  const json0 = moduleData_LoadFromJson(jsonLines[0]);
  console.log(json0.moduleName);
  assertEquals(json0.moduleName, 'vendite');
  const json1 = moduleData_LoadFromJson(jsonLines[1]);
  console.log(json1.moduleName);
  assertEquals(json1.moduleName, 'settingsx');
});
