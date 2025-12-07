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

t('logical operators: non-numeric strings become falsy after normalization', () => {
  const ctx = {foo: 'bar'};

  assert.deepStrictEqual(
    new Parser('foo || 1').evaluate(ctx),
    convertWhenFmlEvalRequiresIt(1)  // "bar" normalizes to 0n, so || returns right side
  );

  assert.deepStrictEqual(
    new Parser('foo && 1').evaluate(ctx),
    convertWhenFmlEvalRequiresIt(0)  // "bar" -> 0n, so && returns 0n instead of evaluating right side
  );
});

t('nullish coalescing: defined non-numeric values are coerced to 0n', () => {
  assert.deepStrictEqual(
    new Parser('"foo" ?? 1').evaluate(),
    convertWhenFmlEvalRequiresIt(0)  // defined literal string is normalized to 0n instead of being returned as-is
  );

  assert.deepStrictEqual(
    new Parser('foo ?? 1').evaluate({foo: 'bar'}),
    convertWhenFmlEvalRequiresIt(0)  // context value exists but gets coerced to 0n
  );
});

t('logical/nullish operators: arrays/objects are treated as zero-like', () => {
  const ctx = {arr: [1, 2], obj: {a: 1}};

  assert.deepStrictEqual(
    new Parser('arr || 5').evaluate(ctx),
    convertWhenFmlEvalRequiresIt(5)  // array normalizes to 0n, so || chooses right side
  );

  assert.deepStrictEqual(
    new Parser('arr && 5').evaluate(ctx),
    convertWhenFmlEvalRequiresIt(0)  // array normalizes to 0n, so && short-circuits to 0n
  );

  assert.deepStrictEqual(
    new Parser('obj ?? 5').evaluate(ctx),
    convertWhenFmlEvalRequiresIt(0)  // object exists but normalization returns 0n
  );
});
