// run with: test --allow-read --allow-write --allow-net --allow-run --allow-env --allow-import

import { main } from '../deps.js';

import { eqObj, existsSync, deleteFile, sanitize, parseYAML } from '../deps.js';
import { convertExcelToJsonlFile } from '../deps.js';
import { dirname } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';

import { DEBUG_FLAG, ERROR_FILE, SIMULATION_JSONL_OUTPUT } from '../_test_settings.js';

import { SettingsSchemas } from '../../../src/config/settings.schemas.js';
import { Simulation } from '../../../src/config/settings_names.js';

import { _TEST_ONLY__simulationContext } from '../../../src/engine/engine.js';
// used as type
import { SimulationContext as _SimulationContext } from '../../../src/engine/context/simulationcontext.js';

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

  if (existsSync(ERROR_FILE)) throw new Error(`Error file ${ERROR_FILE} should not exist`);

  /** @type {_SimulationContext} */
  const _simulationContext = _TEST_ONLY__simulationContext.get();

  // get unsanitized settings from Simulation Context
  const unsanitized_setting_1 = _simulationContext.getSetting({ name: '$$UNSANITIZED_SETTING' });
  const unsanitized_setting_2 = _simulationContext.getSetting({ name: '$$UNSANITIZED_SETTING2' });
  console.log(`unsanitized_setting_1: ${unsanitized_setting_1}`);
  console.log(`unsanitized_setting_2: ${unsanitized_setting_2}`);
  assert.deepStrictEqual(unsanitized_setting_1, 'mamma');
  assert.deepStrictEqual(unsanitized_setting_2, 'mamma 2');

  // get settings sanitized to string from Simulation Context
  const currency_sanitized_to_string = _simulationContext.getSetting({ name: '$$CURRENCY' });
  console.log(`currency_sanitized_to_string: ${currency_sanitized_to_string}`);
  assert.deepStrictEqual(currency_sanitized_to_string, '999');
  assert.notDeepStrictEqual(currency_sanitized_to_string, 999);

  // get settings sanitized to YAML from Simulation Context
  const setting_to_yaml = _simulationContext.getSetting({ name: '__TEST_ONLY__YAML_PARSE_AND_VALIDATION_TEST' });
  console.log(`setting_to_yaml: ${JSON.stringify(setting_to_yaml)}`);
  assert(eqObj(setting_to_yaml, { mamma: 'ines', babbo: 0 }));

  // get Active Metadata from Simulation Context
  const active_metadata = _simulationContext.getSetting({ name: 'ACTIVE_METADATA' });
  console.log(`ACTIVE_METADATA: ${JSON.stringify(active_metadata)}`);
  assert.deepStrictEqual(active_metadata, { name: ['AA', 'AAA'], value: ['BB', 'BBB'], weight: [0.5, 0.6] });

  deleteFile(`./${SIMULATION_JSONL_OUTPUT}`);
});

t('SettingsSchemas.Simulation.ACTIVE_METADATA sanitization test', async () => {
  const sanitization = SettingsSchemas[Simulation.ACTIVE_METADATA];

  const test_pairs = [
    { actual: '{ name: [AA, AAA], value: [BB, 888], weight: [0.5, 0.6] }', expected: { name: ['AA', 'AAA'], value: ['BB', '888'], weight: [0.5, 0.6] } },
    { actual: null, expected: { name: [], value: [], weight: [] } },
    { actual: undefined, expected: { name: [], value: [], weight: [] } },
    { actual: " ", expected: { name: [], value: [], weight: [] } },
    { actual: "mamma", expected: { name: [], value: [], weight: [] } },
    { actual: '{ name: c/c, value: bank, weight: 0.2}', expected: { name: ['c/c'], value: ['bank'], weight: [0.2] } },
  ];

  for (const { actual, expected } of test_pairs) {
    assert.deepStrictEqual(
      sanitize({ value: parseYAML(actual), sanitization, validate: true }),
      expected
    );
  }
});
