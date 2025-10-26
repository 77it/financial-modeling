// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_yaml_as_func_par__v5_x.js';
//import { Parser } from '../../../vendor/formula/extras/formula_custom__accept_yaml_as_func_par__v3_x.js';

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

t('formula calling directly YAML, outside functions', () => {
  const expected = {a: 11, b: "mam ma", "a + 7 c": null, d: new Date(2025, 11, 31)};

  assert.deepStrictEqual(new Parser('{a: 11, b: mam ma, a + 7 c: null, d: 2025-12-31}').evaluate(), expected);
  assert.deepStrictEqual(new Parser('{a: q(11), b: q("mam ma"), a + 7 c: null, d: 2025-12-31}', { functions }).evaluate(), expected);
});

t('formula with YAML, array, date, etc', () => {
  assert.deepStrictEqual(new Parser('Q( {a: [1, 2025/12/31, abcd e, q(999)] } )', { functions }).evaluate().a, [1, new Date(2025, 11, 31), "abcd e", 999]);
  assert.deepStrictEqual(new Parser('q( [1, 2025/12/31, abcd e, q(999)] )', { functions }).evaluate(), [1, new Date(2025, 11, 31), "abcd e", 999]);
  assert.deepStrictEqual(new Parser('q( {a: 2025/12/31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q("ciao ciao")} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('q( {a: 2025-12-31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q("ciao ciao")} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('q( {a: 2025.12.31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q("ciao ciao")} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  // a date outside a YAML object is treated, rightly, as an arithmetic expression
  assert.deepStrictEqual(new Parser('q( 2025-12-31 )', { functions }).evaluate(), 2025 - 12 - 31);
  assert.deepStrictEqual(new Parser('q( "mamma mia" )', { functions }).evaluate(), 'mamma mia');
  // mamma_mia variable is not defined, then is null
  assert.deepStrictEqual(new Parser('q( mamma_mia )', { functions }).evaluate(), null);
});

t('arithmetics with negative numbers  // only v4 supports numbers with explicit + sign', () => {
  assert.deepStrictEqual(new Parser('-10 / 2').evaluate(), -5);
  assert.deepStrictEqual(new Parser('-10 * 2').evaluate(), -20);
});

t('formula testing: recognizing dates/strings inside YAML', () => {
  const expected = {a: 11, d: new Date(2025, 7, 1), z: 999};
  const expected_minutes = {a: 11, d: new Date(2025, 7, 1, 9, 30), z: 999};
  const expected_seconds = {a: 11, d: new Date(2025, 7, 1, 9, 30, 45), z: 999};
  const expected_milliseconds = {a: 11, d: new Date(2025, 7, 1, 9, 30, 45, 4), z: 999};

  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01, z: 999}').evaluate(), expected);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025/08/01, z: 999}').evaluate(), expected);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025.08.01, z: 999}').evaluate(), expected);

  // with seconds
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30:45, z: 999}').evaluate(), expected_seconds);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45, z: 999}').evaluate(), expected_seconds);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45Z, z: 999}').evaluate(), expected_seconds);

  // with milliseconds
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30:45.004, z: 999}').evaluate(), expected_milliseconds);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45.004, z: 999}').evaluate(), expected_milliseconds);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45.004Z, z: 999}').evaluate(), expected_milliseconds);
});

