// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_v5_eval2cached_x.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

/**
 * @param {*} p
 * @return {*}
 */
function returnAny (p) {
  console.log(p);
  return p;
}

const functions = {
  q: returnAny,
  Q: returnAny
};

t('formula calling with really long numbers, quoted and not', () => {
  // being any operation absent, is not converted to decimal but simply to a string
  assert.deepStrictEqual(new Parser('123456789012345678901234567890.0987654321', { functions }).evaluate(), '123456789012345678901234567890.0987654321');
  assert.deepStrictEqual(new Parser('"123456789012345678901234567890.0987654321"', { functions }).evaluate(), '123456789012345678901234567890.0987654321');

  // long numbers in functions
  assert.deepStrictEqual(new Parser('q( 123456789012345678901234567890.0987654321+300000000000000000000000000000 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt('423456789012345678901234567890.0987654321'));

  // a number in function without operation is returned as string
  assert.deepStrictEqual(new Parser('q( -123456789012345678901234567890.0987654321 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt('-123456789012345678901234567890.0987654321'));
  assert.deepStrictEqual(new Parser('q( +123456789012345678901234567890.0987654321 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt('123456789012345678901234567890.0987654321'));
  assert.deepStrictEqual(new Parser('q( 123456789012345678901234567890.0987654321 )', { functions }).evaluate(), '123456789012345678901234567890.0987654321');

  // long numbers inside a JSONX object
  assert.deepStrictEqual(new Parser('q( {a: 123456789012345678901234567890.0987654321} )', { functions }).evaluate(), {a: '123456789012345678901234567890.0987654321'});
  assert.deepStrictEqual(new Parser(`q( {a: '123456789012345678901234567890.0987654321'} )`, { functions }).evaluate(), {a: '123456789012345678901234567890.0987654321'});
  assert.deepStrictEqual(new Parser(`q( {a: "123456789012345678901234567890.0987654321"} )`, { functions }).evaluate(), {a: '123456789012345678901234567890.0987654321'});

  // long numbers inside a JSONX object with operation
  assert.deepStrictEqual(new Parser('q( {a: 123456789012345678901234567890.0987654321 +300000000000000000000000000000} )', { functions }).evaluate(), {a: convertWhenFmlEvalRequiresIt('423456789012345678901234567890.0987654321')});
  // operation in quotes is removed and number returned as string
  assert.deepStrictEqual(new Parser(`q( {a: '123456789012345678901234567890.0987654321 +300000000000000000000000000000'} )`, { functions }).evaluate(), {a: '123456789012345678901234567890.0987654321 +300000000000000000000000000000'});
  assert.deepStrictEqual(new Parser(`q( {a: "123456789012345678901234567890.0987654321 +300000000000000000000000000000"} )`, { functions }).evaluate(), {a: '123456789012345678901234567890.0987654321 +300000000000000000000000000000'});
});
