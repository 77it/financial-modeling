//@ts-nocheck

// run it with `node --import ./__node__register-hooks.js`
// run it with `run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

hapi formula calling function with a string parameter parsed as JSONX x 100,833 ops/sec ±1.86% (76 runs sampled)
hapi formula with custom variable resolver x 232,960 ops/sec ±1.62% (78 runs sampled)
quick functions call x 1,181,387 ops/sec ±1.57% (77 runs sampled)
simple formula + quick function call x 1,247,256 ops/sec ±2.55% (70 runs sampled)
Fastest is simple formula + quick function call

DENO run

hapi formula calling function with a string parameter parsed as JSONX x 89,131 ops/sec ±4.35% (65 runs sampled)
hapi formula with custom variable resolver x 172,440 ops/sec ±7.16% (76 runs sampled)
quick functions call x 808,223 ops/sec ±5.40% (79 runs sampled)
simple formula + quick function call x 857,659 ops/sec ±6.62% (80 runs sampled)
Fastest is simple formula + quick function call

BUN run

hapi formula calling function with a string parameter parsed as JSONX x 60,420 ops/sec ±2.46% (71 runs sampled)
hapi formula with custom variable resolver x 236,183 ops/sec ±0.85% (83 runs sampled)
quick functions call x 764,257 ops/sec ±0.82% (85 runs sampled)
simple formula + quick function call x 855,735 ops/sec ±0.88% (81 runs sampled)
Fastest is simple formula + quick function call */

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
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
        throw new Error('unrecognized value');
    }
  }
  return resolve;
};

// shared data
let data;

const formula1 = new Parser('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', { reference: reference, useDecimal: false });
const expected1 = 11.99211414;

const fmlText2 = "Q(\"{a: 11, b: mam ma, c: null, t: 2024-01-12:2025-05-07, e: 7\") + q(\"a: 55, b: -1000, x: 'ciao,, ciao'}\")";  //missing closing / opening brackets
const fmlText2_simple = "50 + Q('ten')";
const expected2 = 5050;
const formula2 = new Parser(fmlText2, { functions, useDecimal: false });

const formula3 = new Parser(fmlText2, { functions: functions_quick, useDecimal: false });

const formula4 = new Parser(fmlText2_simple, { functions: functions_quick, useDecimal: false });

console.log(formula1.evaluate());
console.log(formula2.evaluate());
console.log(formula3.evaluate());
console.log(formula4.evaluate());

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
