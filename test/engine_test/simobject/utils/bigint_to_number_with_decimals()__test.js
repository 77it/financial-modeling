import { bigIntToNumberWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_number_with_decimals.js';
import { bigIntToStringWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_string_with_decimals.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

t('bigIntToNumberWithDecimals() tests, using bigIntToStringWithDecimals() to check for correctness', () => {
  // loop from 1 to 100.000 bigint
  for (let i = 1n; i <= 100000n; i++) {
    const number = bigIntToNumberWithDecimals(i, 4);
    const string = bigIntToStringWithDecimals(i, 4);
    assert.deepStrictEqual(number, parseFloat(string));
  }
});
