// run with test --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { existsSync } from '../deps.js';
import { deleteFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE, SIMULATION_JSONL_OUTPUT } from '../_test_settings.js';

//import { simulationContext } from '../../../src/engine/engine.js';
//import { SimulationContext } from '../../../src/engine/context/simulationcontext.js';
import { DRIVER_PREFIXES__ZERO_IF_NOT_SET } from '../../../src/config/globals.js';
import { PYTHON_FORECAST } from '../../../src/config/globals.js';
import { SettingsDefaultValues } from '../../../src/config/settings_default_values.js';
import { Simulation as SimulationSettingNames } from '../../../src/config/settings_names.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('engine_cfg_global_variables_set', async () => {
  const BASE_TEST_FILENAME = 'data';

  await main({
    excelUserInput: `./${BASE_TEST_FILENAME}.xlsx`,
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

  console.log(`PYTHON_FORECAST.isSet(): ${PYTHON_FORECAST.isSet()}`);
  assert(!PYTHON_FORECAST.isSet());

  deleteFile(`./${SIMULATION_JSONL_OUTPUT}`);
});
