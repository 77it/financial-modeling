// run with --allow-read --allow-write --allow-net --allow-run

import { existSync } from '../../../src/deno/exist_sync.js';

import { main } from '../../../src/main-treasury-temp.js';

import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { convertExcelSheetToLedgerTrnJsonlFile } from '../../../src/deno/convert_excel_sheet_to_ledger_trn_jsonl_file.js';

import { DEBUG_FLAG, ERROR_FILE } from './_test_settings.js';

if (existSync(ERROR_FILE)) Deno.removeSync(ERROR_FILE);

Deno.chdir(new URL('.', import.meta.url));  // set cwd/current working directory to current folder (the folder of this file)

Deno.test('engine test with deno deploy (calling online function)', async () => {
  assertEquals(1, 0);
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
