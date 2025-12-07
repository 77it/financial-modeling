/*
NODEJS run

sample sum For 1000 runs x 1,547,879 ops/sec ±2.18% (72 runs sampled)
sample bigint sum For 1000 runs x 1,297,874 ops/sec ±2.05% (77 runs sampled)
sample bigint sum with fx For 1000 runs x 1,194,491 ops/sec ±2.43% (74 runs sampled)
sample bigint sum with fx & conversion from bigint For 1000 runs x 1,156,140 ops/sec ±2.42% (70 runs sampled)
sample bigint sum with fx & conversion from string For 1000 runs x 788 ops/sec ±1.49% (77 runs sampled)
sample bigint sum with formula For 1000 runs x 5,787 ops/sec ±1.53% (76 runs sampled)
Fastest is sample sum For 1000 runs

DENO run

sample sum For 1.000 runs x 1,394,383 ops/sec ±3.27% (68 runs sampled)
sample bigint sum For 1.000 runs x 912,999 ops/sec ±1.46% (88 runs sampled)
sample bigint sum with fx For 1.000 runs x 928,132 ops/sec ±1.27% (78 runs sampled)
sample bigint sum with fx & conversion from bigint For 1.000 runs x 863,598 ops/sec ±4.55% (74 runs sampled)
sample bigint sum with fx & conversion from string For 1.000 runs x 968 ops/sec ±0.65% (87 runs sampled)
sample bigint sum with formula For 1.000 runs x 4,674 ops/sec ±0.83% (88 runs sampled)
Fastest is sample sum For 1.000 runs

BUN run

sample sum For 1.000 runs x 1,261,141 ops/sec ±2.72% (70 runs sampled)
sample bigint sum For 1.000 runs x 17,454 ops/sec ±0.64% (85 runs sampled)
sample bigint sum with fx For 1.000 runs x 17,515 ops/sec ±0.70% (83 runs sampled)
sample bigint sum with fx & conversion from bigint For 1.000 runs x 17,298 ops/sec ±0.69% (86 runs sampled)
sample bigint sum with fx & conversion from string For 1.000 runs x 513 ops/sec ±1.01% (76 runs sampled)
sample bigint sum with formula For 1.000 runs x 1,663 ops/sec ±1.17% (87 runs sampled)
Fastest is sample sum For 1.000 runs

 */

// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

import { fxAdd, ensureBigIntScaled } from "../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js";
import { Parser as ParserOriginal } from "../vendor/formula/formula.js";
import { Parser as ParserCustom } from "../vendor/formula/formula_v5_eval2cached_x.js";
import { Parser as ParserCustom2 } from "../vendor/formula/formula_v6_eval2cached+old_behaviour_x.js";

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// loop counter
const COUNTER = 1_000;

// shared data
let data;

// preparsed formula v5
const formula2 = new ParserCustom('1000000 + 2000000');
const fn2 = formula2.toFunction();

const sumEval = eval(`
    (function(x, y) {
      return x + y;
    })
  `);

// preparsed formula v6
const formula3 = new ParserCustom2('1000000 + 2000000');
const fn3 = formula3.toFunction();



// add tests
suite
  .add(`bigint sum For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = 1000000n + 2000000n;
    }
  })

  .add(`bigint sum with fx For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = fxAdd(1000000n, 2000000n);
    }
  })

  .add(`bigint sum with fx & conversion from string For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = fxAdd(ensureBigIntScaled("1000000"), ensureBigIntScaled("2000000"));
    }
  })

  .add(`sum with formula Original For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    const formula1 = new ParserOriginal('1000000 + 2000000');

    for (let i = 0; i < COUNTER; i++) {
      const a = formula1.evaluate();
    }
  })

  .add(`sum with formula Custom For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    const formula1 = new ParserCustom('1000000 + 2000000');

    for (let i = 0; i < COUNTER; i++) {
      const a = formula1.evaluate();
    }
  })

  .add(`sum with formula Custom v5 - compiled toFunction() For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = fn2();
    }
  })

  .add(`sum with formula Custom v6 - compiled toFunction() For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = fn3();
    }
  })

  .add(`bigint sum generated with Eval() For ${COUNTER.toLocaleString('it-IT')} runs`, function() {
    for (let i = 0; i < COUNTER; i++) {
      const a = sumEval(1000000n, 2000000n);
    }
  })

  // add listeners
  .on('cycle', function(/** @type {Benchmark.Event} */ event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    // @ts-ignore types from benchmark may not include .filter in Deno ambient
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .on('error', function (/** @type {Benchmark.Event} */ event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    // @ts-ignore ignore Deno errrors
    console.error(event.target.error); // logs the actual Error object
  })
  // run async
  .run({ 'async': true });
