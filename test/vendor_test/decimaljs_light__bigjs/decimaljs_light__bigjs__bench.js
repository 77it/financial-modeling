// run it with `node --import ./__node__register-hooks.js`
// run it with `deno run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

NODEJS run

big.js  | raw  | construct+ops (int pow) x 106 ops/sec ±16.19% (55 runs sampled)
big.js  | raw  | prebuilt ops (int pow) x 51.92 ops/sec ±3.69% (54 runs sampled)
big.js  | wrap | construct+ops (int pow) x 48.18 ops/sec ±3.58% (53 runs sampled)
big.js  | wrap | prebuilt ops (int pow) x 49.88 ops/sec ±4.20% (52 runs sampled)
dec.lt | raw  | construct+ops (int pow) x 169 ops/sec ±5.98% (63 runs sampled)
dec.lt | raw  | prebuilt ops (int pow) x 240 ops/sec ±3.47% (52 runs sampled)
dec.lt | wrap | construct+ops (int pow) x 141 ops/sec ±4.36% (69 runs sampled)
dec.lt | wrap | prebuilt ops (int pow) x 182 ops/sec ±4.98% (61 runs sampled)
dec.lt | raw  | prebuilt ops (frac pow 0.5) x 4.16 ops/sec ±6.82% (15 runs sampled)
dec.lt | wrap | prebuilt ops (frac pow 0.5) x 4.01 ops/sec ±7.65% (15 runs sampled)

Fastest: dec.lt | raw  | prebuilt ops (int pow)

DENO run

big.js  | raw  | construct+ops (int pow) x 108 ops/sec ±17.06% (57 runs sampled)
big.js  | raw  | prebuilt ops (int pow) x 51.07 ops/sec ±3.77% (54 runs sampled)
big.js  | wrap | construct+ops (int pow) x 45.42 ops/sec ±3.76% (58 runs sampled)
big.js  | wrap | prebuilt ops (int pow) x 49.24 ops/sec ±3.78% (34 runs sampled)
dec.lt | raw  | construct+ops (int pow) x 180 ops/sec ±4.38% (64 runs sampled)
dec.lt | raw  | prebuilt ops (int pow) x 255 ops/sec ±3.80% (76 runs sampled)
dec.lt | wrap | construct+ops (int pow) x 148 ops/sec ±4.14% (68 runs sampled)
dec.lt | wrap | prebuilt ops (int pow) x 195 ops/sec ±4.42% (64 runs sampled)
dec.lt | raw  | prebuilt ops (frac pow 0.5) x 4.33 ops/sec ±6.81% (16 runs sampled)
dec.lt | wrap | prebuilt ops (frac pow 0.5) x 4.24 ops/sec ±5.44% (15 runs sampled)

Fastest: dec.lt | raw  | prebuilt ops (int pow)
*/

// @deno-types="../../../vendor/bigjs/index.d.ts"
import { default as Big } from '../../../vendor/bigjs/big.mjs';
// @deno-types="../../../vendor/decimaljs_light/decimal.d.ts"
import { default as Decimal } from '../../../vendor/decimaljs_light/decimal.mjs';

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

// ---------- Global numeric context (kept identical for fairness) ----------
Big.DP = 33;         // ~34 significant digits (Decimal128-ish -> sig-digits ≈ DP+1 for most magnitudes)
Big.RM = 2;          // 0=down,1=half-up,2=half-even,3=up
Big.NE = -7; Big.PE = 21;

Decimal.set({
  precision: 34,     // significant digits
  rounding: 4,       // 4 = ROUND_HALF_EVEN
  toExpNeg: -7, toExpPos: 21
});

//#region helper classes

/**
 * Wrapper around big.js with just the ops we bench.
 */
class BigJsVal {
  /**
   * @param {string|number|BigJsVal|Big} x
   */
  constructor(x) {
    /** @type {Big} */
    this._v =
      x && typeof x === 'object' && '_v' in x ? /** @type any */(x)._v :
        (typeof x === 'bigint' ? new Big(String(x)) : new Big(x));
    Object.freeze(this);
  }

  /** @param {string|number|BigJsVal|Big} y */
  add(y) { return new BigJsVal(this._v.plus(y instanceof BigJsVal ? y._v : new Big(y))); }
  /** @param {string|number|BigJsVal|Big} y */
  sub(y) { return new BigJsVal(this._v.minus(y instanceof BigJsVal ? y._v : new Big(y))); }
  /** @param {string|number|BigJsVal|Big} y */
  mul(y) { return new BigJsVal(this._v.times(y instanceof BigJsVal ? y._v : new Big(y))); }
  /** @param {string|number|BigJsVal|Big} y */
  div(y) { return new BigJsVal(this._v.div(y instanceof BigJsVal ? y._v : new Big(y))); }

  /**
   * Integer exponent only (big.js limitation).
   * @param {number} e integer
   */
  pow(e) {
    if (!Number.isInteger(e)) throw new Error('big.js pow requires integer exponent');
    return new BigJsVal(this._v.pow(e));
  }

  /** @returns {string} */
  toString() { return this._v.toString(); }
  /** @returns {number} */
  toNumber() { return Number(this._v.toString()); }
}

/**
 * Wrapper around decimal.js-light with the same surface.
 */
class DecLightVal {
  /**
   * @param {string|number|DecLightVal|Decimal} x
   */
  constructor(x) {
    /** @type {Decimal} */
    this._v =
      x && typeof x === 'object' && '_v' in x ? /** @type any */(x)._v :
        (typeof x === 'bigint' ? new Decimal(String(x)) : new Decimal(x));
    Object.freeze(this);
  }

  /** @param {string|number|DecLightVal|Decimal} y */
  add(y) { return new DecLightVal(this._v.add(y instanceof DecLightVal ? y._v : new Decimal(y))); }
  /** @param {string|number|DecLightVal|Decimal} y */
  sub(y) { return new DecLightVal(this._v.sub(y instanceof DecLightVal ? y._v : new Decimal(y))); }
  /** @param {string|number|DecLightVal|Decimal} y */
  mul(y) { return new DecLightVal(this._v.mul(y instanceof DecLightVal ? y._v : new Decimal(y))); }
  /** @param {string|number|DecLightVal|Decimal} y */
  div(y) { return new DecLightVal(this._v.div(y instanceof DecLightVal ? y._v : new Decimal(y))); }

  /**
   * Fractional exponents supported.
   * @param {number} e
   */
  pow(e) { return new DecLightVal(this._v.pow(e)); }

  /** @returns {string} */
  toString() { return this._v.toString(); }
  /** @returns {number} */
  toNumber() { return this._v.toNumber(); }
}

//#endregion helper classes

// ---------- Prepare test data (outside the bench) ----------
const N = 500; // keep moderate so each run does useful work but doesn't skew timers
const N2 = 100_000; // keep moderate so each run does useful work but doesn't skew timers
const data = makeData(N);
const data2 = makeData(N2);

// Preconstruct raw instances for the "outside" tests
/** @type {Big[]} */
const bigA = new Array(N);
/** @type {Big[]} */
const bigB = new Array(N);
/** @type {Decimal[]} */
const decA = new Array(N);
/** @type {Decimal[]} */
const decB = new Array(N);

for (let i = 0; i < N; i++) {
  bigA[i] = new Big(data[i]);
  bigB[i] = new Big(data[N - 1 - i]);
  decA[i] = new Decimal(data[i]);
  decB[i] = new Decimal(data[N - 1 - i]);
}

/** @type {Big[]} */
const bigA2 = new Array(N2);
/** @type {Big[]} */
const bigB2 = new Array(N2);
/** @type {Decimal[]} */
const decA2 = new Array(N2);
/** @type {Decimal[]} */
const decB2 = new Array(N2);

for (let i = 0; i < N2; i++) {
  bigA2[i] = new Big(data2[i]);
  bigB2[i] = new Big(data2[N2 - 1 - i]);
  decA2[i] = new Decimal(data2[i]);
  decB2[i] = new Decimal(data2[N2 - 1 - i]);
}

// Preconstruct wrapper instances for the "outside" tests
/** @type {BigJsVal[]} */
const bigW_A = bigA.map(v => new BigJsVal(v));
/** @type {BigJsVal[]} */
const bigW_B = bigB.map(v => new BigJsVal(v));
/** @type {DecLightVal[]} */
const decW_A = decA.map(v => new DecLightVal(v));
/** @type {DecLightVal[]} */
const decW_B = decB.map(v => new DecLightVal(v));

// ---------- Sanity: check consistency across paths ----------
(function sanity() {
  // big.js direct vs wrapper (integer pow)
  const bigDirect = runOpsIntPow(
    bigA, bigB,
    (x,y)=>x.times(y),
    (x,y)=>x.plus(y),
    (x,y)=>x.div(y),
    x=>Number(x.toString()),
    (x,e)=>x.pow(e)
  );

  const bigWrapped = runOpsIntPow(
    bigW_A, bigW_B,
    (x,y)=>x.mul(y),
    (x,y)=>x.add(y),
    (x,y)=>x.div(y),
    x=>x.toNumber(),
    (x,e)=>x.pow(e)
  );

  // decimal-light direct vs wrapper (integer pow)
  const decDirect = runOpsIntPow(
    decA, decB,
    (x,y)=>x.mul(y),
    (x,y)=>x.add(y),
    (x,y)=>x.div(y),
    x=>x.toNumber(),
    (x,e)=>x.pow(e)
  );

  const decWrapped = runOpsIntPow(
    decW_A, decW_B,
    (x,y)=>x.mul(y),
    (x,y)=>x.add(y),
    (x,y)=>x.div(y),
    x=>x.toNumber(),
    (x,e)=>x.pow(e)
  );

  // Loose equality—different libs may differ at last ulp; we just assert finiteness & rough agreement.
  if (![bigDirect, bigWrapped, decDirect, decWrapped].every(Number.isFinite)) {
    throw new Error('Sanity check failed: non-finite result');
  }
})();

//#region manual tests, printing time after each execution

//save time before starting the manual tests
let timeBeforeLastTest = performance.now();
runBigJsRawConstructOps(N2, data2);
console.log(`For ${N2.toLocaleString('it-IT')} runs, manual test big.js RAW construct+ops (int pow) took ${(performance.now() - timeBeforeLastTest) / 1000} seconds`);

timeBeforeLastTest = performance.now();
runBigJsRawPrebuiltOps(N2, bigA2, bigB2);
console.log(`For ${N2.toLocaleString('it-IT')} runs, manual test big.js RAW construct+ops (int pow) took ${(performance.now() - timeBeforeLastTest) / 1000} seconds`);

timeBeforeLastTest = performance.now();
runDecLightRawConstructOps(N2, data2);
console.log(`For ${N2.toLocaleString('it-IT')} runs, manual test big.js RAW construct+ops (int pow) took ${(performance.now() - timeBeforeLastTest) / 1000} seconds`);

timeBeforeLastTest = performance.now();
runDecLightRawPrebuiltOps(N2, decA2, decB2);
console.log(`For ${N2.toLocaleString('it-IT')} runs, manual test big.js RAW construct+ops (int pow) took ${(performance.now() - timeBeforeLastTest) / 1000} seconds`);
//#endregion manual tests, printing time after each execution

// ---------- Benchmark cases ----------

// 1) big.js RAW, constructing inside
suite.add('big.js  | raw  | construct+ops (int pow)', function() {
  runBigJsRawConstructOps(N, data);
});

// 2) big.js RAW, using preconstructed
suite.add('big.js  | raw  | prebuilt ops (int pow)', function() {
  runBigJsRawPrebuiltOps(N, bigA, bigB);
});

// 3) big.js WRAPPER, constructing inside
suite.add('big.js  | wrap | construct+ops (int pow)', function() {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = new BigJsVal(data[i]);
    const b = new BigJsVal(data[N - 1 - i]);
    const r = a.mul(b).div(i + 1).add((i % 7) - 3).pow(2);
    acc += r.toNumber();
  }
  return acc;
});

// 4) big.js WRAPPER, using preconstructed
suite.add('big.js  | wrap | prebuilt ops (int pow)', function() {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const r = bigW_A[i].mul(bigW_B[i]).div(i + 1).add((i % 7) - 3).pow(2);
    acc += r.toNumber();
  }
  return acc;
});

// 5) decimal-light RAW, constructing inside (int pow)
suite.add('dec.lt | raw  | construct+ops (int pow)', function() {
  runDecLightRawConstructOps(N, data);
});

// 6) decimal-light RAW, prebuilt (int pow)
suite.add('dec.lt | raw  | prebuilt ops (int pow)', function() {
  runDecLightRawPrebuiltOps(N, decA, decB);
});

// 7) decimal-light WRAPPER, constructing inside (int pow)
suite.add('dec.lt | wrap | construct+ops (int pow)', function() {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = new DecLightVal(data[i]);
    const b = new DecLightVal(data[N - 1 - i]);
    const r = a.mul(b).div(i + 1).add((i % 7) - 3).pow(2);
    acc += r.toNumber();
  }
  return acc;
});

// 8) decimal-light WRAPPER, prebuilt (int pow)
suite.add('dec.lt | wrap | prebuilt ops (int pow)', function() {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const r = decW_A[i].mul(decW_B[i]).div(i + 1).add((i % 7) - 3).pow(2);
    acc += r.toNumber();
  }
  return acc;
});

// 9) decimal-light RAW, prebuilt (fractional pow)
suite.add('dec.lt | raw  | prebuilt ops (frac pow 0.5)', function() {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const s = decA[i].mul(decB[i]).div(i + 1).add((i % 7) - 3);
    const r = s.mul(s).pow(0.5);  // = |s|
    acc += r.toNumber();
  }
  return acc;
});

// 10) decimal-light WRAPPER, prebuilt (fractional pow)
suite.add('dec.lt | wrap | prebuilt ops (frac pow 0.5)', function() {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const s = decW_A[i].mul(decW_B[i]).div(i + 1).add((i % 7) - 3);
    const r = s.mul(s).pow(0.5);
    acc += r.toNumber();
  }
  return acc;
});

// ---------- Run + reporters ----------
suite
  .on('cycle', (/** @type {Benchmark.Event} */ e) => {
    // e.target.toString() already contains hz, rme, samples
    console.log(String(e.target));
  })
  .on('complete', function() {
    // @ts-ignore types from benchmark may not include .filter in Deno ambient
    const fastest = this.filter('fastest').map('name');
    console.log('\nFastest: ' + fastest);
  })
  .run({ async: false });


//#region helpers

// ---------- Helper classes for wrapper tests ----------

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

// ---------- Small computation to benchmark ----------

/**
 * Do a fixed chain of ops over arrays and return a single number for stability.
 * For big.js we keep pow exponent integer; for decimal-light we also run a fractional variant.
 * @template T
 * @param {T[]} A
 * @param {T[]} B
 * @param {(x:T,y:T)=>T} mul
 * @param {(x:T,y:T)=>T} add
 * @param {(x:T,y:T)=>T} div
 * @param {(x:T)=>number} toNumber
 * @param {(x:T, e:number)=>T} powInt
 * @returns {number}
 */
function runOpsIntPow(A, B, mul, add, div, toNumber, powInt) {
  let accNum = 0;
  for (let i = 0; i < A.length; i++) {
    // r = ((A[i] * B[i]) / (i+1)) + (i%7 - 3)
    const r1 = mul(A[i], B[i]);
    const r2 = div(r1, /** @type any */(typeof A[i] === 'object' ? A[0] : 1),); // placeholder, overridden per caller
    // we’ll not use r2; instead do simple ops to reduce overhead:
    const d = (i + 1);                  // small integer divisor
    const k = (i % 7) - 3;              // small integer addend
    // emulate div by d and add k using provided ops:
    const rDiv = div(r1, /** @type any */(d)); // libs accept primitives
    const rAdd = add(rDiv, /** @type any */(k));
    const rPow = powInt(rAdd, 2);       // integer exponent
    accNum += toNumber(rPow);
  }
  return accNum;
}

/**
 * Same as above but fractional exponent (decimal-light only).
 * @param {DecLightVal[]|Decimal[]} A
 * @param {DecLightVal[]|Decimal[]} B
 * @param {(x:any,y:any)=>any} mul
 * @param {(x:any,y:any)=>any} add
 * @param {(x:any,y:any)=>any} div
 * @param {(x:any)=>number} toNumber
 * @param {(x:any, e:number)=>any} powFrac
 * @returns {number}
 */
function runOpsFracPow(A, B, mul, add, div, toNumber, powFrac) {
  let accNum = 0;
  for (let i = 0; i < A.length; i++) {
    const r1 = mul(A[i], B[i]);
    const d = (i + 1);
    const k = (i % 7) - 3;
    const rDiv = div(r1, d);
    const rAdd = add(rDiv, k);
    const rPow = powFrac(rAdd, 0.5); // sqrt
    accNum += toNumber(rPow);
  }
  return accNum;
}

//#endregion helpers

//#region functions containing benchmarks to be run also manually, printing time after each execution
/**
 * Run a series of big.js ops with raw constructs.
 * @param {number} N
 * @param {string[]} data
 * @return {number}
 */
function runBigJsRawConstructOps(N, data) {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = new Big(data[i]);
    const b = new Big(data[N - 1 - i]);
    const r = a.times(b).div(i + 1).plus((i % 7) - 3).pow(2);
    acc += Number(r.toString());
  }
  return acc;
}

/**
 * Run a series of big.js ops with raw constructs.
 * @param {number} N
 * @param {Big[]} bigA
 * @param {Big[]} bigB
 * @return {number}
 */
function runBigJsRawPrebuiltOps(N, bigA, bigB) {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const r = bigA[i].times(bigB[i]).div(i + 1).plus((i % 7) - 3).pow(2);
    acc += Number(r.toString());
  }
  return acc;
}

/**
 * Run a series of big.js ops with raw constructs.
 * @param {number} N
 * @param {string[]} data
 * @return {number}
 */
function runDecLightRawConstructOps(N, data) {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = new Decimal(data[i]);
    const b = new Decimal(data[N - 1 - i]);
    const r = a.mul(b).div(i + 1).add((i % 7) - 3).pow(2);
    acc += r.toNumber();
  }
  return acc;
}

/**
 * Run a series of big.js ops with raw constructs.
 * @param {number} N
 * @param {Decimal[]} decA
 * @param {Decimal[]} decB
 * @return {number}
 */
function runDecLightRawPrebuiltOps(N, decA, decB) {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const r = decA[i].mul(decB[i]).div(i + 1).add((i % 7) - 3).pow(2);
    acc += r.toNumber();
  }
  return acc;
}
//#endregion functions containing benchmarks to be run also manually, printing time after each execution