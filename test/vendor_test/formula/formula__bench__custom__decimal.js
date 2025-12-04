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




with 7.1

NODEJS run

hapi formula calling function with a string parameter parsed as JSONX x 91,031 ops/sec ±3.79% (68 runs sampled)
hapi formula with custom variable resolver x 195,011 ops/sec ±3.33% (75 runs sampled)
quick functions call x 743,388 ops/sec ±1.52% (82 runs sampled)
simple formula + quick function call x 1,213,877 ops/sec ±2.69% (73 runs sampled)
Fastest is simple formula + quick function call

DENO run

hapi formula calling function with a string parameter parsed as JSONX x 87,334 ops/sec ±4.86% (63 runs sampled)
hapi formula with custom variable resolver x 118,285 ops/sec ±5.39% (74 runs sampled)
quick functions call x 483,760 ops/sec ±6.50% (71 runs sampled)
simple formula + quick function call x 823,866 ops/sec ±4.19% (81 runs sampled)
Fastest is simple formula + quick function call

BUN run

hapi formula calling function with a string parameter parsed as JSONX x 49,517 ops/sec ±12.42% (56 runs sampled)
hapi formula with custom variable resolver x 84,671 ops/sec ±1.11% (87 runs sampled)
quick functions call x 297,085 ops/sec ±0.84% (87 runs sampled)
simple formula + quick function call x 494,001 ops/sec ±0.90% (86 runs sampled)
Fastest is simple formula + quick function call
 */

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// @deno-types="../../../vendor/formula/index.d.ts"
import { Parser } from '../../../vendor/formula/formula_v5_eval2cached_x.js';
import { parseJSONrelaxed } from '../../../src/lib/json.js';
import { convertWhenFmlEvalRequiresIt } from './_formula__tests_settings.js'

/**
 * @param {string} value
 * @return {bigint}
 */
function q (value) {
  return 50n;
}

const functions = {
  Q: q,
  q: q
};

/**
 * @param {string} value
 * @return {bigint}
 */
function q_quick (value) {
  return 50n;
}

const functions_quick = {
  Q: q_quick,
  q: q_quick
};

const delta_context = 1n;

/**
 * @param {string} name
 * @param {*} context
 * @return {bigint}
 */
const reference = function (name, context) {
  // Closure example: can access external variables
  // const externalData = { ... };  // Would be captured here

  switch (name) {
    case 'a':
      return 1n + delta_context;
    case 'a.b':
      return 2n + delta_context;
    case 'b':
      return 3n + delta_context;
    case '$':
      return 1n + delta_context;
    case '$.ciao':
      return 4n + delta_context;
    default:
      throw new Error('unrecognized value');
  }
};

// shared data
let data;

const formula1 = new Parser('a + 1.99 + a.b + (((a+1)*2)+1) + a + $.ciao + $ + $.ciao', { reference: reference }).toFunction();
const expected1 = convertWhenFmlEvalRequiresIt(49900000023n);

const fmlText2 = "Q(\"{a: 11, b: mam ma, c: null, t: 2024-01-12:2025-05-07, e: 7\") + q(\"a: 55, b: -1000, x: 'ciao,, ciao'}\")";  //missing closing / opening brackets
const fmlText2_simple = "50 + Q('ten')";
const expected2 = 100n;
const formula2 = new Parser(fmlText2, { functions }).toFunction();

const formula3 = new Parser(fmlText2, { functions: functions_quick }).toFunction();

const formula4 = new Parser(fmlText2_simple, { functions: functions_quick }).toFunction();
const expected4 = 500000000050n;

// add tests
suite.add('hapi formula calling function with a string parameter parsed as JSONX', function() {
  if (formula2() !== expected2) {
    throw new Error("formula should be " + expected2 + ", instead is " + formula2());
  }
})

  .add('hapi formula with custom variable resolver', function() {
    if (formula1() !== expected1) {
      throw new Error("formula should be " + expected1 + ", instead is " + formula1());
    }
  })

  .add('quick functions call', function() {
    if (formula3() !== expected2) {
      throw new Error("formula should be " + expected2 + ", instead is " + formula3());
    }
  })

  .add('simple formula + quick function call', function() {
    if (formula4() !== expected4) {
      throw new Error("formula should be " + expected4 + ", instead is " + formula4());
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
