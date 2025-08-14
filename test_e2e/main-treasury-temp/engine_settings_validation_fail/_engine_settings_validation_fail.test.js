// run with: test --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main, readUtf8TextFileRemovingBOM } from '../deps.js';

import { deleteFile } from '../deps.js';
import { convertExcelToJsonlFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE, SIMULATION_JSONL_OUTPUT } from '../_test_settings.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

// Excel file with test data
const BASE_TEST_FILENAME = 'data';
const excelInput = `./${BASE_TEST_FILENAME}.xlsx`;

// convert Excel to JSONL for backup and versioning purpose
const jsonlOutput = `./${BASE_TEST_FILENAME}.dump.jsonl`;
deleteFile(jsonlOutput);
await convertExcelToJsonlFile({ excelInput, jsonlOutput });

t('engine_settings_sanitization_set', async () => {
  await main({
    excelUserInput: excelInput,
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  const _errors = readUtf8TextFileRemovingBOM(ERROR_FILE);
  //console.log(_errors);

  assert(_errors.includes(`Error: Validation error: ["[{\\"name\\":[\\"AA\\",\\"AAA\\"],\\"value\\":[\\"BB\\",\\"BBB\\"],\\"weight\\":[0.5,0.6]}] is an array and not an object"]`));

  // reset exit code to prevent failure of test under node.js
  process.exitCode = 0;
});
