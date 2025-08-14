// run with test --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { existsSync } from '../deps.js';
import { deleteFile } from '../deps.js';
import { convertExcelToJsonlFile } from '../deps.js';
import { dirname } from 'node:path';
import { resolve } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE, SIMULATION_JSONL_OUTPUT } from '../_test_settings.js';

import { DRIVER_PREFIXES__ZERO_IF_NOT_SET } from '../../../src/config/globals.js';
import { PYTHON_FORECAST_GLOBAL_INSTANCE } from '../../../src/config/python.js';
import { SettingsDefaultValues } from '../../../src/settings_default_values.js';
import { Simulation as SimulationSettingNames } from '../../../src/config/settings_names.js';

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

t('engine_cfg_global_variables_set', async () => {
  await main({
    excelUserInput: excelInput,
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  if (existsSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  console.log(`DRIVER_PREFIXES__ZERO_IF_NOT_SET: ${DRIVER_PREFIXES__ZERO_IF_NOT_SET.get()}`);
  assert.deepStrictEqual(
    DRIVER_PREFIXES__ZERO_IF_NOT_SET.get(),
    SettingsDefaultValues[SimulationSettingNames.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET]);

  console.log(`PYTHON_FORECAST_GLOBAL_INSTANCE.isSet(): ${PYTHON_FORECAST_GLOBAL_INSTANCE.isSet()}`);
  assert(!PYTHON_FORECAST_GLOBAL_INSTANCE.isSet());
});
