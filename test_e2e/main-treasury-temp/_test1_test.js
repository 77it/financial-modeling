// run with --allow-read --allow-write --allow-net --allow-run --allow-env

import { readUtf8TextFileRemovingBOM } from '../../src/node/read_utf8_text_file_removing_bom.js';
import { deleteFile } from '../../src/node/delete_file.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { main } from '../../src/main-treasury-temp.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

import { DEBUG_FLAG, ERROR_FILE } from './_test_settings.js';

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('main-treasury-temp tests with ./user_data__non_existent_module.xlsx', async () => {
  await main({
    excelUserInput: './user_data__non_existent_module.xlsx',
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
