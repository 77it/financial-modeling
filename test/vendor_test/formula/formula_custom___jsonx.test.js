// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_v7_x.js';
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

/** @param {string} name @returns {(ctx: any) => any} */
const reference = (name) => {
  return () => returnAny(name);
};

t('quotes/quoted and bare parameters inside a function in JSONX are supported', () => {
  // quoted parameter supported
  assert.deepStrictEqual(new Parser('{a: q("mamma")}', { functions }).evaluate(), {a: "mamma"});
  assert.deepStrictEqual(new Parser("{a: q('mamma')}", { functions }).evaluate(), {a: "mamma"});
  // unquoted parameter
  assert.deepStrictEqual(new Parser('{a: q(mam)}', { functions, reference }).evaluate(), { a: "mam" });

  // if we need to pass a string as parameter better calling a function with json object
  assert.deepStrictEqual(new Parser('{a: q({b: mam m a})}', { functions }).evaluate(), { a: {b: "mam m a"} });

  // json with a string inside will be passed to the formula, BUT with the json braces
  assert.deepStrictEqual(new Parser('{a: q({mam})}', { functions }).evaluate(), { a: "{mam}" });
  assert.deepStrictEqual(new Parser('{a: q({mam ma})}', { functions }).evaluate(), { a: "{mam ma}" });

  // spaced function parameter are supported in json, but not supported in formula calls
  assert.throws(() => { new Parser('{a: q(mam ma)}', { functions, reference }).evaluate(); });
});

t('function with JSONX, array, date, nested json objects etc', () => {
  // v7: numeric values in formulas are BigInt, but JSONX object values stay as strings
  assert.deepStrictEqual(new Parser('Q( {a: [1, 2025/12/31, abcd e, q(10) + 1 * 1 + 9*0] } )', { functions }).evaluate(), {a: ['1', "2025/12/31", "abcd e", convertWhenFmlEvalRequiresIt(11)]});
  assert.deepStrictEqual(new Parser('q( [1, 2025/12/31, abcd e, q(999)] )', { functions }).evaluate(), ['1', "2025/12/31", "abcd e", convertWhenFmlEvalRequiresIt(999)]);
  // nested json objects - JSONX values stay as strings (no BigInt conversion in JSONX objects)
  assert.deepStrictEqual(new Parser('q( {a: 2025/12/31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q({z: q(99)})} } )', { functions }).evaluate(), {a: "2025/12/31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: {z: convertWhenFmlEvalRequiresIt(99)}}});
  assert.deepStrictEqual(new Parser('q( {a: 2025-12-31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q({z: q("ciao_ciao")})} } )', { functions }).evaluate(), {a: "2025-12-31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: {z: "ciao_ciao"}}});
  assert.deepStrictEqual(new Parser('q( {a: 2025.12.31, b: mamma mia, c: 999, d: [1, a b c], e: {aa: 99, bb: q({z: q(ciao_ciao)})} } )', { functions, reference }).evaluate(), {a: "2025.12.31", b: "mamma mia", c: '999', d: ['1', "a b c"], e: {aa: '99', bb: {z: "ciao_ciao"}}});
});

t('formula calling directly JSONX, outside functions', () => {
  const expected = {a: convertWhenFmlEvalRequiresIt(11), b: "mam ma", "c": null, d: "2025-12-31"};
  const expected2 = {a: convertWhenFmlEvalRequiresIt(11), b: {x: "mam ma"}, "c": null, d: "2025-12-31"};

  assert.deepStrictEqual(new Parser('{a: 10 + 1 * 1 + 9*0, b: mam ma, c: null, d: 2025-12-31}').evaluate(), expected);
  // v7: numeric args passed as BigInt
  assert.deepStrictEqual(new Parser('{a: q(777)}', { functions }).evaluate(), { a: convertWhenFmlEvalRequiresIt(777) });
  assert.deepStrictEqual(new Parser('{a: q({b: mam ma})}', { functions }).evaluate(), { a: {b: "mam ma"} });
  assert.deepStrictEqual(new Parser('{a: q({b: mam ma})}', { functions }).evaluate(), { a: {b: "mam ma"} });
  assert.deepStrictEqual(new Parser('{a: q(10) + 1 * 1 + 9*0, b: q({x: mam ma}), c: null, d: 2025-12-31}', { functions }).evaluate(), expected2);
});
