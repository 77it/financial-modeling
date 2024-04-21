// run with --allow-read --allow-write --allow-net --allow-run --allow-env

import { convertExcelSheetToLedgerTrnJsonlFile } from '../deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';

import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('convertExcelSheetToLedgerTrnJsonlFile tests', async () => {
  await convertExcelSheetToLedgerTrnJsonlFile({
    excelInput: './assets/ledger_transactions.xlsx',
    sheetName: 'DTO',
    jsonlOutput: './ledger_transactions.jsonl.tmp',
  });

  assert.deepStrictEqual(
    fs.readFileSync('./ledger_transactions.jsonl.tmp', 'utf8'),
    fs.readFileSync('./assets/ledger_transactions.jsonl', 'utf8'));

  fs.unlinkSync('./ledger_transactions.jsonl.tmp');
});
