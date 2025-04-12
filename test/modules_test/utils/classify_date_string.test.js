// test with deno test --allow-import

import { classifyDateString, DATE_CLASSIFICATION } from '../../../src/modules/_utils/search/classify_date_string.js';

import { SettingsDefaultValues as SETTINGS_DEFAULT_VALUES } from '../../../src/config/settings_default_values.js';
import { Simulation as SETTINGS_NAMES } from '../../../src/config/settings_names.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('classifyDateString test', async () => {
  const simulationPrefix = SETTINGS_DEFAULT_VALUES[SETTINGS_NAMES.$$SIMULATION_COLUMN_PREFIX];
  const historicalPrefix = SETTINGS_DEFAULT_VALUES[SETTINGS_NAMES.$$HISTORICAL_COLUMN_PREFIX];
  const arrayWithEmptyStringPrefix = [''];
  let dateString;
  let exp;

  {  // test SETTINGS_NAMES.Simulation.$$SIMULATION_COLUMN_PREFIX (array that contains 'F')

    // time part is stripped
    dateString = 'F2023-12-25T05:20:10';
    exp = { classification: DATE_CLASSIFICATION.SIMULATION, date: new Date(2023, 11, 25) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // lowercase works
    dateString = 'f2023/01/29';
    exp = { classification: DATE_CLASSIFICATION.SIMULATION, date: new Date(2023, 0, 29) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // not parsable as a date
    dateString = 'f2023/01/XX';
    exp = { classification: DATE_CLASSIFICATION.INVALID, date: undefined };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // not starting with prefix, matches Historical
    dateString = '2023/01/29';
    exp = { classification: DATE_CLASSIFICATION.HISTORICAL, date: new Date(2023, 0, 29) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);
  }

  {  // test without prefix

    // time part is stripped
    dateString = '2023-12-25T05:20:10';
    exp = { classification: DATE_CLASSIFICATION.SIMULATION, date: new Date(2023, 11, 25) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: arrayWithEmptyStringPrefix, historicalPrefix: historicalPrefix }), exp);

    // works date without separators
    dateString = '20241231';
    exp = { classification: DATE_CLASSIFICATION.SIMULATION, date: new Date(2024, 11, 31) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: arrayWithEmptyStringPrefix, historicalPrefix: historicalPrefix }), exp);

    // works date with / separators
    dateString = '2023/01/29';
    exp = { classification: DATE_CLASSIFICATION.SIMULATION, date: new Date(2023, 0, 29) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: arrayWithEmptyStringPrefix, historicalPrefix: historicalPrefix }), exp);

    // works date with . separators
    dateString = '2023.01.29';
    exp = { classification: DATE_CLASSIFICATION.SIMULATION, date: new Date(2023, 0, 29) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: arrayWithEmptyStringPrefix, historicalPrefix: historicalPrefix }), exp);

    // not parsable as a date
    dateString = 99;
    exp = { classification: DATE_CLASSIFICATION.INVALID, date: undefined };
    //@ts-ignore assigning a number where a string is expected
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: arrayWithEmptyStringPrefix, historicalPrefix: historicalPrefix }), exp);

    // not parsable as a date
    dateString = '2023/01/XX';
    exp = { classification: DATE_CLASSIFICATION.INVALID, date: undefined };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: arrayWithEmptyStringPrefix, historicalPrefix: historicalPrefix }), exp);
  }

  {  // test $$HISTORICAL_COLUMN_PREFIX (array that contains 'H' and an empty string/prefix)

    // works date with - separators, lowercase prefix
    dateString = 'h2023-12-25';
    exp = { classification: DATE_CLASSIFICATION.HISTORICAL, date: new Date(2023, 11, 25) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // works date with - separators, uppercase prefix
    dateString = 'H2023/01/29';
    exp = { classification: DATE_CLASSIFICATION.HISTORICAL, date: new Date(2023, 0, 29) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // historical prefix is an array containing also an empty string, then a date without prefix is recognized
    dateString = '2023/01/30';
    exp = { classification: DATE_CLASSIFICATION.HISTORICAL, date: new Date(2023, 0, 30) };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // not parsable as a date
    dateString = 99;
    exp = { classification: DATE_CLASSIFICATION.INVALID, date: undefined };
    //@ts-ignore assigning a number where a string is expected
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // not parsable as a date
    dateString = '2023/01/XX';
    exp = { classification: DATE_CLASSIFICATION.INVALID, date: undefined };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);

    // right prefix, not parsable as a date
    dateString = 'H2023/01/XX';
    exp = { classification: DATE_CLASSIFICATION.INVALID, date: undefined };
    assert.deepStrictEqual(classifyDateString({ dateString: dateString, simulationPrefix: simulationPrefix, historicalPrefix: historicalPrefix }), exp);
  }
});
