// run with --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { readUtf8TextFileRemovingBOM } from '../deps.js';
import { deleteFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

import { DEBUG_FLAG, ERROR_FILE } from '../_test_settings.js';

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('main-treasury-temp tests with `user_data__non_existent_module.xlsx`', async () => {
  await main({
    excelUserInput: './data.xlsx',
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  const _errors = readUtf8TextFileRemovingBOM(ERROR_FILE);
  //console.log(_errors);

  assert(_errors.includes(`error loading module`));
  assert(_errors.includes(`xxxyyy99___non_existent_module__888_missingmissing`));
  assert.deepStrictEqual(process.exitCode, 1);

  // reset exit code to prevent failure of test under node.js
  process.exitCode = 0;
});
