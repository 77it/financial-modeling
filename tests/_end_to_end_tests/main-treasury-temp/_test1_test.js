// run with --allow-read --allow-write --allow-net --allow-run

import { existSync } from '../../../src/deno/exist_sync.js';

import { main } from '../../../src/main-treasury-temp.js';

import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { convertExcelSheetToLedgerTrnJsonlFile } from '../../deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';

import { DEBUG_FLAG, ERROR_FILE } from './_test_settings.js';

if (existSync(ERROR_FILE)) Deno.removeSync(ERROR_FILE);

Deno.chdir(new URL('.', import.meta.url));  // set cwd/current working directory to current folder (the folder of this file)

Deno.test('main-treasury-temp tests with ./user_data__non_existent_module.xlsx', async () => {
  await main({
    excelUserInput: './user_data__non_existent_module.xlsx', outputFolder: '.', errors: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG, ledgerDebugFlag: DEBUG_FLAG, continueExecutionAfterSimulationDebugFlag: DEBUG_FLAG
  });

  const _errors = Deno.readTextFileSync(ERROR_FILE);
  //console.log(_errors);

  assert(_errors.includes(`error loading module`));
  assert(_errors.includes(`xxxyyy99___non_existent_module__888_missingmissing`));
});
