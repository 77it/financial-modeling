// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
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

t('formula testing: evaluating as formula a wrong formula, the original string is returned', () => {
  const wrongFormulas = [
    '2025.08.01',
    '2025-08-01T09:30',
    'mam ma'
  ];

  const errors = [];

  for (const wf of wrongFormulas) {
    try {
      const result = new Parser(wf, {returnOriginalOnError: true}).evaluate();
      assert.strictEqual(result, wf);
    } catch (error) {
      errors.push({
        formula: wf,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Print all errors to console
  if (errors.length > 0) {
    console.error('\n❌ Test failures:');
    errors.forEach(({ formula, error }) => {
      console.error(`  Formula: "${formula}"`);
      console.error(`  Error: ${error}\n`);
    });

    // Fail the test with a summary
    assert.fail(`${errors.length} out of ${wrongFormulas.length} test case(s) failed. See errors above.`);
  }
});