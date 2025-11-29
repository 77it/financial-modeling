// run it with `node --import ./__node__register-hooks.js`
// run it with `run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

hapi formula calling function with a string parameter parsed as JSONX x 100,237 ops/sec ±3.22% (72 runs sampled)
hapi formula with custom variable resolver x 519,989 ops/sec ±8.81% (70 runs sampled)
quick functions call x 2,203,171 ops/sec ±1.83% (76 runs sampled)
simple formula + quick function call x 2,994,368 ops/sec ±2.08% (68 runs sampled)
Fastest is simple formula + quick function call

DENO run

hapi formula calling function with a string parameter parsed as JSONX x 74,385 ops/sec ±12.67% (51 runs sampled)
hapi formula with custom variable resolver x 369,949 ops/sec ±4.40% (81 runs sampled)
quick functions call x 1,645,744 ops/sec ±5.63% (82 runs sampled)
simple formula + quick function call x 2,659,314 ops/sec ±0.87% (88 runs sampled)
Fastest is simple formula + quick function call

BUN run

hapi formula calling function with a string parameter parsed as JSONX x 62,429 ops/sec ±2.59% (70 runs sampled)
hapi formula with custom variable resolver x 220,419 ops/sec ±1.01% (85 runs sampled)
quick functions call x 855,034 ops/sec ±0.63% (89 runs sampled)
simple formula + quick function call x 960,654 ops/sec ±2.12% (83 runs sampled)
Fastest is simple formula + quick function call
 */

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula.js';
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

const formula1 = new Parser('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', { reference: reference });

const fmlText2 = "Q(\"{a: 11, b: mam ma, c: null, t: 2024-01-12:2025-05-07, e: 7\") + q(\"a: 55, b: -1000, x: 'ciao,, ciao'}\")";  //missing closing / opening brackets
const fmlText2_simple = "50 + Q('ten')";
const expected2 = 100;
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
    if (Number(formula1.evaluate()).toFixed(2) !== "19.99") {
      throw new Error("19.99");
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
