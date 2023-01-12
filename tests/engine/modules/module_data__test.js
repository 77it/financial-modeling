// run with `deno test --allow-read THIS-FILE-NAME`

import {assert, assertFalse, assertEquals, assertNotEquals} from '../../deps.js';

import {ModuleDataLoader} from "./module_data.js";
import { readLines } from "https://deno.land/std@0.152.0/io/mod.ts";

Deno.test('read multiline file', async () => {
  const filename = new URL("module_data__test_data.jsonl", import.meta.url);  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186
  const fileReader = await Deno.open(filename);

  const jsonLines = [];

  for await (const line of readLines(fileReader))
    jsonLines.push(line);
  fileReader.close();

  const json0 = ModuleDataLoader(jsonLines[0]);
  console.log(json0.moduleName);
  assertEquals(json0.moduleName, 'VENDITE');
  const json1 = ModuleDataLoader(jsonLines[1]);
  console.log(json1.moduleName);
  assertEquals(json1.moduleName, 'SETTINGSX');
});
