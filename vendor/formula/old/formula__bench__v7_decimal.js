//@ts-nocheck

// run it with `node --import ./__node__register-hooks.js`
// run it with `run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
V7 DECIMAL MODE BENCHMARK (useDecimal: true, enableJsonx: false)

Expected improvements over v6:
- Direct operator dispatch (no arithmeticCalculate layer)
- Parse-time literal conversion (DSB.from() once, not millions of times)
- JSONX scanning disabled for speed
- Non-throwing resolver
*/

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v7.js';
import { parseJSONrelaxed } from '../../../src/lib/json.js';

/**
 * Parse a parseYAML string
 * @param {*} value
 * @returns {undefined | *} undefined if not valid, otherwise the parsed value
 */
function parseJSONX (value) {
  try {
    if (value == null)
      return undefined;

    //@ts-ignore
    return parseJSONrelaxed(value);
  } catch (e) {
    return undefined;
  }
}

/**
 * @param {string} value
 * @return {number}
 */
function q (value) {
  // if value is missing opening or closing brackets, add them
  if (!value.trim().startsWith("{"))
    value = "{" + value;
  if (!value.trim().endsWith("}"))
    value = value + "}";

  let parsed = parseJSONX(value);
  return 50;
}

const functions = {
  Q: q,
  q: q
};

/**
 * @param {string} value
 * @return {number}
 */
function q_quick (value) {
  return 50;
}

const functions_quick = {
  Q: q_quick,
  q: q_quick
};


/**
 * @param {string} name
 * @return {*}
 */
const reference = function (name) {
  /**
   @param {*} context
   @return {*}
   */
  function resolve(context)  // context is unused
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
      case '$.ciao':
        return 4;
      default:
        return undefined;  // V7: non-throwing
    }
  }
  return resolve;
};

// shared data
let data;

const formula1 = new Parser('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', {
  reference: reference,
  useDecimal: true,  // V7: test decimal mode
  enableJsonx: false  // V7: disable JSONX for max speed
});

const fmlText2 = "Q(\"{a: 11, b: mam ma, c: null, t: 2024-01-12:2025-05-07, e: 7\") + q(\"a: 55, b: -1000, x: 'ciao,, ciao'}\")";  //missing closing / opening brackets
const fmlText2_simple = "50 + Q('ten')";
const expected2 = 100;
const formula2 = new Parser(fmlText2, {
  functions,
  useDecimal: true,
  enableJsonx: false
});

const formula3 = new Parser(fmlText2, {
  functions: functions_quick,
  useDecimal: true,
  enableJsonx: false
});

const formula4 = new Parser(fmlText2_simple, {
  functions: functions_quick,
  useDecimal: true,
  enableJsonx: false
});

console.log('Formula 1 result:', formula1.evaluate());
console.log('Formula 2 result:', formula2.evaluate());
console.log('Formula 3 result:', formula3.evaluate());
console.log('Formula 4 result:', formula4.evaluate());

// add tests
suite.add('hapi formula calling function with a string parameter parsed as JSONX', function() {
  formula2.evaluate();
}, {
  setup: function () {
    // Code here runs before each test but is NOT timed
  }
})

  .add('hapi formula with custom variable resolver', function() {
    formula1.evaluate();
  }, {
    setup: function () {
      // Code here runs before each test but is NOT timed
    }
  })

  .add('quick functions call', function() {
    formula3.evaluate();
  }, {
    setup: function () {
      // Code here runs before each test but is NOT timed
    }
  })

  .add('simple formula + quick function call', function() {
    formula4.evaluate();
  }, {
    setup: function () {
      // Code here runs before each test but is NOT timed
    }
  })

  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .on('error', function (event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    console.error(event.target.error); // logs the actual Error object
  })
  // run async
  .run({ 'async': true });
