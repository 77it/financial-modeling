// run with --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { deleteFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE } from '../_test_settings.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('engine test with deno deploy (calling online function)', async () => {
  assert.deepStrictEqual(1, 0);
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
