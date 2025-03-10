// test with deno test --allow-import

// tests the library '../vendor/formula_custom.js'
// that contains my edits to `_subFormula` to accept any value and passing it to the function as a string.

// @deno-types="https://cdn.jsdelivr.net/gh/77it/formula@3.0.2/lib/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom.js';

// BEWARE: YAML object definition works only if key is separated form value by at least one space (key: value); doesn't work without space (key:value), as JSON5 does.
// see https://yaml.org/spec/1.2.2/#21-collections
//
// see github   https://github.com/nodeca/js-yaml
// online demo   https://nodeca.github.io/js-yaml/
// npm   https://www.npmjs.com/package/js-yaml
// specs   https://yaml.org/spec/1.2.2/
import yaml from 'https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.mjs';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

// Method that tests the evaluation of a string with the custom function "q()" (callable also with or "Q()") inside the string to evaluate.
// q() accepts an object, a string or a number as a parameter and returns the length of the JSON of it.
// q() is mapped to Q() and Q() before executing the evaluation.
t('hapi formula calling function with a string parameter parsed as YAML', () => {
  /**
   * Parse a parseYAML string
   * @param {*} value
   * @returns {undefined | *} undefined if not valid, otherwise the parsed value
   */
  function parseYAML (value) {
    try {
      if (value == null)
        return undefined;

      //@ts-ignore
      return yaml.load(value);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * @param {string} value
   * @return {number}
   */
  function q (value) {
    console.log(value);
    // if value is missing opening or closing brackets, add them
    if (!value.trim().startsWith("{"))
      value = "{" + value;
    if (!value.trim().endsWith("}"))
      value = value + "}";

    console.log(value);
    let parsed = parseYAML(value);
    const json = JSON.stringify(parsed);
    console.log(json);
    console.log(json.length);
    return json.length;
  }

  const functions = {
    Q: q,
    q: q
  };

  //const fmlText2 = "Q(a: 11, b: mam ma, c: null) + 70";  //missing closing / opening brackets
  const fmlText2 = "Q(a: 11, b: mam ma, a + 7 c: null) + q(123a) + 51";
  const expected2 = 100;
  assert.deepStrictEqual(new Parser(fmlText2, { functions }).evaluate(), expected2);
});

// Method that tests the evaluation of a string with the custom function "q()" (callable also with or "Q()") inside the string to evaluate.
// q() is mapped to Q() and Q() before executing the evaluation.
t('hapi formula calling function with a string parameter', () => {
  /**
   * @param {string} value
   * @return {number}
   */
  function q (value) {
    console.log("q() function");
    console.log("value: " + value);
    switch (value) {
      case 'one':
        return 1;
      case 'ten':
        return 10;
      default:
        throw new Error('unrecognized value');
    }
  }

  const functions = {
    Q: q,
    q: q
  };

  const fmlText = "(1 + 2) * 2 + (1+((Q(ten) + q(one))*10))/(2+1)";
  const expected = (1+2)*2 + (1+((10+1)*10))/(2+1);
  const formula1 = new Parser(fmlText, { functions });
  assert.deepStrictEqual(formula1.evaluate(), expected);
});

// Method that tests the evaluation of a formula with dates
t('hapi formula with dates, and operations on them', () => {
  /**
   * @param {string} date
   * @return {Date}
   */
  function addMonths (date) {
    console.log("addMonths");
    console.log(date);
    // takes the string components of the date and build a new date
    const _dateComponents = date.split('-');
    const _date = new Date(Number(_dateComponents[0]), Number(_dateComponents[1]) - 1, Number(_dateComponents[2]));
    return _addMonths(_date, 7);
  }

  const functions = {
    addMonths: addMonths
  };

  const fmlText = "addMonths(2024-01-12)";
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

// see code from https://github.com/77it/financial-modeling/blob/c692174d5370e7badaee77bf7e01adb9bd140365/src/lib/date_utils.js
// for the commented code
/**
 * Add the specified number of months to the given date.
 *
 * @param {Date} date - the date to add the months to
 * @param {number} amount - the amount of months to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the months added
 *
 * @example
 * Add 5 months to 2014/09/01 => 2015/02/01
 * Add 2 months to 2014/12/31 => 2015/02/28
 * Add 2 months to 2023/12/31 => 2024/02/29  // leap year
 */
function _addMonths (
  date,
  amount) {
  const _date = new Date(date);
  if (isNaN(amount)) return new Date(date);
  if (!amount) {
    return new Date(date);
  }
  const dayOfMonth = _date.getDate();
  const endOfDesiredMonth = new Date(_date);
  endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
  const daysInMonth = endOfDesiredMonth.getDate();
  if (dayOfMonth >= daysInMonth) {
    return endOfDesiredMonth;
  } else {
    _date.setFullYear(
      endOfDesiredMonth.getFullYear(),
      endOfDesiredMonth.getMonth(),
      dayOfMonth
    );
    return _date;
  }
}
