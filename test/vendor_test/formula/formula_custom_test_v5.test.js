// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_yaml_as_func_par__v5.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('formula testing: recognizing dates/strings inside YAML with missing parts, recognized as dates', () => {
  const expected = {a: 11, d: new Date(2025, 7, 1), z: 999};
  const expected_minutes = {a: 11, d: new Date(2025, 7, 1, 9, 30), z: 999};

  // missing zeroes, recognized as dates nonetheless
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-8-1, z: 999}').evaluate(), expected);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025/8/1, z: 999}').evaluate(), expected);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025.8.1, z: 999}').evaluate(), expected);

  // without seconds, recognized as dates nonetheless
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01T09:30, z: 999}').evaluate(), expected_minutes);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30, z: 999}').evaluate(), expected_minutes);
  assert.deepStrictEqual(new Parser('{a: 11, d: 2025-08-01 09:30Z, z: 999}').evaluate(), expected_minutes);
});
