// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

date sanitization - date parse from string sanitization - ISO STRING - benchmark x 463,580 ops/sec ±4.64% (63 runs sampled)
date sanitization - date parse from string sanitization - SHORT STRING - benchmark x 527,480 ops/sec ±1.23% (87 runs sampled)
date sanitization - many sanitizations - benchmark x 98,108 ops/sec ±1.37% (89 runs sampled)
number sanitization - string to number - benchmark x 5,710,307 ops/sec ±1.37% (86 runs sampled)
number sanitization - many sanitizations - benchmark x 240,085 ops/sec ±1.19% (87 runs sampled)
Fastest is number sanitization - string to number - benchmark

DENO run

date sanitization - date parse from string sanitization - ISO STRING - benchmark x 472,531 ops/sec ±4.49% (67 runs sampled)
date sanitization - date parse from string sanitization - SHORT STRING - benchmark x 563,856 ops/sec ±1.12% (85 runs sampled)
date sanitization - many sanitizations - benchmark x 99,782 ops/sec ±1.81% (82 runs sampled)
number sanitization - string to number - benchmark x 6,119,824 ops/sec ±2.25% (88 runs sampled)
number sanitization - many sanitizations - benchmark x 258,036 ops/sec ±1.13% (88 runs sampled)
Fastest is number sanitization - string to number - benchmark
 */

import * as S from '../../src/lib/schema.js';
import * as s from '../../src/lib/schema_sanitization_utils.js';

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// shared data
let data;

// add tests
suite
  .add('date sanitization - date parse from string sanitization - ISO STRING - benchmark', function() {
    s.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: S.DATE_TYPE });
  })

  .add('date sanitization - date parse from string sanitization - SHORT STRING - benchmark', function() {
    s.sanitize({ value: '2022-12-25', sanitization: S.DATE_TYPE });
  })

  .add('date sanitization - many sanitizations - benchmark', function() {
    s.sanitize({ value: 44920, sanitization: S.DATE_TYPE });
    s.sanitize({ value: new Date(2022, 11, 25), sanitization: S.DATE_TYPE });
    s.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: S.DATE_TYPE });
    s.sanitize({ value: '2022-12-25', sanitization: S.DATE_TYPE });
    s.sanitize({ value: new Date(NaN), sanitization: S.DATE_TYPE });
    s.sanitize({ value: true, sanitization: S.DATE_TYPE });
    s.sanitize({ value: false, sanitization: S.DATE_TYPE });

    s.sanitize({ value: undefined, sanitization: S.DATE_TYPE + '?', });
    s.sanitize({ value: null, sanitization: S.DATE_TYPE + '?' });
    s.sanitize({ value: 44920, sanitization: S.DATE_TYPE + '?' });
    s.sanitize({ value: true, sanitization: S.DATE_TYPE + '?' });
    s.sanitize({ value: false, sanitization: S.DATE_TYPE + '?' });
  })

  .add('number sanitization - string to number - benchmark', function() {
    s.sanitize({ value: '999', sanitization: S.NUMBER_TYPE });
  })

  .add('number sanitization - many sanitizations - benchmark', function() {
    s.sanitize({ value: undefined, sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: null, sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: 999, sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: '', sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: 'abc', sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: new Date(2022, 11, 25), sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: new Date(NaN), sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: true, sanitization: S.NUMBER_TYPE });
    s.sanitize({ value: false, sanitization: S.NUMBER_TYPE });

    s.sanitize({ value: undefined, sanitization: S.NUMBER_TYPE + '?' });
    s.sanitize({ value: null, sanitization: S.NUMBER_TYPE + '?' });
    s.sanitize({ value: 999, sanitization: S.NUMBER_TYPE + '?' });
    s.sanitize({ value: true, sanitization: S.NUMBER_TYPE + '?' });
    s.sanitize({ value: false, sanitization: S.NUMBER_TYPE + '?' });
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
