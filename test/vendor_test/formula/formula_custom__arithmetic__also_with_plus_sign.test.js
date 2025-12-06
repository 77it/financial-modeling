// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_v5_eval2cached_x.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const functions = {
  undefined: () => undefined,
  null: () => null,
  date: () => new Date(1,1,1)
};

t('array computations with many complex values', () => {
  // 1 + undefined * 2 + null + 5 + "" * 9 + "" + 3
  assert.deepStrictEqual(new Parser('1 + undefined() * 2 + null() + 5 + "" * 9 + "" + 3 + date()', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(1 + 0 * 2 + 0 + 5 + 0 * 9 + 0 + 3 + functions.date().getTime()));
});

t("arithmetics with decimal won't have javascript number problems with decimals", () => {
  assert.deepStrictEqual(1.005 * 1000, 1004.9999999999999);
  assert.deepStrictEqual(new Parser('1.005 * 1000').evaluate(), convertWhenFmlEvalRequiresIt(1005));
});

t('arithmetics with numbers with explicit + sign and double operations', () => {
  assert.deepStrictEqual(new Parser('-10 / +2').evaluate(), convertWhenFmlEvalRequiresIt(-5));
  assert.deepStrictEqual(new Parser('-10 * +2').evaluate(), convertWhenFmlEvalRequiresIt(-20));
  assert.deepStrictEqual(new Parser('+10 / 2').evaluate(), convertWhenFmlEvalRequiresIt(5));
  assert.deepStrictEqual(new Parser('+10 * 2').evaluate(), convertWhenFmlEvalRequiresIt(20));
  assert.deepStrictEqual(new Parser('5 * +2').evaluate(), convertWhenFmlEvalRequiresIt(10));
  assert.deepStrictEqual(new Parser('10 / +2').evaluate(), convertWhenFmlEvalRequiresIt(5));
  assert.deepStrictEqual(new Parser('5 + + 10').evaluate(), convertWhenFmlEvalRequiresIt(15));
  assert.deepStrictEqual(new Parser('5 + - 10').evaluate(), convertWhenFmlEvalRequiresIt(-5));
  assert.deepStrictEqual(new Parser('5 + - -10').evaluate(), convertWhenFmlEvalRequiresIt(15));
  assert.deepStrictEqual(new Parser('5 - + 10').evaluate(), convertWhenFmlEvalRequiresIt(-5));
  assert.deepStrictEqual(new Parser('5 - + -10').evaluate(), convertWhenFmlEvalRequiresIt(15));
  assert.deepStrictEqual(new Parser('5 - - 10').evaluate(), convertWhenFmlEvalRequiresIt(15));
  assert.deepStrictEqual(new Parser('5 - - -10').evaluate(), convertWhenFmlEvalRequiresIt(-5));
});

