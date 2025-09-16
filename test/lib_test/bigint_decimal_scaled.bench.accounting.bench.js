//<file bigint_decimal_scaled.bench.accounting.bench.js>
import process from "node:process";
import { Decimal } from "../../vendor/decimaljs/decimal.js";
import {
    _TEST_ONLY__set as _TEST_ONLY__set_arith,
    stringToBigIntScaled, fxAdd, fxSub, fxMul, fxDiv, reduceToAccounting,
} from "../../src/lib/bigint_decimal_scaled.arithmetic.js";
import { ROUNDING_MODES } from "../../src/config/engine.js";
import {
    RUN_CONFIGS, bench, makeRng, decToSig, genDecimalStrings
} from "./bigint_decimal_scaled.common.js";

const CFG = { N: 20_000, ITERS: 5, SEED: 0xA5F00D, DEC_ROUND: Decimal.ROUND_HALF_EVEN };
const totalProcessed = CFG.N * CFG.ITERS;
const nf = new Intl.NumberFormat("it-IT");
console.log(`Benchmark config: N=${nf.format(CFG.N)} numbers per run × ITERS=${nf.format(CFG.ITERS)} repeats = ${nf.format(totalProcessed)} numbers processed`);
console.log("Reported time = total wall-clock ms for all processed numbers\n");

/**
 * Generate a stable pair of operand index arrays using the same RNG,
 * so we can materialize *identical operand pairs* for BigInt and Decimal.
 * We build separate index sets for Add/Sub vs Mul/Div to use different datasets
 * across operation families (as requested), while keeping BigInt and Decimal aligned.
 *
 * @param {number} len
 * @param {() => number} rng
 * @returns {[number[], number[]]}
 */
function genPairIndices(len, rng) {
    const IA = new Array(len);
    const IB = new Array(len);
    for (let i = 0; i < len; i++) {
        IA[i] = (rng() * len) | 0;
        let j = (rng() * len) | 0;
        // ensure A != B to avoid biased A+B=2A and A-B=0 cases
        if (j === IA[i]) j = (j + 1) % len;
        IB[i] = j;
    }
    return [IA, IB];
}

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

    // Precompute indexed pairs for the two operation groups.
    // Group 1 → Add/Sub
    const [IDX_A1, IDX_B1] = genPairIndices(STRS.length, rng);
    const DA = IDX_A1.map(i => DEC[i]);
    const DB = IDX_B1.map(i => DEC[i]);
    const SA = IDX_A1.map(i => STRS[i]);
    const SB = IDX_B1.map(i => STRS[i]);

    // Group 2 → Mul/Div (different dataset from Add/Sub, same across Decimal/BigInt)
    const [IDX_A2, IDX_B2] = genPairIndices(STRS.length, rng);
    const DM_A = IDX_A2.map(i => DEC[i]);
    const DM_B = IDX_B2.map(i => DEC[i]);
    const SM_A = IDX_A2.map(i => STRS[i]);
    const SM_B = IDX_B2.map(i => STRS[i]);

    // ---- Parsing
    console.log("\n== Parsing ==");
    bench(`BigInt stringToBigIntScaled (scale=${cfg.scale})`, () => {
        for (let i = 0; i < STRS.length; i++) stringToBigIntScaled(STRS[i]);
    }, { iters: CFG.ITERS });
    bench(`new Decimal`, () => {
        for (let i = 0; i < STRS.length; i++) new Decimal(STRS[i]);
    }, { iters: CFG.ITERS });

    // ---- Add/Sub
    console.log("\n== Add/Sub ==");
    {
        // Materialize *identical operand pairs* for BigInt from the same strings used by Decimal
        const A = SA.map(stringToBigIntScaled);
        const B = SB.map(stringToBigIntScaled);

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
        // Use the second (different) dataset for Mul/Div, aligned across Decimal/BigInt
        const A = SM_A.map(stringToBigIntScaled);
        const B = SM_B.map(stringToBigIntScaled);
        const B2 = B.map(v => v === 0n ? 1n : v);
        const DM_B2 = DM_B.map(d => d.isZero() ? new Decimal(1) : d); // avoid division by zero

        bench("BigInt fxMul()", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxMul(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("BigInt fxDiv()", () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxDiv(A[i], B2[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal times()", () => {
            let acc = 0n; for (let i = 0; i < DM_A.length; i++) acc ^= decToSig(DM_A[i].times(DM_B[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal div()", () => {
            let acc = 0n; for (let i = 0; i < DM_A.length; i++) acc ^= decToSig(DM_A[i].div(DM_B2[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    // ---- Accounting snap (Decimal baseline path shown inline)
    console.log("\n== Accounting snap (toFixed + re-upscale) ==");
    {
        const A2 = STRS.map(stringToBigIntScaled);
        bench("BigInt reduceToAccounting()", () => {
            let acc = 0n;
            for (let i = 0; i < A2.length; i++) acc ^= reduceToAccounting(A2[i]);
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

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
    }
}
