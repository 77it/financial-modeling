//<file bigint_decimal_scaled.bench.accounting.bench.js>

import process from "node:process";
import { Decimal } from "../../vendor/decimaljs/decimal.js";
import {
    _TEST_ONLY__set as _TEST_ONLY__set_arith,
    stringToBigIntScaled, fxAdd, fxSub, fxMul, fxDiv, reduceToAccounting,
} from "../../src/lib/bigint_decimal_scaled.arithmetic.js";
import { ROUNDING_MODES } from "../../src/config/engine.js";
import {
    MATH_SCALE, ACCOUNTING_DECIMAL_PLACES, bench, makeRng,
    decToSig20, genDecimalStrings, genPairs,
} from "./bigint_decimal_scaled.common.js";

const CFG = { N: 4000, ITERS: 5, SEED: 0xA5F00D, DEC_ROUND: Decimal.ROUND_HALF_EVEN };
Decimal.set({ precision: 80, rounding: CFG.DEC_ROUND });

_TEST_ONLY__set_arith({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

(function run() {
    const rng = makeRng(CFG.SEED);
    const STRS = genDecimalStrings(rng, CFG.N);
    const BIG = STRS.map(stringToBigIntScaled);
    //@ts-ignore .
    const DEC = STRS.map((s) => new Decimal(s));

    console.log("\n== Parsing ==");
    bench("BigInt stringToBigIntScaled (scale=20)", () => {
        for (let i = 0; i < STRS.length; i++) stringToBigIntScaled(STRS[i]);
    }, { iters: CFG.ITERS });
    bench("Decimal parse (new Decimal(s))     ", () => {
        for (let i = 0; i < STRS.length; i++) new Decimal(STRS[i]);
    }, { iters: CFG.ITERS });

    console.log("\n== Add/Sub ==");
    {
        const [A, B] = genPairs(BIG);
        const [DA, DB] = genPairs(DEC);
        bench("BigInt fxAdd", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxAdd(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
        bench("Decimal plus()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].plus(DB[i])); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("BigInt fxSub", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxSub(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
        bench("Decimal minus()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].minus(DB[i])); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    console.log("\n== Mul/Div (HALF_EVEN) ==");
    {
        _TEST_ONLY__set_arith({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
        const [A, B] = genPairs(BIG);
        const [DA, DB] = genPairs(DEC);

        bench("BigInt fxMul", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxMul(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
        bench("Decimal times()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].times(DB[i])); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        // Avoid div-by-zero: replace zeros with tiny epsilon
        const EPS = stringToBigIntScaled("1e-18");
        //@ts-ignore .
        const B2 = B.map(b => (b === 0n ? EPS : b));
        //@ts-ignore .
        const DB2 = DB.map(d => (d.isZero() ? new Decimal("1e-18") : d));

        bench("BigInt fxDiv", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxDiv(A[i], B2[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
        bench("Decimal div()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig20(DA[i].div(DB2[i])); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    console.log("\n== Quantize to accounting grid (4 dp) ==");
    {
        const [A] = genPairs(BIG);
        bench("BigInt reduceToAccounting(HALF_EVEN)", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= reduceToAccounting(A[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
        bench("Decimal toFixed(4) + re-upscale   ", () => {
            let acc = 0n;
            for (let i = 0; i < DEC.length; i++) {
                const s = DEC[i].toFixed(ACCOUNTING_DECIMAL_PLACES);
                const neg = s[0] === "-";
                const t = neg ? s.slice(1) : s;
                const [int, frac = ""] = t.split(".");
                const merged = (int + frac.padEnd(ACCOUNTING_DECIMAL_PLACES, "0") + "0".repeat(MATH_SCALE - ACCOUNTING_DECIMAL_PLACES))
                  .replace(/^0+(?=\d)/, "") || "0";
                const sig20 = BigInt(merged);
                acc ^= (neg ? -sig20 : sig20);
            }
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    console.log("\nDone.");
})();
