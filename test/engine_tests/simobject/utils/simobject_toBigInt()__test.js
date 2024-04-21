import { toBigInt } from '../../../../src/engine/simobject/utils/simobject_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

const decimalPlaces = 4;
const roundingModeIsRound = true;

t('toBigInt() tests', async () => {
  assert.deepStrictEqual(toBigInt(19, decimalPlaces, roundingModeIsRound), 190000n);
  assert.deepStrictEqual(toBigInt(19.1, decimalPlaces, roundingModeIsRound), 191000n);
  assert.deepStrictEqual(toBigInt(19.1234, decimalPlaces, roundingModeIsRound), 191234n);
  assert.deepStrictEqual(toBigInt(19.12345, decimalPlaces, roundingModeIsRound), 191234n);
  assert.deepStrictEqual(toBigInt(19.123456, decimalPlaces, roundingModeIsRound), 191235n);
  assert.deepStrictEqual(toBigInt(19.12344000001, decimalPlaces, roundingModeIsRound), 191234n);
});
