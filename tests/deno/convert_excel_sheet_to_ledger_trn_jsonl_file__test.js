// run with `deno test --allow-read --allow-write --allow-net --allow-run THIS-FILE-NAME`

import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../deps.js';

import { convertExcelSheetToLedgerTrnJsonlFile } from '../../src/deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';
import { compareTwoTextFiles } from '../../src/deno/compare_two_text_files.js';

Deno.test('convertExcelToModuleDataArray tests', async () => {
  await convertExcelSheetToLedgerTrnJsonlFile({
    excelInput: './assets/ledger_transactions.xlsx',
    sheetName: 'DTO',
    jsonlOutput: './ledger_transactions.jsonl.tmp',
  });

  assert(compareTwoTextFiles('./ledger_transactions.jsonl.tmp','./assets/ledger_transactions.jsonl'));

  Deno.removeSync('./ledger_transactions.jsonl.tmp');
});
