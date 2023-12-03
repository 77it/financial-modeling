// run with --allow-read --allow-write --allow-net --allow-run

import { existSync } from '../../../src/deno/exist_sync.js';

import { main } from '../../../src/main-treasury-temp.js';

import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { convertExcelSheetToLedgerTrnJsonlFile } from '../../deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';

import { DEBUG_FLAG, ERROR_FILE } from './_test_settings.js';

if (existSync(ERROR_FILE)) Deno.removeSync(ERROR_FILE);

Deno.chdir(new URL('.', import.meta.url));  // set cwd/current working directory to current folder (the folder of this file)

Deno.test('main-treasury-temp tests with ./user_data__no_settings.xlsx', async () => {
  const BASE_TEST_FILENAME = 'user_data__no_settings';
  const JSONL_OUTPUT = 'base.jsonl';

  await main({
    excelUserInput: `./${BASE_TEST_FILENAME}.xlsx`, outputFolder: '.', errors: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG, ledgerDebugFlag: DEBUG_FLAG, continueExecutionAfterSimulationDebugFlag: DEBUG_FLAG
  });

  if (existSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  await convertExcelSheetToLedgerTrnJsonlFile({
    excelInput: `./${BASE_TEST_FILENAME}__expected_trn.xlsx`,
    sheetName: 'DTO',
    jsonlOutput: `./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`,
  });

  assertEquals(Deno.readTextFileSync(`./${JSONL_OUTPUT}`), Deno.readTextFileSync(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`));

  Deno.removeSync(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`);
});
