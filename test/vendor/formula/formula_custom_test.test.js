// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_yaml_as_func_par__v3.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('formula calling function with YAML outside functions', () => {
  const fmlText2 = '{a: 11, b: mam ma, a + 7 c: null}';
  const expected2 = {a: 11, b: "mam ma", "a + 7 c": null};
  assert.deepStrictEqual(new Parser(fmlText2).evaluate(), expected2);
});

// Method that tests the calling of custom function "q()" (callable also with "Q()").
// q() accepts an object, a string or a number as a parameter and returns the length of the JSON of it.
t('formula calling function with parameter treated as YAML', () => {
  /**
   * @param {*} value
   * @return {number}
   */
  function q (value) {
    console.log(value);
    // if value is an object, convert it to JSON and return its length
    if (typeof value === 'object')
      return JSON.stringify(value).length;
    else
      return value.toString().length;
  }

  const functions = {
    Q: q,
    q: q
  };

  const fmlText2 = 'Q({a: 11, b: mam ma, a + 7 c: null}) + q("123a") + q(3) + 50';
  const expected2 = 91;
  assert.deepStrictEqual(new Parser(fmlText2, { functions }).evaluate(), expected2);
});

// Method that tests the evaluation of a formula with dates
t('formula with array, date, etc', () => {
  /**
   * @param {*} p
   * @return {*}
   */
  function returnAny (p) {
    console.log(p);
    return p;
  }

  const functions = {
    returnAny: returnAny
  };

  assert.deepStrictEqual(new Parser('returnAny( {a: [1, 2025/12/31, abcd e, 999] } )', { functions }).evaluate().a, [1, new Date(2025, 11, 31), "abcd e", 999]);
  assert.deepStrictEqual(new Parser('returnAny( [1, 2025/12/31, abcd e, 999] )', { functions }).evaluate(), [1, new Date(2025, 11, 31), "abcd e", 999]);
  assert.deepStrictEqual(new Parser('returnAny( {a: 2025/12/31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: ciao ciao} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('returnAny( {a: 2025-12-31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: ciao ciao} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('returnAny( {a: 2025.12.31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: ciao ciao} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  // a date outside a YAML object is treated, rightly, as an arithmetic expression
  assert.deepStrictEqual(new Parser('returnAny( 2025-12-31 )', { functions }).evaluate(), 2025 - 12 - 31);
  assert.deepStrictEqual(new Parser('returnAny( "mamma mia" )', { functions }).evaluate(), 'mamma mia');
  // mamma_mia variable is not defined, then is null
  assert.deepStrictEqual(new Parser('returnAny( mamma_mia )', { functions }).evaluate(), null);
});

// Method that tests the evaluation of a formula with dates
t('formula with array, date, etc', () => {
  /**
   * @param {*} p
   * @return {*}
   */
  function returnAny (p) {
    console.log(p);
    return p;
  }

  const functions = {
    returnAny: returnAny
  };

  assert.deepStrictEqual(new Parser('returnAny( {a: [1, 2025/12/31, abcd e, 999] } )', { functions }).evaluate().a, [1, new Date(2025, 11, 31), "abcd e", 999]);
  assert.deepStrictEqual(new Parser('returnAny( [1, 2025/12/31, abcd e, 999] )', { functions }).evaluate(), [1, new Date(2025, 11, 31), "abcd e", 999]);
  assert.deepStrictEqual(new Parser('returnAny( {a: 2025/12/31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: ciao ciao} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('returnAny( {a: 2025-12-31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: ciao ciao} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  assert.deepStrictEqual(new Parser('returnAny( {a: 2025.12.31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: ciao ciao} } )', { functions }).evaluate(), {a: new Date(2025, 11, 31), b: "mamma mia", c: 999, d: [1, "a b c"], e: {aa: 99, bb: "ciao ciao"}});
  // a date outside a YAML object is treated, rightly, as an arithmetic expression
  assert.deepStrictEqual(new Parser('returnAny( 2025-12-31 )', { functions }).evaluate(), 2025 - 12 - 31);
  assert.deepStrictEqual(new Parser('returnAny( "mamma mia" )', { functions }).evaluate(), 'mamma mia');
  // mamma_mia variable is not defined, then is null
  assert.deepStrictEqual(new Parser('returnAny( mamma_mia )', { functions }).evaluate(), null);
});
