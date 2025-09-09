/*
    CPU | 12th Gen Intel(R) Core(TM) i5-1240P
Runtime | Deno 2.4.5 (x86_64-pc-windows-msvc)

file:///C:/e3/@gitwk/PUBLIC/financial-modeling/test/vendor_test/decimaljs_light__bigjs__bench/decimaljs_light__bigjs__deno_bench.js

| benchmark                                            | time/iter (avg) |        iter/s |      (min … max)      |      p75 |      p99 |     p995 |
| ---------------------------------------------------- | --------------- | ------------- | --------------------- | -------- | -------- | -------- |
| big.js  | raw  | construct+ops (int pow)             |          4.5 ms |         223.5 | (  3.8 ms …   7.9 ms) |   4.6 ms |   7.5 ms |   7.9 ms |
| decimal.js light  | raw  | construct+ops (int pow)   |          1.6 ms |         613.9 | (  1.3 ms …   3.4 ms) |   1.7 ms |   2.8 ms |   2.8 ms |
 */

// run it with `deno bench --allow-import`

// @deno-types="../../../vendor/bigjs_UNUSED/index.d.ts"
import { default as Big } from '../../../vendor/bigjs_UNUSED/big.mjs';
// @deno-types="../../../vendor/decimaljs/decimal.d.ts"
import { default as Decimal } from '../../../vendor/decimaljs/decimal.mjs';

const N = 100_000; // number of iterations

// shared data
/** @type {*} */
let data = [];

// ---------- Prepare test data (outside the bench) ----------
data = makeData(N);

Deno.bench("big.js  | raw  | construct+ops (int pow)", () => {
  let acc = 0;

  // loop `loopCount` times
  for (let i = 0; i < N; i++) {
    const a = new Big(data[i]);
    const b = new Big(data[N - 1 - i]);
    const r = a.times(b).div(i + 1).plus((i % 7) - 3).pow(2);
    acc += Number(r.toString());
  }
});

Deno.bench("decimal.js light  | raw  | construct+ops (int pow)", () => {
  let acc = 0;

  // loop `loopCount` times
  for (let i = 0; i < N; i++) {
    const a = new Decimal(data[i]);
    const b = new Decimal(data[N - 1 - i]);
    const r = a.mul(b).div(i + 1).add((i % 7) - 3).pow(2);
    acc += r.toNumber();
  }
});

/**
 * Deterministic PRNG (Mulberry32)
 * @param {number} seed
 * @returns {() => number} returns float in [0,1)
 */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ t >>> 15, 1 | t);
    x ^= x + Math.imul(x ^ x >>> 7, 61 | x);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Create deterministic test data: array of decimal strings.
 * Spread magnitudes to exercise normalization, rounding, etc.
 * @param {number} n
 * @returns {string[]}
 */
function makeData(n) {
  const rnd = mulberry32(0xC0FFEE);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    // values in (~1e-4 .. ~1e4) with 6-10 fraction digits
    const mag = Math.floor(rnd() * 9) - 4; // -4..+4
    const base = (rnd() * 9999 + 1) * (rnd() < 0.5 ? 1 : -1);
    const fracDigits = 6 + Math.floor(rnd() * 5);
    const val = base * Math.pow(10, mag);
    out[i] = val.toFixed(fracDigits);
  }
  return out;
}
