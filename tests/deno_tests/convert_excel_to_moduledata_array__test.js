// run with `deno test --allow-read --allow-write --allow-net --allow-run THIS-FILE-NAME`

import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../deps.js';

import { convertExcelToModuleDataArray } from '../../src/deno/convert_excel_to_moduledata_array.js';

Deno.chdir(new URL('.', import.meta.url));  // set cwd/current working directory to current folder (the folder of this file)

Deno.test('convertExcelToModuleDataArray tests', async () => {
  const _moduleDataArray = await convertExcelToModuleDataArray({excelInput: './assets/user_data.xlsx'});

  // loop array and find object with moduleName = "settings"
  const _settings = _moduleDataArray.find((item) => item.moduleName === 'settings');

  assertEquals(_settings?.moduleSourceLocation, "'[user_data.xlsx]settings'!R1C1",);
});
