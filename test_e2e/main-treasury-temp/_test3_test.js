// run with --allow-read --allow-write --allow-net --allow-run

import { existsSync } from '../../src/node/exists_sync.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { main } from '../../src/main-treasury-temp.js';

import { convertExcelSheetToLedgerTrnJsonlFile } from '../../test_deno/deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';

import { DEBUG_FLAG, ERROR_FILE } from './_test_settings.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

if (existsSync(ERROR_FILE)) {
  fs.unlinkSync(ERROR_FILE);
}

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
    fs.readFileSync(`./${JSONL_OUTPUT}`, 'utf8'),
    fs.readFileSync(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`, 'utf8'));

  fs.unlinkSync(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`);
});
