//<file bigint_decimal_scaled.bench.accounting.bench.js>
import process from "node:process";
import { Decimal } from "../../vendor/decimaljs/decimal.js";
import {
    _TEST_ONLY__set as _TEST_ONLY__set_arith,
    stringToBigIntScaled, fxAdd, fxSub, fxMul, fxDiv, reduceToAccounting,
} from "../../src/lib/bigint_decimal_scaled.arithmetic.js";
import { ROUNDING_MODES } from "../../src/config/engine.js";
import {
    RUN_CONFIGS, bench, makeRng, decToSig, genDecimalStrings, genPairs,
} from "./bigint_decimal_scaled.common.js";

const CFG = { N: 4000, ITERS: 5, SEED: 0xA5F00D, DEC_ROUND: Decimal.ROUND_HALF_EVEN };

for (const cfg of RUN_CONFIGS) {
    console.log(`\n===== ACCOUNTING BENCH @ scale=${cfg.scale}, acc=${cfg.acc}, decprec=${cfg.decprec} =====`);
    Decimal.set({ precision: cfg.decprec, rounding: CFG.DEC_ROUND });

    // Sync BigInt arithmetic lib to the selected scale/rounding
    _TEST_ONLY__set_arith({
        decimalScale: cfg.scale,
        accountingDecimalPlaces: cfg.acc,
        roundingMode: ROUNDING_MODES.HALF_EVEN,
    });

    const rng = makeRng(CFG.SEED);

    // ---- Data sets
    const STRS = genDecimalStrings(CFG.N, rng);
    const DEC  = STRS.map(s => new Decimal(s));
    const [DA, DB] = genPairs(DEC);
    const DB2 = DB.map(d => d.isZero() ? new Decimal(1) : d); // avoid division by zero

    // ---- Parsing
    console.log("\n== Parsing ==");
    bench(`BigInt stringToBigIntScaled (scale=${cfg.scale})`, () => {
        for (let i = 0; i < STRS.length; i++) stringToBigIntScaled(STRS[i]);
    }, { iters: CFG.ITERS });

    // ---- Add/Sub
    console.log("\n== Add/Sub ==");
    {
        const A = STRS.map(stringToBigIntScaled);
        const B = STRS.map(stringToBigIntScaled);

        bench("BigInt fxAdd()", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxAdd(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("BigInt fxSub()", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxSub(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal plus()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig(DA[i].plus(DB[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal minus()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig(DA[i].minus(DB[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    // ---- Mul/Div
    console.log("\n== Mul/Div ==");
    {
        const A = STRS.map(stringToBigIntScaled);
        const B = STRS.map(stringToBigIntScaled);
        const B2 = B.map(v => v === 0n ? 1n : v);

        bench("BigInt fxMul()", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxMul(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("BigInt fxDiv()", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxDiv(A[i], B2[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal times()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig(DA[i].times(DB[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal div()", () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig(DA[i].div(DB2[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    // ---- Accounting snap (Decimal baseline path shown inline)
    console.log("\n== Accounting snap (toFixed + re-upscale) ==");
    {
        const A = STRS.map(s => new Decimal(s));
        bench(`Decimal toFixed(${cfg.acc}) + re-upscale`, () => {
            let acc = 0n;
            for (let i = 0; i < A.length; i++) {
                const s = A[i].toFixed(cfg.acc);
                const neg = s[0] === "-";
                const t = neg ? s.slice(1) : s;
                const [int, frac = ""] = t.split(".");
                const merged = (int + frac.padEnd(cfg.acc, "0") + "0".repeat(cfg.scale - cfg.acc))
                  .replace(/^0+(?=\d)/, "") || "0";
                const sig = BigInt(merged);
                acc ^= (neg ? -sig : sig);
            }
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        const A2 = STRS.map(stringToBigIntScaled);
        bench("BigInt reduceToAccounting()", () => {
            let acc = 0n;
            for (let i = 0; i < A2.length; i++) acc ^= reduceToAccounting(A2[i]);
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }
}
