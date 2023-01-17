// run with --allow-read --allow-write --allow-net --allow-run

//#region settings
const OPTIONS = {};
OPTIONS.FILES = {}
OPTIONS.FILES.CONVERTER2_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v1.0.6/Converter2.exe.gz';
OPTIONS.FILES.CONVERTER2_EXEGZ_PATH = './converter2.exe';
//#endregion settings

import { downloadAndDecompressGzip } from '../../../src/deno/downloadAndDecompressGzip.js';
import { existSync } from '../../../src/deno/existSync.js';

import {main} from '../../../src/main-treasury-temp2.js';

import {assert, assertFalse, assertEquals, assertNotEquals} from '../../deps.js';

Deno.test('main-treasury-temp tests', async () => {
  if (!existSync(OPTIONS.FILES.CONVERTER2_EXEGZ_PATH))
    await downloadAndDecompressGzip(
      { url: OPTIONS.FILES.CONVERTER2_EXEGZ_URL, path: OPTIONS.FILES.CONVERTER2_EXEGZ_PATH });

  await main({input: './user_data.xlsx', output: './user_data.jsonl.tmp', errors: './errors.txt'});

  /*
main-treasury-temp.js
    * chiama engine.js passando modulesData[]

engine.js
    inizializza `simulation context` che contiene:
    * `Ledger`
    inizializza `moduleRunner` passando `simulation context`

moduleRunner
    inizializza al suo interno
    * Drivers
    * Contants
    chiama giorno per giorno i moduli

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

  console.log('done test');
});
