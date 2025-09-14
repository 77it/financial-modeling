/*
**Purpose:**
Stress-test the **`fxPmt`** function (payment calculation) under a wide variety of randomized inputs.

**How it works:**

* Implements a reference PMT formula using **Decimal.js** (`pmtDec`).
* Generates random values for:

  * interest rate `r` (including zero and small rates),
  * number of periods `n`,
  * present value (PV) and optional future value (FV),
  * annuity type (`due` vs ordinary),
  * sign convention (`sameAsPV` vs `excelCompat`).
* Runs thousands of random cases (`iterations` parameter).
* Converts both the BigInt result and the Decimal reference to the same **scale-20 representation**.
* Compares them **in ULPs** (scaled integer units) with a tolerance (default: **200 ULPs**).
* Reports mismatches with diagnostic info but passes as long as all results are within tolerance.

**Goal:**
Check that `fxPmt` is numerically stable and consistent with financial math, even under random edge cases, while acknowledging small rounding path differences.
 */

import { Decimal } from '../../vendor/decimaljs/decimal.js';
import {
  _TEST_ONLY__set as _TEST_ONLY__set_arithmetic,
  stringToBigIntScaled,
  bigIntScaledToString,
} from '../../src/lib/bigint_decimal_scaled.arithmetic.js';
import { _TEST_ONLY__set as _TEST_ONLY__set_finance, fxPmt, fxPowInt } from '../../src/lib/bigint_decimal_scaled.finance.js';
import { ROUNDING_MODES } from '../../src/config/engine.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const MATH_SCALE = 20;
const ACCOUNTING_DECIMAL_PLACES = 4;
// first set
_TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
_TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

// ------------------------------ Decimal config -------------------------------
/** Configure decimal.js-light for finance: high precision + HALF_EVEN. */
Decimal.set({
  precision: 50, // plenty for cross-checks vs scale-20 BigInt
  rounding: Decimal.ROUND_HALF_EVEN, // banker’s rounding
  toExpNeg: -9, toExpPos: 20,
});

// ------------------------------ PMT in Decimal -------------------------------
/**
 * PMT using decimal.js-light (raw math convention: SAME sign as PV).
 * Negation for Excel semantics is applied by caller when needed.
 *
 * @param {number|string} r  rate per period (e.g., 0.05)
 * @param {number} n         number of periods (>= 1, integer)
 * @param {number|string} pv present value
 * @param {number|string} fv future value (default 0)
 * @param {boolean} due      true for annuity-due
 * @returns {Decimal} payment (same sign as PV by default)
 */
function pmtDec (r, n, pv, fv = 0, due = false) {
  const R = new Decimal(r);
  const N = new Decimal(n);
  const PV = new Decimal(pv);
  const FV = new Decimal(fv);

  if (!N.isint() || N.lte(0)) throw new RangeError('n must be a positive integer');

  if (R.isZero()) {
    let p = PV.plus(FV).div(N); // SAME sign as PV
    if (due) p = p; // due makes no difference when r=0
    return p;
  }

  const onePlusR = R.add(1);
  const pow = onePlusR.pow(N);
  let p = R.times(PV.times(pow).plus(FV)).div(pow.minus(1)); // SAME sign as PV
  if (due) p = p.div(onePlusR);
  return p;
}

// ------------------------------ RNG (deterministic) --------------------------
/** Simple xorshift32 for reproducible randomness. */
function makeRng (seed = 0xC0FFEE) {
  let x = seed >>> 0;
  return function rand () {
    // xorshift32
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    return (x >>> 0) / 0x100000000; // [0,1)
  };
}

// ------------------------------ Helpers --------------------------------------
/**
 * Convert a BigInt-scaled amount to Decimal via your formatter.
 * @param {bigint} sig
 * @returns {Decimal}
 */
function decFromScaled (sig) {
  return new Decimal(bigIntScaledToString(sig));
}

/**
 * Convert a Decimal to your BigInt-scaled amount using your parser.
 * @param {Decimal} d
 * @returns {bigint}
 */
function scaledFromDec (d) {
  return stringToBigIntScaled(d.toString());
}

/**
 * Compute absolute difference in ULPs (scaled BigInt units).
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function ulpDiff (a, b) {
  return (a >= b) ? (a - b) : (b - a);
}

/**
 * Random decimal string with controlled magnitude.
 * @param {Function} rand
 * @param {number} maxAbs
 * @param {number} maxDp
 * @returns {string}
 */
function randDecStr (rand, maxAbs, maxDp) {
  const sign = rand() < 0.5 ? '-' : '';
  // spread roughly log-uniform
  const mag = Math.exp(rand() * Math.log(maxAbs + 1)) - 1;
  const dp = Math.floor(rand() * (maxDp + 1));
  const val = (Math.round(mag * 10 ** dp) / 10 ** dp).toFixed(dp);
  // avoid "-0"
  return (sign === '-' && Number(val) === 0 ? '0' : sign + val);
}

/** Pick a random element. */
/**
 * @param {Function} rand
 * @param {any[]} arr
 */
function pick (rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

// ------------------------------ Cross-check ----------------------------------
/**
 * Run random tests comparing fxPmt (BigInt) vs pmtDec (Decimal).
 * We compare in BigInt space (ULPs). Allow a small tolerance to cover
 * benign rounding path differences (e.g., guard-digit strategies).
 *
 * @param {Object} opts
 * @param {number} opts.iterations
 * @param {number} opts.seed
 * @param {number} opts.ulpTolerance  allowed ULPs difference (e.g., 200)
 */
function runCrossCheck ({ iterations = 2000, seed = 0xBADC0DE, ulpTolerance = 200 }) {
  const rand = makeRng(seed);

  let failures = 0;

  for (let i = 0; i < iterations; i++) {
    // Random n, due, sign convention
    const n = pick(rand, [1, 2, 3, 6, 12, 24, 36, 60, 120, 240, 360, 600]);
    const due = rand() < 0.5;
    const excelCompat = rand() < 0.5;

    // Random rate r (include zeros and small magnitudes)
    const rStr = (rand() < 0.15)
      ? '0' // zero-rate branch frequently
      : randDecStr(rand, /*maxAbs*/ 0.25, /*maxDp*/ 6); // up to ±25% per period

    // Random PV / FV
    const pvStr = randDecStr(rand, 2e6, 4); // up to ~2,000,000 with ~4dp
    const fvStr = rand() < 0.3 ? randDecStr(rand, 2e6, 4) : '0';

    const rSig = stringToBigIntScaled(rStr);
    const pvSig = stringToBigIntScaled(pvStr);
    const fvSig = stringToBigIntScaled(fvStr);

    // BigInt engine PMT
    const pmtSig = fxPmt(
      rSig, n, pvSig, fvSig,
      due,
      excelCompat ? 'excelCompat' : 'sameAsPV'
    );

    // Decimal reference PMT (same sign as PV by formula)
    let pmtDecVal = pmtDec(rStr, n, pvStr, fvStr, due);
    if (excelCompat) pmtDecVal = pmtDecVal.neg(); // flip for Excel parity

    const pmtRefSig = scaledFromDec(pmtDecVal);

    const diff = ulpDiff(pmtSig, pmtRefSig);

    if (diff > BigInt(ulpTolerance)) {
      failures++;
      // Helpful diagnostic logging for the first few mismatches
      if (failures <= 10) {
        console.error('Mismatch:', {
          r: rStr, n, due, excelCompat,
          pv: pvStr, fv: fvStr,
          ours: bigIntScaledToString(pmtSig),
          ref: bigIntScaledToString(pmtRefSig),
          diff_ulps: diff.toString(),
        });
      }
    }
  }

  if (failures > 0) {
    assert.fail(`${failures} / ${iterations} cases exceeded tolerance`);
  } else {
    console.log(`All ${iterations} cases within ${ulpTolerance} ULPs`);
  }
}

t('Stress-tests fxPmt against Decimal.js with randomized inputs, allowing small ULP tolerance.', () => {
  runCrossCheck({
    iterations: 3000,
    seed: 0xDEADBEEF,
    ulpTolerance: 200, // tune if your guard-digit policy is tighter/looser
  });
});
