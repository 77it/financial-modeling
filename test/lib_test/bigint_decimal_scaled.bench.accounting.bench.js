//<file bigint_decimal_scaled.bench.accounting.bench.js>
import process from "node:process";
import { Decimal } from "../../vendor/decimaljs/decimal.unlocked_vendor_test_only.js";
import {
    _TEST_ONLY__set as _TEST_ONLY__set_arith,
    stringToBigIntScaled, fxAdd, fxSub, fxMul, fxDiv, roundToAccounting,
} from "../../src/lib/bigint_decimal_scaled.arithmetic_x.js";
import { ROUNDING_MODES } from "../../src/config/engine.js";
import {
    RUN_CONFIGS, bench, makeRng, decToSig, genDecimalStrings
} from "./bigint_decimal_scaled.test_utils.js";

// store results for post-processing
const results = new Map();

/**
 * Wrapper around bench() that records timings so we can compute percentage diffs.
 * @param {string} label
 * @param {() => void} fn
 * @param {{iters?: number}} [opts]
 * @returns {number} elapsed ms
 */
function benchWithDiff(label, fn, opts = {}) {
    const ms = bench(label, fn, opts);
    results.set(label, ms);
    return ms;
}

/** Print a human-readable percentage diff: BigInt vs Decimal. */
const pf = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
//@ts-ignore .
function printDiff(bigLabel, decLabel, caption) {
    const b = results.get(bigLabel);
    const d = results.get(decLabel);
    if (typeof b === "number" && typeof d === "number" && d > 0) {
        const diff = ((b - d) / d) * 100;
        const rel = diff === 0 ? "equal" : diff > 0 ? "slower" : "faster";
        console.log(`→ ${caption}: BigInt is ${pf.format(Math.abs(diff))}% ${rel}`);
    }
}

const CFG = { N: 20_000, ITERS: 5, SEED: 0xA5F00D, DEC_ROUND: Decimal.ROUND_HALF_EVEN };
const totalProcessed = CFG.N * CFG.ITERS;
const nf = new Intl.NumberFormat("it-IT");
console.log(`\nBenchmark config: N=${nf.format(CFG.N)} numeri per run × ITERS=${nf.format(CFG.ITERS)} ripetizioni = ${nf.format(totalProcessed)} numeri processati`);
console.log("Reported time = ms di wall-clock totali per tutti i numeri processati\n");

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
    {
        const lblBig = `BigInt stringToBigIntScaled (scale=${cfg.scale})`;
        const lblDec = `new Decimal`;

        benchWithDiff(lblBig, () => {
            for (let i = 0; i < STRS.length; i++) stringToBigIntScaled(STRS[i]);
        }, { iters: CFG.ITERS });

        benchWithDiff(lblDec, () => {
            for (let i = 0; i < STRS.length; i++) new Decimal(STRS[i]);
        }, { iters: CFG.ITERS });

        printDiff(lblBig, lblDec, "Parsing (string→value)");
    }

    // ---- Add/Sub
    console.log("\n== Add/Sub ==");
    {
        // Materialize *identical operand pairs* for BigInt from the same strings used by Decimal
        const A = SA.map(stringToBigIntScaled);
        const B = SB.map(stringToBigIntScaled);

        const lblAddBig = "BigInt fxAdd()";
        const lblSubBig = "BigInt fxSub()";
        const lblAddDec = "Decimal plus()";
        const lblSubDec = "Decimal minus()";

        benchWithDiff(lblAddBig, () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxAdd(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        benchWithDiff(lblSubBig, () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxSub(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        benchWithDiff(lblAddDec, () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig(DA[i].plus(DB[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        benchWithDiff(lblSubDec, () => {
            let acc = 0n; for (let i = 0; i < DA.length; i++) acc ^= decToSig(DA[i].minus(DB[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        printDiff(lblAddBig, lblAddDec, "Add (fxAdd vs plus)");
        printDiff(lblSubBig, lblSubDec, "Sub (fxSub vs minus)");
    }

    // ---- Mul/Div
    console.log("\n== Mul/Div ==");
    {
        // Use the second (different) dataset for Mul/Div, aligned across Decimal/BigInt
        const A = SM_A.map(stringToBigIntScaled);
        const B = SM_B.map(stringToBigIntScaled);
        const B2 = B.map(v => v === 0n ? 1n : v);
        const DM_B2 = DM_B.map(d => d.isZero() ? new Decimal(1) : d); // avoid division by zero

        const lblMulBig = "BigInt fxMul()";
        const lblDivBig = "BigInt fxDiv()";
        const lblMulDec = "Decimal times()";
        const lblDivDec = "Decimal div()";

        benchWithDiff(lblMulBig, () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxMul(A[i], B[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        benchWithDiff(lblDivBig, () => {
            let acc = 0n; for (let i = 0; i < A.length; i++) acc ^= fxDiv(A[i], B2[i]); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        benchWithDiff(lblMulDec, () => {
            let acc = 0n; for (let i = 0; i < DM_A.length; i++) acc ^= decToSig(DM_A[i].times(DM_B[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        benchWithDiff(lblDivDec, () => {
            let acc = 0n; for (let i = 0; i < DM_A.length; i++) acc ^= decToSig(DM_A[i].div(DM_B2[i]), cfg.scale); if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        printDiff(lblMulBig, lblMulDec, "Mul (fxMul vs times)");
        printDiff(lblDivBig, lblDivDec, "Div (fxDiv vs div)");
    }

    // ---- Accounting snap (Decimal baseline path shown inline)
    console.log("\n== Accounting snap (toFixed + re-upscale) ==");
    {
        const A2 = STRS.map(stringToBigIntScaled);
        const lblBig = "BigInt roundToAccounting()";
        const lblDec = `Decimal toFixed(${cfg.acc}) + re-upscale`;

        benchWithDiff(lblBig, () => {
            let acc = 0n;
            for (let i = 0; i < A2.length; i++) acc ^= roundToAccounting(A2[i]);
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        const A = STRS.map(s => new Decimal(s));
        benchWithDiff(lblDec, () => {
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

        printDiff(lblBig, lblDec, "Accounting (roundToAccounting vs toFixed+re-upscale)");
    }
}
