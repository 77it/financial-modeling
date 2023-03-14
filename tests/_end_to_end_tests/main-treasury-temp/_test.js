// run with --allow-read --allow-write --allow-net --allow-run

//#region settings
const OPTIONS = {};
OPTIONS.FILES = {}
OPTIONS.FILES.CONVERTER2_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter2.exe.gz';
OPTIONS.FILES.CONVERTER2_EXEGZ_PATH = './converter2.exe';
//#endregion settings

import { downloadAndDecompressGzip } from '../../../src/deno/downloadAndDecompressGzip.js';
import { existSync } from '../../../src/deno/existSync.js';

import {main} from '../../../src/main-treasury-temp.js';

import {assert, assertFalse, assertEquals, assertNotEquals} from '../../deps.js';

const DEBUG_FLAG = true;

Deno.test('main-treasury-temp tests', async () => {
  Deno.chdir(new URL('.', import.meta.url));  // set cwd/current working directory to current folder (the folder of this file)
  if (!existSync(OPTIONS.FILES.CONVERTER2_EXEGZ_PATH))
    await downloadAndDecompressGzip(
      { url: OPTIONS.FILES.CONVERTER2_EXEGZ_URL, path: OPTIONS.FILES.CONVERTER2_EXEGZ_PATH });

  await main({excelUserInput: './user_data.xlsx', outputFolder: '.', errors: './errors.txt', debug: DEBUG_FLAG});

  /* TODO NOW
engine.js
  vedi codice

i moduli
  * alla prima chiamata elaborano la tabella di input
  * ogni giorno: elaborano i nuovi `SimObjects`
  * ogni giorno: interrogano i vecchi `SimObjects` su Ledger per vedere se è giunto il tempo di scaricarli

  MODULE modules/new_credits_and_debits.js
  Oggetti JSON5 toUpperCase() prima di parse.
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
});
