// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
//import { Parser } from '../../../vendor/formula/extras/formula_custom__accept_yaml_as_func_par__v3_x.js';
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
  // mamma_mia variable is not defined, then is null
  assert.deepStrictEqual(new Parser('q( mamma_mia )', { functions }).evaluate(), ' mamma_mia ');
  assert.deepStrictEqual(new Parser('q("mam ma")', { functions }).evaluate(), "mam ma");
  assert.deepStrictEqual(new Parser('q("mam" + "ma")', { functions }).evaluate(), 0n);  // summed as decimals

  // test throwing if function contains 2 token without operator
  assert.throws(() => { new Parser('q(mam ma)', { functions }).evaluate(); });
});

