// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_yaml_as_func_par__v5.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('arithmetics with numbers: only v4 supports numbers with explicit + sign', () => {
  assert.deepStrictEqual(new Parser('+10 / 2').evaluate(), 5);
  assert.deepStrictEqual(new Parser('+10 * 2').evaluate(), 20);
  assert.deepStrictEqual(new Parser('5 * +2').evaluate(), 10);
  assert.deepStrictEqual(new Parser('10 / +2').evaluate(), 5);
  assert.deepStrictEqual(new Parser('5 + + 10').evaluate(), 15);
  assert.deepStrictEqual(new Parser('5 + - 10').evaluate(), -5);
  assert.deepStrictEqual(new Parser('5 + - -10').evaluate(), 15);
  assert.deepStrictEqual(new Parser('5 - + 10').evaluate(), -5);
  assert.deepStrictEqual(new Parser('5 - + -10').evaluate(), 15);
  assert.deepStrictEqual(new Parser('5 - - 10').evaluate(), 15);
  assert.deepStrictEqual(new Parser('5 - - -10').evaluate(), -5);
});
