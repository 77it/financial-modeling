// run with `deno test --allow-read THIS-FILE-NAME`

import {assert, assertFalse, assertEquals, assertNotEquals} from "https://deno.land/std/testing/asserts.ts";

import {ModuleDataLoader, ModuleData} from "./_ModuleData.js";
import { readLines } from "https://deno.land/std@0.152.0/io/mod.ts";

Deno.test('read multiline file', async () => {
    const filename = "./_ModuleData_test_data.jsonl";
    const fileReader = await Deno.open(filename);

    const jsonLines = [];

    for await (const line of readLines(fileReader))
        jsonLines.push(line);
    fileReader.close();

    const json0 = ModuleDataLoader(jsonLines[0]);
    assertEquals(json0.moduleName, 'VENDITE');
    const json1 = ModuleDataLoader(jsonLines[1]);
    assertEquals(json1.moduleName, 'SETTINGSX');
});
