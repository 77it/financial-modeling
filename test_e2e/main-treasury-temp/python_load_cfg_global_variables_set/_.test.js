// run with: test --allow-import --allow-read --allow-write --allow-env

import { main } from '../deps.js';

import { existsSync } from '../deps.js';
import { deleteFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE, SIMULATION_JSONL_OUTPUT } from '../_test_settings.js';

//import { simulationContext } from '../../../src/engine/engine.js';
//import { SimulationContext } from '../../../src/engine/context/simulationcontext.js';
import { PYTHON_FORECAST_GLOBAL_INSTANCE } from '../../../src/config/python.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('python_load_cfg_global_variables_set', async () => {
  const BASE_TEST_FILENAME = 'data';

  await main({
    excelUserInput: `./${BASE_TEST_FILENAME}.xlsx`,
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  if (existsSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  console.log(`PYTHON_FORECAST_GLOBAL_INSTANCE.isSet(): ${PYTHON_FORECAST_GLOBAL_INSTANCE.isSet()}`);
  assert(PYTHON_FORECAST_GLOBAL_INSTANCE.isSet());

  //#region run PYTHON_FORECAST_GLOBAL_INSTANCE global variable, N times
  const months = Array.from({ length: 24 }, (_, i) => i + 1);  // [1,2,3,...,24]
  const values = [
    8.9,8.1,6.95,9,10.1,11.2,12.8,9,10.1,10.2,10.99,13,
    10,9,8,10,11,12,14,10,11,11,12,14];

  // loop to show the speed of the Python function
  for (let i = 0; i < 3; i++) {
    const result = await PYTHON_FORECAST_GLOBAL_INSTANCE.get()(months, values);
  }

  // read and test answer (get the mehod from a Global variable)
  const result = await PYTHON_FORECAST_GLOBAL_INSTANCE.get()(months, values);
  assert(result.dates.length === 12);
  assert(result.mean.length === 12);

  //#endregion run PYTHON_FORECAST_GLOBAL_INSTANCE global variable, N times

  deleteFile(`./${SIMULATION_JSONL_OUTPUT}`);
});
