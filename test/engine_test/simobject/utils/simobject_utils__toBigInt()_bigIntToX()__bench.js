// run it with `deno bench`

/*
benchmark                                time/iter (avg)        iter/s      (min … max)           p75      p99     p995
---------------------------------------- ----------------------------- --------------------- --------------------------
toBigInt() benchmark                             30.8 ms          32.5 ( 28.2 ms …  38.0 ms)  31.5 ms  38.0 ms  38.0 ms
bigIntToNumberWithDecimals() benchmark            4.3 ms         230.6 (  3.6 ms …   7.8 ms)   4.6 ms   7.5 ms   7.8 ms
bigIntToStringWithDecimals() benchmark            8.6 ms         116.5 (  7.8 ms …  11.9 ms)   8.7 ms  11.9 ms  11.9 ms
 */

import { toBigInt } from '../../../../src/engine/simobject/utils/to_bigint.js';
import { bigIntToNumberWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_number_with_decimals.js';
import { bigIntToStringWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_string_with_decimals.js';
import assert from 'node:assert';

const loopCount = 100_000;
const loopCount_bigInt = 100_000n;
const DECIMALPLACES = 4;
const ROUNDINGMODEISROUND = true;

Deno.bench("toBigInt() benchmark", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const bigInt = toBigInt(i, DECIMALPLACES, ROUNDINGMODEISROUND);
  }
});

Deno.bench("bigIntToNumberWithDecimals() benchmark", () => {
  // loop `loopCount_bigInt` times
  for (let i = 1n; i <= loopCount_bigInt; i++) {
    const num = bigIntToNumberWithDecimals(i, 4);
  }
});

Deno.bench("bigIntToStringWithDecimals() benchmark", () => {
  // loop `loopCount_bigInt` times
  for (let i = 1n; i <= loopCount_bigInt; i++) {
    const str = bigIntToStringWithDecimals(i, 4);
  }
});

