// run with `deno test --allow-read THIS-FILE-NAME`

import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { win32 } from "https://deno.land/std@0.182.0/path/mod.ts";

import { moduleDataArray_LoadFromJsonlFile } from '../../../src/deno/module_data_array__load_from_jsonl_file.js';
import { readLines } from 'https://deno.land/std@0.152.0/io/mod.ts';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

Deno.test('moduleData test: read multiline file', async () => {
  const filename = new URL('module_data__test_data+whitespace.jsonl', import.meta.url);  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186
  //const filename = "./module_data__test_data.jsonl";

  const _json = await moduleDataArray_LoadFromJsonlFile(filename);

  console.log(_json[0].moduleName);
  assertEquals(_json[0].moduleName, 'vendite');
  console.log(_json[1].moduleName);
  assertEquals(_json[1].moduleName, 'settingsx');
});


Deno.test('moduleData test: malformed string, sanitized during object build', async () => {
  const json0 = new ModuleData(JSON.parse('{"tables":[]}'));
  console.log(json0);
  assertEquals(JSON.stringify(json0), JSON.stringify({ moduleName: '', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '', tables: [] }));

  const json1 = new ModuleData(JSON.parse('{"tables":[{"table":[{}]}]}'));
  console.log(json1);
  assertEquals(JSON.stringify(json1), JSON.stringify({ moduleName: '', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '', tables: [{table:[{}], tableName:''}] }));
});
