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

t('formula calling directly JSONX, outside functions', () => {
  const expected = {a: convertWhenFmlEvalRequiresIt(11), b: "mam ma", "c": null, d: "2025-12-31"};
  const expected2 = {a: convertWhenFmlEvalRequiresIt(11), b: {x: "mam ma"}, "c": null, d: "2025-12-31"};

  assert.deepStrictEqual(new Parser('{a: 10 + 1 * 1 + 9*0, b: mam ma, c: null, d: 2025-12-31}').evaluate(), expected);
  assert.deepStrictEqual(new Parser('{a: q(777)}', { functions }).evaluate(), { a: '777' });
  assert.deepStrictEqual(new Parser('{a: q({b: mam ma})}', { functions }).evaluate(), { a: {b: "mam ma"} });
  assert.deepStrictEqual(new Parser('{a: q(mamma)}', { functions }).evaluate(), { a: "mamma" });
  assert.deepStrictEqual(new Parser('{a: q(10) + 1 * 1 + 9*0, b: q({x: mam ma}), c: null, d: 2025-12-31}', { functions }).evaluate(), expected2);

  // quotes inside a formula are not supported and the formula is returned as-is
  assert.deepStrictEqual(new Parser('{a: q("mamma")}', { functions }).evaluate(), '{a: q("mamma")}');
  assert.deepStrictEqual(new Parser("{a: q('mamma')}", { functions }).evaluate(), "{a: q('mamma')}");
  assert.deepStrictEqual(new Parser('{a: q(mam ma)}', { functions }).evaluate(), { a: "q(mam ma)" });
});

t('formula with JSONX, array, date, nested json objects etc', () => {
  assert.deepStrictEqual(new Parser('Q( {a: [1, 2025/12/31, abcd e, q(10) + 1 * 1 + 9*0] } )', { functions }).evaluate(), {a: ['1', "2025/12/31", "abcd e", convertWhenFmlEvalRequiresIt(11)]});
  assert.deepStrictEqual(new Parser('q( [1, 2025/12/31, abcd e, q(999)] )', { functions }).evaluate(), ['1', "2025/12/31", "abcd e", '999']);
  // nested json objects
  assert.deepStrictEqual(new Parser('q( {a: 2025/12/31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q({z: ciao_ciao})} } )', { functions }).evaluate(), {a: "2025/12/31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: {z: "ciao_ciao"}}});
  assert.deepStrictEqual(new Parser('q( {a: 2025-12-31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q({z: ciao_ciao})} } )', { functions }).evaluate(), {a: "2025-12-31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: {z: "ciao_ciao"}}});
  assert.deepStrictEqual(new Parser('q( {a: 2025.12.31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q({z: ciao_ciao})} } )', { functions }).evaluate(), {a: "2025.12.31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: {z: "ciao_ciao"}}});
});
