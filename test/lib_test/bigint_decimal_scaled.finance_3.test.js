// file bigint_decimal_scaled.finance_3.test.js
/*
**Purpose:**
Regression test the **entire BigInt fixed-point library** (both arithmetic and finance helpers).

**How it works:**

* Configures both libraries to the same scale and rounding mode.
* Validates, with **strict equality** (no tolerance), against Decimal.js at 20 decimal places:

  * Parsing / formatting (`stringToBigIntScaled`, `bigIntScaledToString`).
  * Arithmetic (`fxAdd`, `fxSub`, `fxMul`, `fxDiv`).
  * Quantization to accounting decimals (`reduceToAccounting`).
  * Exponentiation (`fxPowInt`).
  * Net present value (`fxNPV`).
  * Payment and amortization (`fxPmt`, `fxAmortizationSchedule`).
* Includes deterministic random test cases for NPV and amortization checks.
* Any mismatch, even a single ULP, fails the test.

**Goal:**
Serve as a **strict regression suite**: guarantees that your BigInt engine exactly matches the chosen Decimal reference at scale=20 across all operations.
 */

import { Decimal } from "../../vendor/decimaljs/decimal.js";
import {
  _TEST_ONLY__set as _TEST_ONLY__set_arith,
  stringToBigIntScaled, bigIntScaledToString,
  fxAdd, fxSub, fxMul, fxDiv, reduceToAccounting,
} from "../../src/lib/bigint_decimal_scaled.arithmetic.js";
import {
  _TEST_ONLY__set as _TEST_ONLY__set_fin,
  fxPowInt, fxNPV, fxPmt, fxAmortizationSchedule,
} from "../../src/lib/bigint_decimal_scaled.finance.js";
import { ROUNDING_MODES } from "../../src/config/engine.js";
import {
  MATH_SCALE, ACCOUNTING_DECIMAL_PLACES, makeRng,
  decToSig20, decSnapToAccountingSig20, pow10n,
  genDecimalStrings, genPairs,
} from "./bigint_decimal_scaled.common.js";

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const CFG = { N: 4000, SEED: 0xA5F00D, DEC_ROUND: Decimal.ROUND_HALF_EVEN, SHOW_DETAILS_ON_FAIL: true };
Decimal.set({ precision: 80, rounding: CFG.DEC_ROUND });

// ensure both libs share the same config
//@ts-ignore .
function setMode(roundingMode) {
  _TEST_ONLY__set_arith({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode });
  _TEST_ONLY__set_fin({  decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode });
}

t('Strict regression test of all BigInt arithmetic/finance functions against Decimal.js at scale=20', () => {
  // make sure both libs are on the expected config (scale=20 etc.)
  setMode(ROUNDING_MODES.HALF_EVEN);
  const rng = makeRng(CFG.SEED);
  const STRS = genDecimalStrings(rng, CFG.N);

  // Parse
  for (const s of STRS) {
    const sig = stringToBigIntScaled(s);
    const ref = decToSig20(new Decimal(s));
    if (sig !== ref) {
      if (CFG.SHOW_DETAILS_ON_FAIL) {
        console.error("Parse mismatch", { s, ours: sig.toString(), ref: ref.toString() });
      }
      assert.strictEqual(sig, ref);
    }
  }

  const BIG = STRS.map(stringToBigIntScaled);
  //@ts-ignore .
  const DEC = STRS.map((s) => new Decimal(s));

  // Add/Sub
  {
    const [A, B] = genPairs(BIG);
    const [DA, DB] = genPairs(DEC);
    for (let i = 0; i < A.length; i++) {
      assert.strictEqual(fxAdd(A[i], B[i]), decToSig20(DA[i].plus(DB[i])));
      assert.strictEqual(fxSub(A[i], B[i]), decToSig20(DA[i].minus(DB[i])));
    }
  }

  // Mul/Div HALF_EVEN and HALF_UP
  {
    const [A, B] = genPairs(BIG);
    const [DA, DB] = genPairs(DEC);

    // HALF_EVEN
    Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
    setMode(ROUNDING_MODES.HALF_EVEN);
    for (let i = 0; i < A.length; i++) {
      assert.strictEqual(fxMul(A[i], B[i]), decToSig20(DA[i].times(DB[i])));
      if (!DB[i].isZero()) {
        assert.strictEqual(fxDiv(A[i], B[i]), decToSig20(DA[i].div(DB[i])));
      }
    }

    // HALF_UP
    Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
    setMode(ROUNDING_MODES.HALF_UP);
    for (let i = 0; i < A.length; i++) {
      assert.strictEqual(fxMul(A[i], B[i]), decToSig20(DA[i].times(DB[i])));
      if (!DB[i].isZero()) {
        assert.strictEqual(fxDiv(A[i], B[i]), decToSig20(DA[i].div(DB[i])));
      }
    }

    Decimal.set({ rounding: CFG.DEC_ROUND });
  }

  // Accounting quantize (4dp): HALF_EVEN then HALF_UP
  {
    const dUp = Decimal.ROUND_HALF_UP;
    const dEven = Decimal.ROUND_HALF_EVEN;

    Decimal.set({ rounding: dEven }); setMode(ROUNDING_MODES.HALF_EVEN);
    for (let i = 0; i < BIG.length; i++) {
      assert.strictEqual(reduceToAccounting(BIG[i]), decSnapToAccountingSig20(DEC[i], dEven));
    }

    Decimal.set({ rounding: dUp }); setMode(ROUNDING_MODES.HALF_UP);
    for (let i = 0; i < BIG.length; i++) {
      assert.strictEqual(reduceToAccounting(BIG[i]), decSnapToAccountingSig20(DEC[i], dUp));
    }

    Decimal.set({ rounding: CFG.DEC_ROUND });
  }

  // (1+r)^n via fxPowInt
  {
    const rates = ["-0.2","0","0.0001","0.01","0.05","0.1234"].map(stringToBigIntScaled);
    const Ns = [0,1,2,5,10,25,50];
    Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
    for (const rSig of rates) {
      const rDec = new Decimal(bigIntScaledToString(rSig));
      for (const n of Ns) {
        const baseSig = fxAdd(pow10n(MATH_SCALE), rSig);
        assert.strictEqual(fxPowInt(baseSig, n), decToSig20(new Decimal(1).plus(rDec).pow(n)));
      }
    }
  }

  // NPV
  {
    const rng2 = makeRng(CFG.SEED ^ 0x999);
    for (let caseIdx = 0; caseIdx < 200; caseIdx++) {
      const len = 3 + Math.floor(rng2() * 6);
      const cfsSig = [], cfsDec = [];
      for (let t = 0; t < len; t++) {
        const val = (rng2() * 2000 - 1000).toFixed(4);
        const s = (t === 0 && !val.startsWith("-")) ? "-" + val : val;
        cfsSig.push(stringToBigIntScaled(s));
        cfsDec.push(new Decimal(s));
      }
      const r = stringToBigIntScaled((rng2() * 0.3 - 0.1).toFixed(6));
      const rDec = new Decimal(bigIntScaledToString(r));
      // Decimal ref
      let refDec = new Decimal(0);
      for (let t = 0; t < len; t++) refDec = refDec.plus(cfsDec[t].div(new Decimal(1).plus(rDec).pow(t)));
      assert.strictEqual(fxNPV(r, cfsSig), decToSig20(refDec));
    }
  }

  // PMT + amortization last balance ≈ 0 (exact equality at 20dp)
  {
    const rng3 = makeRng(CFG.SEED ^ 0x1234);
    setMode(ROUNDING_MODES.HALF_EVEN);
    for (let k = 0; k < 50; k++) {
      const principal = stringToBigIntScaled((rng3()*100000 + 1000).toFixed(2));
      const r = stringToBigIntScaled((rng3()*0.05).toFixed(6));
      const n = 6 + Math.floor(rng3()*24);

      const pmt = fxPmt(r, n, principal);
      const { rows } = fxAmortizationSchedule(principal, r, n, false);
      const lastBal = rows?.at(-1)?.balance;

      // Decimal baseline
      const Pd = new Decimal(bigIntScaledToString(principal));
      const rd = new Decimal(bigIntScaledToString(r));
      const ONEd = new Decimal(1);
      const pow = ONEd.plus(rd).pow(n);
      const pmtD = rd.times(Pd).times(pow).div(pow.minus(ONEd));
      let bal = Pd;
      for (let i = 1; i <= n; i++) {
        const interest = bal.times(rd);
        let principalPart = pmtD.minus(interest);
        if (i === n) principalPart = bal;
        bal = bal.minus(principalPart);
      }
      assert.strictEqual(pmt, decToSig20(pmtD));
      assert.strictEqual(lastBal, decToSig20(bal));
    }
  }
});
