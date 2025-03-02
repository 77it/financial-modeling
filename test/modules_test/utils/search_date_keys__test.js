import { searchDateKeys } from '../../../src/modules/_utils/search/search_date_keys.js';

import { SettingsDefaultValues as SETTINGS_DEFAULT_VALUES } from '../../../src/config/settings_default_values.js';
import { Simulation as SETTINGS_NAMES } from '../../../src/config/settings_names.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

t('searchDateKeys test', async () => {
  {  // test SETTINGS_NAMES.Simulation.$$SIMULATION_COLUMN_PREFIX
    const obj = {
      'F2023-12-25T05:20:10': 1,  // time part is stripped
      b: 2,  // ignored, not starting with prefix
      99: 2,  // ignored, not starting with prefix
      'f2023/01/29': 3,  // lowercase works
      'f2023/01/XX': 3,  // ignored, not parsable as a date
    };

    const exp = [
      { key: 'f2023/01/29', date: new Date(2023, 0, 29) },
      { key: 'F2023-12-25T05:20:10', date: new Date(2023, 11, 25) },
    ];

    assert.deepStrictEqual(searchDateKeys({ obj, prefix: SETTINGS_DEFAULT_VALUES[SETTINGS_NAMES.$$SIMULATION_COLUMN_PREFIX] }), exp);
  }

  {  // test without prefix, passing a map instead of object
    //@ts-ignore   otherwise the Map init returns a type error
    const obj = new Map([
      ['2023-12-25T05:20:10', 1],  // time part is stripped
      ['b', 2],  // ignored, not starting with prefix
      [99, 2],  // ignored, not starting with prefix
      ['20241231', 4],
      ['2023/01/29', 3],
      ['2023/01/XX', 3],  // ignored, not parsable as a date
    ]);

    const exp = [
      { key: '2023/01/29', date: new Date(2023, 0, 29) },
      { key: '2023-12-25T05:20:10', date: new Date(2023, 11, 25) },
      { key: '20241231', date: new Date(2024, 11, 31) },
    ];

    assert.deepStrictEqual(searchDateKeys({ obj, prefix: [''] }), exp);
  }

  {  // test $$HISTORICAL_COLUMN_PREFIX (also case insensitive detection of the prefix)
    const obj = {
      'h2023-12-25': 1,
      b: 2,  // ignored, not parsable as a date
      99: 2,  // ignored, not parsable as a date
      'H2023/01/29': 3,
      '2023/01/30': 3, // allows also dates without prefix
      'H2023/01/XX': 3,  // ignored, not parsable as a date
    };

    const exp = [
      { key: 'H2023/01/29', date: new Date(2023, 0, 29) },
      { key: '2023/01/30', date: new Date(2023, 0, 30) },
      { key: 'h2023-12-25', date: new Date(2023, 11, 25) },  // case insensitive detection of the prefix
    ];

    assert.deepStrictEqual(searchDateKeys({ obj: obj, prefix: SETTINGS_DEFAULT_VALUES[SETTINGS_NAMES.$$HISTORICAL_COLUMN_PREFIX] }), exp);
  }
});
