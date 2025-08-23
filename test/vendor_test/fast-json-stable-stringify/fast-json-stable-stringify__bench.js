// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

fast-json-stable-stringify - benchmark x 509,931 ops/sec ±6.50% (71 runs sampled)
JSON.stringify - benchmark x 1,675,284 ops/sec ±5.32% (73 runs sampled)
Fastest is JSON.stringify - benchmark

DENO run

fast-json-stable-stringify - benchmark x 454,659 ops/sec ±8.91% (64 runs sampled)
JSON.stringify - benchmark x 1,422,953 ops/sec ±6.44% (64 runs sampled)
Fastest is JSON.stringify - benchmark
 */

import { stringify } from '../../../vendor/fast-json-stable-stringify/fast-json-stable-stringify.js';

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// shared data
let data;

// add tests
suite
  .add('fast-json-stable-stringify - benchmark', function() {
    stringify({ c: 8, b: [{z:6,y:5,x:4},7], a: 3 });
  })

  .add('JSON.stringify - benchmark', function() {
    JSON.stringify({ c: 8, b: [{z:6,y:5,x:4},7], a: 3 });
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
