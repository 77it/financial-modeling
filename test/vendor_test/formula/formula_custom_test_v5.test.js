// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_yaml_as_func_par__v6_x.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('formula testing: recognizing dates/strings inside JSONX with missing parts, recognized as dates', () => {
  // missing zeroes, recognized as dates
  // remember that JSONX convert numbers and dates in strings when unquoted
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-8-1, z: 999}').evaluate(), {a: '11', d: "2025-8-1", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025/8/1, z: 999}').evaluate(), {a: '11', d: "2025/8/1", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025.8.1, z: 999}').evaluate(), {a: '11', d: "2025.8.1", z: '999'});

  // without seconds, recognized as dates
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30, z: 999}').evaluate(), {a: '11', d: "2025-08-01T09:30", z: '999'});

  // without separators, recognized as numbers and math expressions
  //assert.deepStrictEqual(new Parser('{a: 11, d: 2025 - 8-1, z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  //assert.deepStrictEqual(new Parser('{a: 11, d: 2025 -8-1, z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
  //assert.deepStrictEqual(new Parser('{a: 11, d: 2025- 8-1, z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});

  // parentheses around math expression, recognized as numbers and math expressions
  assert.deepStrictEqual(new Parser('{a: 11, d: "(2025-8-1)", z: 999}').evaluate(), {a: '11', d: "(2025-8-1)", z: '999'});
  assert.deepStrictEqual(new Parser('{a: 11, d: (2025-8-1), z: 999}').evaluate(), {a: '11', d: convertWhenFmlEvalRequiresIt(2025-8-1), z: '999'});
});
