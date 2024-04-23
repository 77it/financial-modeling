// run with --allow-read --allow-write --allow-net --allow-run

import { readUtf8TextFileRemovingBOM } from '../../src/node/read_utf8_text_file_removing_bom.js';
import { existsSync } from '../../src/node/exists_sync.js';
import { deleteFile } from '../../src/node/delete_file.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { main } from '../../src/main-treasury-temp.js';

import { convertExcelSheetToLedgerTrnJsonlFile } from '../utils/convert_excel_sheet_to_ledger_trn_jsonl_file.js';

import { DEBUG_FLAG, ERROR_FILE } from './_test_settings.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('main-treasury-temp tests with ./user_data.xlsx', async () => {
  const BASE_TEST_FILENAME = 'user_data';
  const JSONL_OUTPUT = 'a.jsonl';

  await main({
    excelUserInput: `./${BASE_TEST_FILENAME}.xlsx`,
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  if (existsSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  await convertExcelSheetToLedgerTrnJsonlFile({
    excelInput: `./${BASE_TEST_FILENAME}__expected_trn.xlsx`,
    sheetName: 'DTO',
    jsonlOutput: `./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`,
  });

  assert.deepStrictEqual(
    readUtf8TextFileRemovingBOM(`./${JSONL_OUTPUT}`),
    readUtf8TextFileRemovingBOM(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`));

  deleteFile(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`);
});
