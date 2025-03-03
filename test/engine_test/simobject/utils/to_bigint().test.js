import { toBigInt } from '../../../../src/engine/simobject/utils/to_bigint.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('toBigInt() tests', () => {
  const roundingModeIsRound = true;
  let decimalPlaces = 4;

  assert.deepStrictEqual(toBigInt(19, decimalPlaces, roundingModeIsRound), 190000n);
  assert.deepStrictEqual(toBigInt(19.1, decimalPlaces, roundingModeIsRound), 191000n);
  assert.deepStrictEqual(toBigInt(19.1234, decimalPlaces, roundingModeIsRound), 191234n);
  assert.deepStrictEqual(toBigInt(19.12345, decimalPlaces, roundingModeIsRound), 191235n);
  assert.deepStrictEqual(toBigInt(19.123456, decimalPlaces, roundingModeIsRound), 191235n);
  assert.deepStrictEqual(toBigInt(19.12344000001, decimalPlaces, roundingModeIsRound), 191234n);

  // test that the conversion is correct for negative and positive numbers
  decimalPlaces = 2;
  assert.deepStrictEqual(toBigInt(10.075, decimalPlaces, roundingModeIsRound), 1008n);
  assert.deepStrictEqual(toBigInt(-10.075, decimalPlaces, roundingModeIsRound), -1008n);
  decimalPlaces = 0;
  assert.deepStrictEqual(toBigInt(1.4, decimalPlaces, roundingModeIsRound), 1n);
  assert.deepStrictEqual(toBigInt(1.5, decimalPlaces, roundingModeIsRound), 2n);
  assert.deepStrictEqual(toBigInt(2.4, decimalPlaces, roundingModeIsRound), 2n);
  assert.deepStrictEqual(toBigInt(2.5, decimalPlaces, roundingModeIsRound), 3n);
  assert.deepStrictEqual(toBigInt(-1.4, decimalPlaces, roundingModeIsRound), -1n);
  assert.deepStrictEqual(toBigInt(-1.5, decimalPlaces, roundingModeIsRound), -2n);
  assert.deepStrictEqual(toBigInt(-2.4, decimalPlaces, roundingModeIsRound), -2n);
  assert.deepStrictEqual(toBigInt(-2.5, decimalPlaces, roundingModeIsRound), -3n);
});
