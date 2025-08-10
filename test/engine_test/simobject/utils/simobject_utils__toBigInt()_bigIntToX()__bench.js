// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

toBigInt() benchmark x 30.05 ops/sec ±1.31% (53 runs sampled)
bigIntToNumberWithDecimals() benchmark x 257 ops/sec ±2.53% (81 runs sampled)
bigIntToStringWithDecimals() benchmark x 99.43 ops/sec ±5.20% (73 runs sampled)

DENO run

toBigInt() benchmark x 21.15 ops/sec ±12.30% (38 runs sampled)
bigIntToNumberWithDecimals() benchmark x 116 ops/sec ±9.46% (63 runs sampled)
bigIntToStringWithDecimals() benchmark x 59.28 ops/sec ±8.93% (52 runs sampled)
 */

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

import { toBigInt } from '../../../../src/engine/simobject/utils/to_bigint.js';
import { bigIntToNumberWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_number_with_decimals.js';
import { bigIntToStringWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_string_with_decimals.js';

const DECIMALPLACES = 4;
const ROUNDINGMODEISROUND = true;
const loopCount = 100_000;
const loopCount_bigInt = 100_000n;

// add tests
suite
  .add('toBigInt() benchmark', function() {
    for (let i = 0; i < loopCount; i++) {
      const bigInt = toBigInt(i, DECIMALPLACES, ROUNDINGMODEISROUND);
    }
  })

  .add('bigIntToNumberWithDecimals() benchmark', function() {
    for (let i = 1n; i <= loopCount_bigInt; i++) {
      const num = bigIntToNumberWithDecimals(i, 4);
    }
  })

  .add('bigIntToStringWithDecimals() benchmark', function() {
    for (let i = 1n; i <= loopCount_bigInt; i++) {
      const str = bigIntToStringWithDecimals(i, 4);
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
