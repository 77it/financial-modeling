// file bigint_decimal_scaled.finance.test.js

// fxPmt test taken from https://github.com/lmammino/financial/tree/9f1eef08b7f57d4082f9a13f2bc0ea745aea54b4/test
//
// 'calculates float when is end' test is updated to greater precision

import { fxPmt, FXPMT_PAYMENT_DUE_TIME } from '../../src/lib/bigint_decimal_scaled.finance.js';
import { numberToBigIntScaled, _TEST_ONLY__reset } from '../../src/lib/bigint_decimal_scaled.arithmetic_x.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

_TEST_ONLY__reset();

t('pmt()', () => {
  assert.deepStrictEqual(fxPmt(0.075 / 12, 12 * 15, 200000), numberToBigIntScaled(-1854.0247200054619))
})

t('calculates float when is end', () => {
  assert.deepStrictEqual(fxPmt(0.08 / 12, 5 * 12, 15000), numberToBigIntScaled(-304.1459143262))
})

t('calculates float when is begin', () => {
  assert.deepStrictEqual(
    fxPmt(0.08 / 12, 5 * 12, 15000, 0, FXPMT_PAYMENT_DUE_TIME.BEGIN),
    numberToBigIntScaled(-302.13170297305413),
  )
})

t('calculates float with rate 0', () => {
  assert.deepStrictEqual(fxPmt(0.0, 5 * 12, 15000), numberToBigIntScaled(-250))
})
