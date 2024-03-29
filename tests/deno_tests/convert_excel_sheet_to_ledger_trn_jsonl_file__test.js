// run with `deno test --allow-read --allow-write --allow-net --allow-run THIS-FILE-NAME`

import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../deps.js';

import { convertExcelSheetToLedgerTrnJsonlFile } from '../deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';
import { compareTwoTextFiles } from '../deno/compare_two_text_files.js';

Deno.chdir(new URL('.', import.meta.url));  // set cwd/current working directory to current folder (the folder of this file)

Deno.test('convertExcelSheetToLedgerTrnJsonlFile tests', async () => {
  await convertExcelSheetToLedgerTrnJsonlFile({
    excelInput: './assets/ledger_transactions.xlsx',
    sheetName: 'DTO',
    jsonlOutput: './ledger_transactions.jsonl.tmp',
  });

  assert(compareTwoTextFiles('./ledger_transactions.jsonl.tmp','./assets/ledger_transactions.jsonl'));

  Deno.removeSync('./ledger_transactions.jsonl.tmp');
});
