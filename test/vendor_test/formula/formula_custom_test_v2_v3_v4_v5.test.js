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
  assert.deepStrictEqual(new Parser('444', { functions }).evaluate(), 444);
  assert.deepStrictEqual(new Parser('q( 0+555 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(555));
  assert.deepStrictEqual(new Parser('q( +777 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(777));
  // a number is passed to a function as string
  assert.deepStrictEqual(new Parser('q( 88888 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(88888));
  // a date outside a JSONX object is treated, rightly, as an arithmetic expression
  assert.deepStrictEqual(new Parser('q( 2025-12-31 )', { functions }).evaluate(), convertWhenFmlEvalRequiresIt(2025 - 12 - 31));
  assert.deepStrictEqual(new Parser('q( "2025-12-31" )', { functions }).evaluate(), "2025-12-31");
  assert.deepStrictEqual(new Parser('q( "mamma mia" )', { functions }).evaluate(), 'mamma mia');
  // mamma_mia variable is not defined, then is null
  assert.deepStrictEqual(new Parser('q( mamma_mia )', { functions }).evaluate(), null);
  assert.deepStrictEqual(new Parser('q("mam ma")', { functions }).evaluate(), "mam ma");
});

t('formula calling directly JSONX, outside functions', () => {
  const expected = {a: convertWhenFmlEvalRequiresIt(11), b: "mam ma", "c": null, d: "2025-12-31"};
  const expected2 = {a: convertWhenFmlEvalRequiresIt(11), b: {x: "mam ma"}, "c": null, d: "2025-12-31"};

  assert.deepStrictEqual(new Parser('{a: 10 + 1 * 1 + 9*0, b: mam ma, c: null, d: 2025-12-31}').evaluate(), expected);
  assert.deepStrictEqual(new Parser('{a: q(777)}', { functions }).evaluate(), { a: 777 });
  assert.deepStrictEqual(new Parser('{a: q(mam ma)}', { functions }).evaluate(), { a: "mam ma" });
  assert.deepStrictEqual(new Parser('{a: q({b: mam ma})}', { functions }).evaluate(), { a: {b: "mam ma"} });
  assert.deepStrictEqual(new Parser('{a: q(10) + 1 * 1 + 9*0, b: q({x: mam ma}), c: null, d: 2025-12-31}', { functions }).evaluate(), expected2);
});

t('formula with JSONX, array, date, etc', () => {
  assert.deepStrictEqual(new Parser('Q( {a: [1, 2025/12/31, abcd e, q(10) + 1 * 1 + 9*0] } )', { functions }).evaluate(), {a: ['1', "2025/12/31", "abcd e", convertWhenFmlEvalRequiresIt(11)]});
  assert.deepStrictEqual(new Parser('q( [1, 2025/12/31, abcd e, q(999)] )', { functions }).evaluate(), ['1', "2025/12/31", "abcd e", 999]);
  assert.deepStrictEqual(new Parser('q( {a: 2025/12/31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q(ciao ciao)} } )', { functions }).evaluate(), {a: "2025/12/31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('q( {a: 2025-12-31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q(ciao ciao)} } )', { functions }).evaluate(), {a: "2025-12-31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('q( {a: 2025.12.31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q(ciao ciao)} } )', { functions }).evaluate(), {a: "2025.12.31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: "ciao ciao"}});
});

t('arithmetics with negative numbers  // only v4 supports numbers with explicit + sign', () => {
  assert.deepStrictEqual(new Parser('-10 / +2').evaluate(), convertWhenFmlEvalRequiresIt(-5));
  assert.deepStrictEqual(new Parser('-10 * +2').evaluate(), convertWhenFmlEvalRequiresIt(-20));
});

t('formula testing: recognizing dates/strings inside JSONX', () => {
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01, z: 999}').evaluate(), {a: '11', d: "2025-08-01", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025/08/01, z: 999}').evaluate(), {a: '11', d: "2025/08/01", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025.08.01, z: 999}').evaluate(), {a: '11', d: "2025.08.01", z: '999'});

  // with seconds
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30:45, z: 999}').evaluate(), {a: '11', d: "2025-08-01T09:30:45", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45Z, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45Z", z: '999'});

  // with milliseconds
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30:45.004, z: 999}').evaluate(), {a: '11', d: "2025-08-01T09:30:45.004", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45.004, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45.004", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45.004Z, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45.004Z", z: '999'});
});
