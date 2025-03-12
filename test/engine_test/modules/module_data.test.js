// run with `deno test --allow-read

import { moduleDataArray_LoadFromJsonlFile } from '../../../src/node/module_data_array__load_from_jsonl_file.js';
import { ModuleData } from '../../../src/engine/modules/module_data.js';
import { UNPRINTABLE_CHAR, JSON_UNPRINTABLE_CHAR_REGEXP } from '../../../src/config/engine.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('test removal of SERIALIZED ASCII 31 (not ASCII 31 char) unprintable character', async () => {
  const testStringWithUnprintableChar = 'test' + UNPRINTABLE_CHAR + 'test';
  const serialized_testStringWithUnprintableChar = JSON.stringify(testStringWithUnprintableChar);
  console.log(serialized_testStringWithUnprintableChar);
  assert.deepStrictEqual(serialized_testStringWithUnprintableChar, '"test\\u001ftest"');

  const serialized_testStringWithoutUnprintableChar = serialized_testStringWithUnprintableChar.replace(JSON_UNPRINTABLE_CHAR_REGEXP, '');
  assert.deepStrictEqual(serialized_testStringWithoutUnprintableChar, '"testtest"');
});


t('moduleData test: read multiline file', async () => {
  const filename = new URL('module_data__test_data+whitespace.jsonl', import.meta.url);  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186
  //const filename = "./module_data__test_data.jsonl";

  const _json = moduleDataArray_LoadFromJsonlFile(filename);

  console.log(_json[0].moduleName);
  assert.deepStrictEqual(_json[0].moduleName, '\u001fvendite\u001f999\u001f');  // '\u001f', the ASCII 31 unprintable character, is not removed. will be removed by main calling `normalizeModuleData` function taken from the engine file
  console.log(_json[1].moduleName);
  assert.deepStrictEqual(_json[1].moduleName, 'settingsx');
});


t('moduleData test: malformed string, sanitized during object build', async () => {
  const json0 = new ModuleData(JSON.parse('{"tables":[]}'));
  console.log(json0);
  assert.deepStrictEqual(JSON.stringify(json0), JSON.stringify({ moduleName: '', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '', tables: [] }));

  const json1 = new ModuleData(JSON.parse('{"tables":[{"table":[{}]}]}'));
  console.log(json1);
  assert.deepStrictEqual(JSON.stringify(json1), JSON.stringify({ moduleName: '', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '', tables: [{table:[{}], tableName:''}] }));
});
