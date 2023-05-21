// run with --allow-read --allow-write --allow-net --allow-run

import { existSync } from '../../../src/deno/exist_sync.js';

import { main } from '../../../src/main-treasury-temp.js';

import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { convertExcelSheetToLedgerTrnJsonlFile } from '../../../src/deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';

const DEBUG_FLAG = true;

const ERROR_FILE = './errors.txt';
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

Deno.test('main-treasury-temp tests with ./user_data.xlsx', async () => {
  const BASE_TEST_FILENAME = 'user_data';
  const JSONL_OUTPUT = 'a.jsonl';

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

  /* TODO NOW
engine.js
  vedi codice

i moduli
  * alla prima chiamata elaborano la tabella di input
  * ogni giorno: elaborano i nuovi `SimObjects`
  * ogni giorno: interrogano i vecchi `SimObjects` su Ledger per vedere se è giunto il tempo di scaricarli

  MODULE modules/new_credits_and_debits.js
  per dividere crediti e debiti con piani di ammortamento preesistenti, poiché non tutti i piani nascono il 31.12.XXXX (o il 1/1/XXXX+1), dobbiamo rigenerare le date del piano dall'inizio, e ripartire con il calcolo della rata dalla data precedente a quella in cui comincia la dilazione del debito, per vedere la prossima rata quando sarà.
  Esempio:
  debito al 31/12/2022: 90.000 euro; inizio piano 15/11/2020, rata semestrale. Si rigenerano le date, si vede che la rata successiva al 31/12/2022 è il 15/05/2023, si genera il piano da quella data per la durata residua.

Ledger
  * accetta transazioni
  * salva i `SimObjects`
  * fa un dump dei `SimObjects` dopo ogni transazione
   */

  // TODO use Converter2.exe [1] `excel-sheet-to-jsonl-ledger-trn` to read expected DTO, compare then end test
  // [1] OPTIONS.FILES.CONVERTER2_EXEGZ_PATH

console.log('done test');
