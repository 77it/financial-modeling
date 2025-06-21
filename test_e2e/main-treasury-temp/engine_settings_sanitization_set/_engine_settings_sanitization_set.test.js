// run with: test --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { eqObj, existsSync, deleteFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE, SIMULATION_JSONL_OUTPUT } from '../_test_settings.js';

import { _TEST_ONLY__simulationContext } from '../../../src/engine/engine.js';
import { SimulationContext as _SimulationContext } from '../../../src/engine/context/simulationcontext.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

deleteFile(ERROR_FILE);

// set cwd/current working directory to current folder (the folder of this file)
chdir(dirname(fileURLToPath(import.meta.url)));

t('engine_settings_sanitization_set', async () => {
  const BASE_TEST_FILENAME = 'data';

  await main({
    excelUserInput: `./${BASE_TEST_FILENAME}.xlsx`,
    outputFolder: '.',
    errorsFilePath: ERROR_FILE,
    moduleResolverDebugFlag: DEBUG_FLAG,
    ledgerDebugFlag: DEBUG_FLAG
  });

  if (existsSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  /** @type {_SimulationContext} */
  const _simulationContext = _TEST_ONLY__simulationContext.get();

  // try to get unsanitized settings from Simulation Context
  const unsanitized_setting_1 = _simulationContext.getSetting({name: '$$UNSANITIZED_SETTING'});
  const unsanitized_setting_2 = _simulationContext.getSetting({name: '$$UNSANITIZED_SETTING2'});
  console.log(`unsanitized_setting_1: ${unsanitized_setting_1}`);
  console.log(`unsanitized_setting_2: ${unsanitized_setting_2}`);
  assert.deepStrictEqual(unsanitized_setting_1, 'mamma');
  assert.deepStrictEqual(unsanitized_setting_2, 'mamma 2');

  // try to get settings sanitized to string from Simulation Context
  const currency_sanitized_to_string = _simulationContext.getSetting({name: '$$CURRENCY'});
  console.log(`currency_sanitized_to_string: ${currency_sanitized_to_string}`);
  assert.deepStrictEqual(currency_sanitized_to_string, '999');
  assert.notDeepStrictEqual(currency_sanitized_to_string, 999);

  // try to get settings sanitized to YAML from Simulation Context
  const setting_to_yaml = _simulationContext.getSetting({name: '__TEST_ONLY__YAML_PARSE_AND_VALIDATION_TEST'});
  console.log(`setting_to_yaml: ${JSON.stringify(setting_to_yaml)}`);
  assert(eqObj(setting_to_yaml, { mamma: 'ines', babbo: 0 }));

  deleteFile(`./${SIMULATION_JSONL_OUTPUT}`);
});
