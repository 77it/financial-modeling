// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

import { test } from 'node:test';
import assert from 'node:assert';
import * as s from '../../../src/lib/schema_sanitization_utils.js';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('formula testing: unquoted dates are formulas', () => {
  assert.deepStrictEqual(new Parser('2025-8-1').evaluate(), convertWhenFmlEvalRequiresIt(2025 - 8 - 1));
  assert.deepStrictEqual(new Parser('2025/8/1').evaluate(), convertWhenFmlEvalRequiresIt(2025 / 8 / 1));

  // those are no formulas, then an error is thrown
  assert.throws(() => new Parser('2025.8.1').evaluate());
  assert.throws(() => new Parser('2025-08-01T09:30').evaluate());
});

