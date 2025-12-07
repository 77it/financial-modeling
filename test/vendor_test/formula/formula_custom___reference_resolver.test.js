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

// Tests the evaluation of a string formula with a custom variable resolver
t('hapi formula with custom variable resolver', () => {
  let callCount = 0;  // Counter outside the function

  /**
   * @param {string} name
   * @return {*}  // ← Must return a function!
   */
  const reference_resolver = function (name) {
    // This is called during PARSE - once per reference
    return function(/** @type {any} */ context) {
      // This is called during EVALUATE - every time evaluate() is called
      callCount++;  // Increment on every EVALUATION

      switch (name) {
        case 'a':
          return 1 + callCount;  // return different value on each call
        case 'a.b':
          return 2;
        case 'b':
          return 3;
        case '$':
          return 1;
        case '$.ciao':
          return 4;
        case 'ad$.ciao':
          return 4;
        default:
          throw new Error('unrecognized value');
      }
    };
  };

  const simple_formula = new Parser('a+b+1', { reference: reference_resolver });
  assert.deepStrictEqual(callCount, 0); // right, no calls yet
  assert.deepStrictEqual(simple_formula.evaluate(), convertWhenFmlEvalRequiresIt(6));
  assert.deepStrictEqual(callCount, 2); // two calls during evaluation
  assert.deepStrictEqual(simple_formula.evaluate(), convertWhenFmlEvalRequiresIt(8));
  assert.deepStrictEqual(callCount, 4); // right, +2 calls during evaluation
  assert.deepStrictEqual(simple_formula.evaluate(), convertWhenFmlEvalRequiresIt(10));
  assert.deepStrictEqual(callCount, 6); // right, +2 calls during evaluation

  const string_to_parse_1 = 'a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + ((ad$.ciao+10)-2*5)';
  const expected_1 = convertWhenFmlEvalRequiresIt('54.99');
  const formula1 = new Parser(string_to_parse_1, { reference: reference_resolver });
  assert.deepStrictEqual(formula1.evaluate(), expected_1);
  assert.deepStrictEqual(callCount, 13); // right, +7 calls during evaluation
  const expected_2 = convertWhenFmlEvalRequiresIt('82.99');
  assert.deepStrictEqual(formula1.evaluate(), expected_2);
  assert.deepStrictEqual(callCount, 20); // right, +7 calls during evaluation

  // X is undefined
  assert.throws(() => {
    const formula2 = new Parser('a + x + 1', { reference: reference_resolver });
    formula2.evaluate();
  });

  // AAA_from_context is defined in context, but passing a custom reference resolver bypasses it
  assert.throws(() => {
    const formula3 = new Parser('a + AAA_from_context + 1', { reference: reference_resolver });
    formula3.evaluate({AAA_from_context: 90});
  });
  // AAA_from_context defined in context works only without custom reference resolver
  const formula4 = new Parser('a + AAA_from_context + 1');
  assert.deepStrictEqual(formula4.evaluate({a: 1, AAA_from_context: 90}), convertWhenFmlEvalRequiresIt(92));
});
