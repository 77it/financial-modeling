#!/usr/bin/env node
// Correctness cross-check + benchmarks for BigInt fixed-point (MATH_SCALE=20)
// vs decimal.js-light. Node ESM.
// Run: node --expose-gc bench_and_check_fixedpoint_vs_decimal.js
// Deps: npm i decimal.js-light

import assert from "node:assert";
import process from "node:process";

import { Decimal } from '../../vendor/decimaljs/decimal.js';
import {
    _TEST_ONLY__set as _TEST_ONLY__set_arithmetic,
    stringToBigIntScaled,
    bigIntScaledToString,
    fxAdd, fxSub, fxMul, fxDiv,
    reduceToAccounting,
} from '../../src/lib/bigint_decimal_scaled.arithmetic.js';
import { _TEST_ONLY__set as _TEST_ONLY__set_finance, fxPowInt, fxNPV, fxPmt, fxAmortizationSchedule } from '../../src/lib/bigint_decimal_scaled.finance.js';
import { ROUNDING_MODES } from '../../src/config/engine.js';

const MATH_SCALE = 20;
const ACCOUNTING_DECIMAL_PLACES = 4;
// first set
_TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
_TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

/** ---------------------------
 *  Config (tweak as you like)
 *  ---------------------------
 */
const CFG = {
    N: 4000,                // samples per batch
    ITERS: 5,               // iterations for perf benches
    SEED: 0xA5F00D,         // deterministic RNG seed
    DEC_ROUND: Decimal.ROUND_HALF_EVEN, // global rounding for Decimal
    SHOW_DETAILS_ON_FAIL: true,
};

Decimal.set({ precision: 80, rounding: CFG.DEC_ROUND });

/** ---------------------------
 *  Utilities
 *  ---------------------------
 */

/**
 * Simple LCG-like RNG; returns uniform [0,1).
 * @param {number} seed
 * @return {function(): *}
 */
function makeRng(seed) {
    let x = seed >>> 0;
    return () => {
        x ^= x << 13; x >>>= 0;
        x ^= x >> 17; x >>>= 0;
        x ^= x << 5;  x >>>= 0;
        return x / 0x100000000;
    };
}

/**
 * Pad a string on the left with spaces to a given width.
 * @param {string} s
 * @param {number} w
 * @returns {string}
 */
function pad(s, w) { s = String(s); return s.length >= w ? s : " ".repeat(w - s.length) + s; }

//@ts-ignore .
function maybeGC() { if (globalThis.gc) globalThis.gc(); }

/** Convert Decimal to our scale-20 BigInt via toFixed(MATH_SCALE). */
//@ts-ignore .
function decToSig20(d) {
    const s = d.toFixed(MATH_SCALE);
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const [int, frac = ""] = t.split(".");
    const merged = (int + frac.padEnd(MATH_SCALE, "0")).replace(/^0+(?=\d)/, "") || "0";
    const sig = BigInt(merged);
    return neg ? -sig : sig;
}

/** Snap Decimal to accounting grid (4 dp), re-upscale to scale-20 BigInt. */
//@ts-ignore .
function decSnapToAccountingSig20(d, roundingMode) {
    const prev = Decimal.rounding;
    Decimal.set({ rounding: roundingMode });
    const s = d.toFixed(ACCOUNTING_DECIMAL_PLACES);
    Decimal.set({ rounding: prev });
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const [int, frac = ""] = t.split(".");
    const merged = int + frac.padEnd(ACCOUNTING_DECIMAL_PLACES, "0") + "0".repeat(MATH_SCALE - ACCOUNTING_DECIMAL_PLACES);
    const mergedClean = merged.replace(/^0+(?=\d)/, "") || "0";
    const sig = BigInt(mergedClean);
    return neg ? -sig : sig;
}

/** hrtime-based micro bench helper */
//@ts-ignore .
function bench(name, fn, { warmup = 1, iters = CFG.ITERS } = {}) {
    for (let i = 0; i < warmup; i++) fn();
    maybeGC();
    const start = process.hrtime.bigint();
    for (let i = 0; i < iters; i++) fn();
    const end = process.hrtime.bigint();
    const ns = Number(end - start);
    const opsPerSec = (iters * 1e9) / ns;
    console.log(`${pad(name, 40)}  ${opsPerSec.toFixed(1)} ops/sec`);
}

/** ---------------------------
 *  Data generation
 *  ---------------------------
 */
//@ts-ignore .
function genDecimalStrings(rng, n) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
        // varying magnitudes; mix plain + e-notation
        const int = Math.floor(rng() * 1e6);            // up to 6 int digits
        const fracLen = Math.floor(rng() * 14);         // up to 13 frac digits
        let frac = "";
        for (let k = 0; k < fracLen; k++) frac += Math.floor(rng() * 10);
        const sign = rng() < 0.5 ? "" : "-";
        const base = `${sign}${int}.${frac || "0"}`;

        if (rng() < 0.25) {
            const e = Math.floor(rng() * 14) - 7;         // exponent -7..+6
            out[i] = `${base}e${e >= 0 ? "+" : ""}${e}`;
        } else {
            out[i] = base;
        }
    }
    return out;
}

//@ts-ignore .
function genPairs(arr, rng) {
    const n = arr.length;
    const A = new Array(n), B = new Array(n);
    for (let i = 0; i < n; i++) {
        const j = (i * 48271 + 1) % n; // cheap LCG-ish pairing
        A[i] = arr[i];
        B[i] = arr[j];
    }
    return [A, B];
}

/** ---------------------------
 *  Correctness cross-checks
 *  ---------------------------
 */
function crossCheckAll() {
    const rng = makeRng(CFG.SEED);
    const STRS = genDecimalStrings(rng, CFG.N);

    // --- Parsing ---
    for (const s of STRS) {
        const sig = stringToBigIntScaled(s);
        const dec = new Decimal(s);
        const ref = decToSig20(dec);
        if (sig !== ref) {
            if (CFG.SHOW_DETAILS_ON_FAIL) {
                console.error("Parse mismatch", { s, bigInt: bigIntScaledToString(sig), decimal: dec.toFixed(MATH_SCALE) });
            }
            assert.strictEqual(sig, ref);
        }
    }

    // Precompute arrays
    const BIG = STRS.map(stringToBigIntScaled);
    const DEC = STRS.map((s) => new Decimal(s));

    // --- Add/Sub ---
    {
        const [A, B] = genPairs(BIG, rng);
        const [DA, DB] = genPairs(DEC, rng);
        for (let i = 0; i < A.length; i++) {
            const sum = fxAdd(A[i], B[i]);
            const dif = fxSub(A[i], B[i]);
            const dsum = decToSig20(DA[i].plus(DB[i]));
            const ddif = decToSig20(DA[i].minus(DB[i]));
            if (sum !== dsum || dif !== ddif) {
                console.error("Add/Sub mismatch", { a: STRS[i], b: STRS[(i*48271+1)%BIG.length] });
                assert.strictEqual(sum, dsum);
                assert.strictEqual(dif, ddif);
            }
        }
    }

    // --- Mul/Div HALF_EVEN & HALF_UP ---
    {
        const [A, B] = genPairs(BIG, rng);
        const [DA, DB] = genPairs(DEC, rng);

        Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        for (let i = 0; i < A.length; i++) {
            const m = fxMul(A[i], B[i]);
            const d = decToSig20(DA[i].times(DB[i]));
            if (m !== d) {
                console.error("Mul HALF_EVEN mismatch", { i });
                assert.strictEqual(m, d);
            }

            // Avoid div by zero
            if (!DB[i].isZero()) {
                const v = fxDiv(A[i], B[i]);
                const dv = decToSig20(DA[i].div(DB[i]));
                if (v !== dv) {
                    console.error("Div HALF_EVEN mismatch", { i });
                    assert.strictEqual(v, dv);
                }
            }
        }

        Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_UP });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_UP });
        for (let i = 0; i < A.length; i++) {
            const m = fxMul(A[i], B[i]);
            const d = decToSig20(DA[i].times(DB[i]));
            if (m !== d) {
                console.error("Mul HALF_UP mismatch", { i });
                assert.strictEqual(m, d);
            }
            if (!DB[i].isZero()) {
                const v = fxDiv(A[i], B[i]);
                const dv = decToSig20(DA[i].div(DB[i]));
                if (v !== dv) {
                    console.error("Div HALF_UP mismatch", { i });
                    assert.strictEqual(v, dv);
                }
            }
        }
    }

    // --- Accounting quantize (4 dp) TRUNC / HALF_EVEN / HALF_UP ---
    {
        const dUp = Decimal.ROUND_HALF_UP;
        const dEven = Decimal.ROUND_HALF_EVEN;

        // HALF_EVEN
        Decimal.set({ rounding: dEven });
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        for (let i = 0; i < BIG.length; i++) {
            const got = reduceToAccounting(BIG[i]);
            const ref = decSnapToAccountingSig20(DEC[i], dEven);
            if (got !== ref) {
                console.error("reduceToAccounting HALF_EVEN mismatch", { i });
                assert.strictEqual(got, ref);
            }
        }

        // HALF_UP
        Decimal.set({ rounding: dUp });
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_UP });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_UP });
        for (let i = 0; i < BIG.length; i++) {
            const got = reduceToAccounting(BIG[i]);
            const ref = decSnapToAccountingSig20(DEC[i], dUp);
            if (got !== ref) {
                console.error("reduceToAccounting HALF_UP mismatch", { i });
                assert.strictEqual(got, ref);
            }
        }

        // restore global rounding
        Decimal.set({ rounding: CFG.DEC_ROUND });
    }

    // --- (1+r)^n via fxPowInt ---
    {
        const rates = ["-0.2","0","0.0001","0.01","0.05","0.1234"].map(stringToBigIntScaled);
        const Ns = [0,1,2,5,10,25,50];
        Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
        for (const rSig of rates) {
            const rDec = new Decimal(bigIntScaledToString(rSig));
            for (const n of Ns) {
                const baseSig = fxAdd(pow10n(MATH_SCALE), rSig); // 1+r at scale
                const ours = fxPowInt(baseSig, n);
                const theirs = decToSig20(new Decimal(1).plus(rDec).pow(n));
                if (ours !== theirs) {
                    console.error("(1+r)^n mismatch", { r: rDec.toString(), n });
                    assert.strictEqual(ours, theirs);
                }
            }
        }
    }

    // --- NPV (sum cf[t]/(1+r)^t) ---
    {
        const rng2 = makeRng(CFG.SEED ^ 0x999);
        for (let caseIdx = 0; caseIdx < 200; caseIdx++) {
            // Build a small CF series with mixed signs
            const len = 3 + Math.floor(rng2() * 6); // 3..8
            const cfsSig = [];
            const cfsDec = [];
            for (let t = 0; t < len; t++) {
                const val = (rng2() * 2000 - 1000).toFixed(4); // [-1000,1000] with 4 dp
                const s = (t === 0 && !val.startsWith("-")) ? "-" + val : val; // ensure cf0 negative often
                cfsSig.push(stringToBigIntScaled(s));
                cfsDec.push(new Decimal(s));
            }
            const r = stringToBigIntScaled((rng2() * 0.3 - 0.1).toFixed(6)); // rate in [-0.1, 0.2]
            const rDec = new Decimal(bigIntScaledToString(r));

            const ours = fxNPV(r, cfsSig);
            // Decimal reference: compute directly then toFixed(20)
            let refDec = new Decimal(0);
            for (let t = 0; t < len; t++) {
                refDec = refDec.plus(cfsDec[t].div(new Decimal(1).plus(rDec).pow(t)));
            }
            const theirs = decToSig20(refDec);
            if (ours !== theirs) {
                if (CFG.SHOW_DETAILS_ON_FAIL) {
                    console.error("NPV mismatch", {
                        r: rDec.toString(),
                        cf: cfsDec.map(d => d.toString()),
                        ours: bigIntScaledToString(ours),
                        theirs: refDec.toFixed(MATH_SCALE)
                    });
                }
                assert.strictEqual(ours, theirs);
            }
        }
    }

    // --- PMT + amortization last balance ≈ 0 ---
    {
        const rng3 = makeRng(CFG.SEED ^ 0x1234);
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        for (let k = 0; k < 50; k++) {
            const principal = stringToBigIntScaled((rng3()*100000 + 1000).toFixed(2));
            const r = stringToBigIntScaled((rng3()*0.05).toFixed(6)); // 0..5% per period
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

            const pmtSig = decToSig20(pmtD);
            const balSig = decToSig20(bal);

            // PMT equality
            assert.strictEqual(pmt, pmtSig);
            // last balance equality
            assert.strictEqual(lastBal, balSig);
        }
    }

    console.log("✅ Correctness cross-checks passed.");
}

/** pow10n shim (used only in fxPowInt cross-check). */
//@ts-ignore .
function pow10n(n) { let p = 1n; for (let i = 0; i < n; i++) p *= 10n; return p; }

/** ---------------------------
 *  Benchmarks (same style as before)
 *  ---------------------------
 */
function runBenches() {
    const rng = makeRng(CFG.SEED);
    const STRS = genDecimalStrings(rng, CFG.N);

    const BIG_SIGS = STRS.map(stringToBigIntScaled);
    const DEC_OBJS = STRS.map((s) => new Decimal(s));

    console.log("\n== Parsing ==");
    bench("BigInt stringToBigIntScaled (scale=20)", () => {
        for (let i = 0; i < STRS.length; i++) stringToBigIntScaled(STRS[i]);
    });
    bench("Decimal parse (new Decimal(s))     ", () => {
        for (let i = 0; i < STRS.length; i++) new Decimal(STRS[i]);
    });

    console.log("\n== Add/Sub ==");
    {
        const [A, B] = genPairs(BIG_SIGS, rng);
        const [DA, DB] = genPairs(DEC_OBJS, rng);

        bench("BigInt fxAdd", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxAdd(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        });
        bench("Decimal plus()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].plus(DB[i])); if (acc === 42n) process.stdout.write("");
        });

        bench("BigInt fxSub", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxSub(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        });
        bench("Decimal minus()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].minus(DB[i])); if (acc === 42n) process.stdout.write("");
        });
    }

    console.log("\n== Mul/Div (HALF_EVEN) ==");
    {
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

        const [A, B] = genPairs(BIG_SIGS, rng);
        const [DA, DB] = genPairs(DEC_OBJS, rng);

        bench("BigInt fxMul", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxMul(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        });
        bench("Decimal times()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].times(DB[i])); if (acc === 42n) process.stdout.write("");
        });

        // Avoid div-by-zero: replace zeros with tiny epsilon
        const EPS = stringToBigIntScaled("1e-18");
        const B2 = B.map(b => (b === 0n ? EPS : b));
        const DB2 = DB.map(d => (d.isZero() ? new Decimal("1e-18") : d));

        bench("BigInt fxDiv", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxDiv(A[i], B2[i]); if (acc === 42n) process.stdout.write("");
        });
        bench("Decimal div()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].div(DB2[i])); if (acc === 42n) process.stdout.write("");
        });
    }

    console.log("\n== Quantize to accounting grid (4 dp) ==");
    {
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

        const [A] = genPairs(BIG_SIGS, rng);
        bench("BigInt reduceToAccounting(HALF_EVEN)", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= reduceToAccounting(A[i]); if (acc === 42n) process.stdout.write("");
        });
        bench("Decimal toFixed(4) + re-upscale   ", () => {
            let acc = 0n;
            for (let i = 0; i < DEC_OBJS.length; i++) {
                const s = DEC_OBJS[i].toFixed(ACCOUNTING_DECIMAL_PLACES);
                const neg = s[0] === "-";
                const t = neg ? s.slice(1) : s;
                const [int, frac = ""] = t.split(".");
                const merged = (int + frac.padEnd(ACCOUNTING_DECIMAL_PLACES, "0") + "0".repeat(MATH_SCALE - ACCOUNTING_DECIMAL_PLACES))
                  .replace(/^0+(?=\d)/, "") || "0";
                const sig20 = BigInt(merged);
                acc ^= (neg ? -sig20 : sig20);
            }
            if (acc === 42n) process.stdout.write("");
        });
    }

    console.log("\n== Compound interest ((1+r)^n) ==");
    {
        const rates = ["0.01","0.05","0.075","0.1234"].map(stringToBigIntScaled);
        const Ns = [1,2,5,10,25];

        bench("BigInt fxPowInt", () => {
            let acc = 0n;
            for (const r of rates) {
                const base = fxAdd(pow10n(MATH_SCALE), r);
                for (const n of Ns) acc ^= fxPowInt(base, n);
            }
            if (acc === 42n) process.stdout.write("");
        });

        bench("Decimal pow()", () => {
            let acc = 0n;
            for (const rs of ["0.01","0.05","0.075","0.1234"]) {
                const base = new Decimal(1).plus(new Decimal(rs));
                for (const n of Ns) acc ^= decToSig20(base.pow(n));
            }
            if (acc === 42n) process.stdout.write("");
        });
    }

    console.log("\n== Amortization schedule ==");
    {
        _TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        _TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

        const principal = stringToBigIntScaled("100000");
        const r = stringToBigIntScaled("0.01"); // 1% per period
        const periods = 120;

        bench("BigInt fxAmortizationSchedule", () => {
            const { rows } = fxAmortizationSchedule(principal, r, periods, false);
            //@ts-ignore .
            let acc = 0n; acc ^= rows[0].interest ^ rows.at(-1).balance; if (acc === 42n) process.stdout.write("");
        }, { iters: 2 });

        bench("Decimal amortization (baseline)", () => {
            const ONEd = new Decimal(1);
            const rd = new Decimal("0.01");
            const pd = new Decimal("100000");
            const pow = ONEd.plus(rd).pow(periods);
            const pmt = rd.times(pd).times(pow).div(pow.minus(ONEd));
            let bal = pd;
            for (let k = 1; k <= periods; k++) {
                const interest = bal.times(rd);
                let principalPart = pmt.minus(interest);
                if (k === periods) principalPart = bal;
                bal = bal.minus(principalPart);
            }
            process.stdout.write("");
        }, { iters: 2 });
    }

    console.log("\nDone.");
}

/** ---------------------------
 *  Main
 *  ---------------------------
 */
(function main() {
    console.log("Running correctness cross-checks…");
    crossCheckAll();
    console.log("\nRunning benchmarks…");
    runBenches();
})();
