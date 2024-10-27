// run with --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { existsSync } from '../deps.js';
import { deleteFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE, SIMULATION_JSONL_OUTPUT } from '../_test_settings.js';

//import { simulationContext } from '../../../src/engine/engine.js';
//import { SimulationContext } from '../../../src/engine/context/simulationcontext.js';
import { DRIVER_PREFIXES__ZERO_IF_NOT_SET } from '../../../src/config/engine.js';
import { SettingsDefaultValues } from '../../../src/config/settings_default_values.js';
import { Simulation as SimulationSettingNames } from '../../../src/config/settings_names.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('main-treasury-temp tests with `user_data__no_settings`', async () => {
  const BASE_TEST_FILENAME = 'data';

  await main({
    excelUserInput: `./${BASE_TEST_FILENAME}.xlsx`,
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  if (existsSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  assert.deepStrictEqual(
    DRIVER_PREFIXES__ZERO_IF_NOT_SET.get(),
    SettingsDefaultValues[SimulationSettingNames.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET]);

  deleteFile(`./${SIMULATION_JSONL_OUTPUT}`);
});
