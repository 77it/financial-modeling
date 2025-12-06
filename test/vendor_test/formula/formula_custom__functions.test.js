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


t('UNSUPPORTED quotes inside a function in JSONX are not supported and the formula is returned as-is, and other cases', () => {
  // see 'formula_custom___jsonx.test.js'
});

t('SUPPORTED quotes inside a function in JSONX are not supported and the formula is returned as-is, and other cases', () => {
  // see 'formula_custom___jsonx.test.js'
});

t('function with JSONX, array, date, nested json objects etc', () => {
  // see 'formula_custom___jsonx.test.js'
});

t('formula calling with functions containing quoted and unquoted values', () => {
  // being any operation absent, is not converted to decimal but simply to a string
  assert.deepStrictEqual(new Parser('444', { functions }).evaluate(), '444');
  assert.deepStrictEqual(new Parser('"444"', { functions }).evaluate(), '444');
  assert.deepStrictEqual(new Parser('222 + 222', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(444));
  assert.deepStrictEqual(new Parser('"222 + 222"', { functions }).evaluate(), '222 + 222');
  assert.deepStrictEqual(new Parser('q( 0+555 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(555));
  assert.deepStrictEqual(new Parser('q( -777 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(-777));
  assert.deepStrictEqual(new Parser('q( +777 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(777));
  // a number is passed to a function as string
  assert.deepStrictEqual(new Parser('q( 88888 )', { functions }).evaluate(), '88888');
  // a date outside a JSONX object is treated, rightly, as an arithmetic expression
  assert.deepStrictEqual(new Parser('q( 2025-12-31 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(2025 - 12 - 31));
  assert.deepStrictEqual(new Parser('q( "2025-12-31" )', { functions }).evaluate(), "2025-12-31");
  assert.deepStrictEqual(new Parser('q( "mamma mia" )', { functions }).evaluate(), 'mamma mia');
  // mamma_mia variable is not defined, then throws
  assert.throws(() => { new Parser('q( mamma_mia )', { functions }).evaluate(); });
  assert.deepStrictEqual(new Parser('q("mam ma")', { functions }).evaluate(), "mam ma");
  assert.deepStrictEqual(new Parser('q("mam" + "ma")', { functions }).evaluate(), 0n);  // summed as decimals

  // test throwing if function contains 2 token without operator
  assert.throws(() => { new Parser('q(mam ma)', { functions }).evaluate(); });
});

t('formula calling with functions containing references variables, defined or not in the context', () => {
  // variable bare references (without operations)
  assert.deepStrictEqual(new Parser('q(x)', { functions }).evaluate({ x: 10, y: 3 }), 10);

  // undefined variable bare references in function, throws
  assert.throws(() => { new Parser('q(zazza)', { functions }).evaluate({ x: 10, y: 3 }); });

  // variable used in operation
  assert.deepStrictEqual(new Parser('q(x + 1)', { functions }).evaluate({ x: 10, y: 3 }), convertWhenFmlEvalRequiresIt(11));

  // undefined variable used in operation
  assert.throws(() => { new Parser('q(z + 1)', { functions }).evaluate({ x: 10, y: 3 }) });
});
