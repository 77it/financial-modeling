// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('formula calling with bare references variables, defined or not in the context', () => {
  // variable bare references (without operations) -> returns the variable value
  assert.deepStrictEqual(new Parser('x').evaluate({ x: 10, y: 3 }), 10);

  // undefined variable bare references -> throws
  assert.throws(() => { new Parser('z').evaluate({ x: 10, y: 3 }) });

  // variable used in operation
  assert.deepStrictEqual(new Parser('x + 1').evaluate({ x: 10, y: 3 }), convertWhenFmlEvalRequiresIt(11));

  // undefined variable used in operation -> throws
  assert.throws(() => { new Parser('z + 1').evaluate({ x: 10, y: 3 }) });
});
