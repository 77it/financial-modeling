// run it with `node --import ./__node__register-hooks.js`
// run it with `run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

hapi formula calling function with a string parameter parsed as JSONX x 92,274 ops/sec ±2.91% (70 runs sampled)
hapi formula with custom variable resolver x 137,052 ops/sec ±2.25% (71 runs sampled)
quick functions call x 506,053 ops/sec ±3.49% (71 runs sampled)
simple formula + quick function call x 590,590 ops/sec ±3.08% (72 runs sampled)
Fastest is simple formula + quick function call

DENO run

hapi formula calling function with a string parameter parsed as JSONX x 83,155 ops/sec ±6.31% (62 runs sampled)
hapi formula with custom variable resolver x 101,324 ops/sec ±3.28% (82 runs sampled)
quick functions call x 331,754 ops/sec ±6.36% (74 runs sampled)
simple formula + quick function call x 376,640 ops/sec ±7.51% (71 runs sampled)
Fastest is simple formula + quick function call

BUN run

hapi formula calling function with a string parameter parsed as JSONX x 54,117 ops/sec ±5.28% (58 runs sampled)
hapi formula with custom variable resolver x 56,123 ops/sec ±4.26% (79 runs sampled)
quick functions call x 276,277 ops/sec ±3.65% (85 runs sampled)
simple formula + quick function call x 292,988 ops/sec ±4.51% (79 runs sampled)
Fastest is simple formula + quick function call
 */

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_custom__accept_jsonx_as_func_par__v6_x.js';
import { parseJSONrelaxed } from '../../../src/lib/json.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

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

const formula1 = new Parser('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', { reference: reference });
const expected1 = convertWhenFmlEvalRequiresIt(19.99);

const fmlText2 = "Q(\"{a: 11, b: mam ma, c: null, t: 2024-01-12:2025-05-07, e: 7\") + q(\"a: 55, b: -1000, x: 'ciao,, ciao'}\")";  //missing closing / opening brackets
const fmlText2_simple = "50 + Q('ten')";
const expected2 = convertWhenFmlEvalRequiresIt(100);
const formula2 = new Parser(fmlText2, { functions });

const formula3 = new Parser(fmlText2, { functions: functions_quick });

const formula4 = new Parser(fmlText2_simple, { functions: functions_quick });

// add tests
suite.add('hapi formula calling function with a string parameter parsed as JSONX', function() {
  if (formula2.evaluate() !== expected2) {
    throw new Error("should be 100");
  }
}, {
  setup: function () {
    // Code here runs before each test but is NOT timed
  }
})

  .add('hapi formula with custom variable resolver', function() {
    if (formula1.evaluate() !== expected1) {
      throw new Error(expected1);
    }
  }, {
    setup: function () {
      // Code here runs before each test but is NOT timed
    }
  })

  .add('quick functions call', function() {
    if (formula3.evaluate() !== expected2) {
      throw new Error("should be 100");
    }
  }, {
    setup: function () {
      // Code here runs before each test but is NOT timed
    }
  })

  .add('simple formula + quick function call', function() {
    if (formula4.evaluate() !== expected2) {
      throw new Error("should be 100");
    }
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
