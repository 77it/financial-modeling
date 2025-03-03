// run with --allow-read --allow-write --allow-net --allow-run --allow-env

import { convertExcelToModuleDataArray } from '../../src/node/convert_excel_to_moduledata_array.js';

import { dirname} from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('convertExcelToModuleDataArray tests', async () => {
  const _moduleDataArray = await convertExcelToModuleDataArray({excelInput: './assets/user_data.xlsx'});

  // loop array and find object with moduleName = "settings"
  const _settings = _moduleDataArray.find((item) => item.moduleName === 'settings');

  assert.deepStrictEqual(_settings?.moduleSourceLocation, "'[user_data.xlsx]settings'!R1C1",);
});
