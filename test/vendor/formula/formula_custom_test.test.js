// test with deno test --allow-import

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_yaml_as_func_par.js';

import  { customParseYAML } from '../../../src/lib/yaml.js';
import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

// Method that tests the calling of custom function "q()" (callable also with "Q()").
// q() accepts an object, a string or a number as a parameter and returns the length of the JSON of it.
t('hapi formula calling function with a string parameter parsed as YAML', () => {
  /**
   * @param {*} value
   * @return {number}
   */
  function q (value) {
    console.log(value);
    // if value is an object, convert it to JSON and return its length
    if (typeof value === 'object')
      return JSON.stringify(value).length;
    else
      return value.toString().length;
  }

  const functions = {
    Q: q,
    q: q
  };

  const fmlText2 = 'Q({a: 11, b: mam ma, a + 7 c: null}) + q("123a") + q(3) + 50';
  const expected2 = 91;
  assert.deepStrictEqual(new Parser(fmlText2, { functions }).evaluate(), expected2);
});

// Method that tests the evaluation of a formula with dates
t('hapi formula with dates, and operations on them', () => {
  /**
   * @param {Object} p
   * @param {Date} p.date
   */
  function add7Months (p) {
    console.log("add7Months");
    console.log(p);
    return p;
  }

  const functions = {
    add7Months: add7Months
  };

  console.log(customParseYAML('{date: 2025/12/31}'));

  //const fmlText = 'add7Months({date: 2025/12/31})';
  //const fmlText = 'add7Months({date: 2025-12-31})';
  //const fmlText = 'add7Months({date: 2025.12.31})';
  const fmlText = 'add7Months( {a: [1, 2] } )';
  const expected = new Date(2024,7,12);
  const formula1 = new Parser(fmlText, { functions });
  assert.deepStrictEqual(formula1.evaluate(), expected);
});

// Tests the evaluation of a string formula with a custom variable resolver
t('hapi formula with custom variable resolver', () => {
  /**
   * @param {string} name
   * @return {*}
   */
  const reference = function (name) {
    /**
     @param {*} context
     @return {*}
     */
    function resolve (context)  // context is unused
    {
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
    }

    return resolve;
  };

  const string_to_parse_1 = 'a + 1.99 + a.b + (((a+1)*2)+1) + a + {$.ciao} + $ + ((ad{$.ciao}+10)-2*5)';
  const expected_1 = '19.99';

  const formula1 = new Parser(string_to_parse_1, { reference: reference });

  assert.deepStrictEqual(Number(formula1.evaluate()).toFixed(2), expected_1);
});
