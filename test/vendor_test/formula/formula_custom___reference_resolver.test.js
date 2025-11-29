// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser as CustomParser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
import { Parser as OriginalParser } from '../../../vendor/formula/formula.js';

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
  /**
   * @param {string} name
   * @return {*}
   */
  const reference_resolver = function (name) {
    switch (name) {
      case 'a':
        return 1;
      case 'a.b':
        return 2;
      case 'b':
        return 3;
      case '$':
        return 1;
      case '{$.ciao}':
        return 4;
      case 'ad{$.ciao}':
        return 4;
      default:
        throw new Error('unrecognized value');
    }
  };

  const string_to_parse_1 = 'a + 1.99 + a.b + (((a+1)*2)+1) + a + {$.ciao} + $ + ((ad{$.ciao}+10)-2*5)';
  const expected_1 = '19.99';
  const formula1_o = new OriginalParser(string_to_parse_1, { reference: reference_resolver });
  assert.deepStrictEqual(Number(formula1_o.evaluate()).toFixed(2), expected_1);
  const formula1_c = new CustomParser(string_to_parse_1, { reference: reference_resolver });
  assert.deepStrictEqual(Number(formula1_c.evaluate()).toFixed(2), expected_1);

  assert.throws(() => {
    const string_to_parse_2 = 'a + x + 1';
    const formula2_o = new OriginalParser(string_to_parse_2, { reference: reference_resolver });
    formula2_o.evaluate();
    const formula2_c = new CustomParser(string_to_parse_2, { reference: reference_resolver });
    formula2_c.evaluate();
  });
});
