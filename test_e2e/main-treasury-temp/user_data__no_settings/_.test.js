// run with --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { readUtf8TextFileRemovingBOM } from '../deps.js';
import { existsSync } from '../deps.js';
import { deleteFile } from '../deps.js';
import { renameFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { convertExcelSheetToLedgerTrnJsonlFile } from '../deps.js';

import { DEBUG_FLAG, ERROR_FILE } from '../_test_settings.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('main-treasury-temp tests with `user_data__no_settings`', async () => {
  const BASE_TEST_FILENAME = 'data';
  const JSONL_OUTPUT = 'base.jsonl';
  const JSONL_OUTPUT_TMP = 'base.jsonl.tmp';

  await main({
    excelUserInput: `./${BASE_TEST_FILENAME}.xlsx`,
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  renameFile(`./${JSONL_OUTPUT}`, `./${JSONL_OUTPUT_TMP}`);

  if (existsSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  await convertExcelSheetToLedgerTrnJsonlFile({
    excelInput: `./${BASE_TEST_FILENAME}__expected_trn.xlsx`,
    sheetName: 'DTO',
    jsonlOutput: `./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`,
  });

  assert.deepStrictEqual(
    readUtf8TextFileRemovingBOM(`./${JSONL_OUTPUT_TMP}`),
    readUtf8TextFileRemovingBOM(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`));

  deleteFile(`./${JSONL_OUTPUT_TMP}`);
  deleteFile(`./${BASE_TEST_FILENAME}__expected_trn.jsonl.tmp`);
});
