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

t('formula testing: recognizing unquoted dates/strings inside JSONX', () => {
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01, z: 999}').evaluate(), {a: '11', d: "2025-08-01", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025/08/01, z: 999}').evaluate(), {a: '11', d: "2025/08/01", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025.08.01, z: 999})', { functions }).evaluate(), {a: '11', d: "2025.08.01", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025.08.01, z: 999}').evaluate(), {a: '11', d: "2025.08.01", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025.08.01, z: 999})', { functions }).evaluate(), {a: '11', d: "2025.08.01", z: '999'});

  // with seconds
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30:45, z: 999}').evaluate(), {a: '11', d: "2025-08-01T09:30:45", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01T09:30:45, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01T09:30:45", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01 09:30:45, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01 09:30:45", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45Z, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45Z", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01 09:30:45Z, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01 09:30:45Z", z: '999'});

  // with milliseconds
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30:45.004, z: 999}').evaluate(), {a: '11', d: "2025-08-01T09:30:45.004", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01T09:30:45.004, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01T09:30:45.004", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45.004, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45.004", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01 09:30:45.004, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01 09:30:45.004", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30:45.004Z, z: 999}').evaluate(), {a: '11', d: "2025-08-01 09:30:45.004Z", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01 09:30:45.004Z, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01 09:30:45.004Z", z: '999'});
});

t('formula testing: recognizing unquoted dates/strings with missing zeros inside JSONX', () => {
  // missing zeroes, recognized as dates
  // remember that JSONX convert numbers and dates in strings when unquoted
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-8-1, z: 999}').evaluate(), {a: '11', d: "2025-8-1", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-8-1, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-8-1", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025/8/1, z: 999}').evaluate(), {a: '11', d: "2025/8/1", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025/8/1, z: 999})', { functions }).evaluate(), {a: '11', d: "2025/8/1", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025.8.1, z: 999}').evaluate(), {a: '11', d: "2025.8.1", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025.8.1, z: 999})', { functions }).evaluate(), {a: '11', d: "2025.8.1", z: '999'});

  // time without seconds, recognized as dates
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30, z: 999}').evaluate(), {a: '11', d: "2025-08-01T09:30", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025-08-01T09:30, z: 999})', { functions }).evaluate(), {a: '11', d: "2025-08-01T09:30", z: '999'});
});

t('formula testing: dates with spaces and with parentheses recognized as expressions, not dates', () => {
  // with spaces, recognized as numbers and math expressions
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025 - 8-1, z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025 - 8-1, z: 999})', { functions }).evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025 -8-1, z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025 -8-1, z: 999})', { functions }).evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025- 8-1, z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: 2025- 8-1, z: 999})', { functions }).evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});

  // parentheses around math expression, recognized as numbers and math expressions
  assert.deepStrictEqual(new Parser('{a: 11, d: "(2025-8-1)", z: 999}').evaluate(), {a: '11', d: "(2025-8-1)", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: "(2025-8-1)", z: 999})', { functions }).evaluate(), {a: '11', d: "(2025-8-1)", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: (2025-8-1), z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: (2025-8-1), z: 999})', { functions }).evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
});

t('formula testing: dates in quotes, are just strings', () => {
  // dates in quotes, are strings
  assert.deepStrictEqual(new Parser('{a: 11, d: "2025-8-1", z: 999}').evaluate(), {a: '11', d: "2025-8-1", z: '999'});
  assert.deepStrictEqual(new Parser('q({a: 11, d: "2025-8-1", z: 999})', { functions }).evaluate(), {a: '11', d: "2025-8-1", z: '999'});
});
