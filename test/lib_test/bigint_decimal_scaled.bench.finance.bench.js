//<file bigint_decimal_scaled.bench.finance.bench.js>
import process from "node:process";
import { Decimal } from "../../vendor/decimaljs/decimal.js";
import { ROUNDING_MODES } from "../../src/config/engine.js";
import {
    _TEST_ONLY__set as _TEST_ONLY__set_fin,
    fxPowInt, fxNPV, fxPmt, fxAmortizationSchedule,
} from "../../src/lib/bigint_decimal_scaled.finance.js";
import {
    _TEST_ONLY__set as _TEST_ONLY__set_arith,
    stringToBigIntScaled, fxAdd, bigIntScaledToString,
} from "../../src/lib/bigint_decimal_scaled.arithmetic.js";
import {
    RUN_CONFIGS, bench, decToSig, pow10n,
} from "./bigint_decimal_scaled.common.js";

const CFG = { ITERS: 5, SEED: 0xA5F00D, DEC_ROUND: Decimal.ROUND_HALF_EVEN };

for (const cfg of RUN_CONFIGS) {
    console.log(`\n===== FINANCE BENCH @ scale=${cfg.scale}, acc=${cfg.acc}, decprec=${cfg.decprec} =====`);
    Decimal.set({ precision: cfg.decprec, rounding: CFG.DEC_ROUND });

    // Keep arithmetic+finance libraries in sync with the selected scale
    _TEST_ONLY__set_arith({
        decimalScale: cfg.scale,
        accountingDecimalPlaces: cfg.acc,
        roundingMode: ROUNDING_MODES.HALF_EVEN,
    });
    _TEST_ONLY__set_fin({
        decimalScale: cfg.scale,
        accountingDecimalPlaces: cfg.acc,
        roundingMode: ROUNDING_MODES.HALF_EVEN,
    });

    // == Compound interest: (1+r)^n ==
    console.log(`\n== Compound interest ((1+r)^n) @ scale=${cfg.scale} ==`);
    {
        const Ns = [0, 1, 2, 5, 10, 25, 50];

        // BigInt baseline using fxPowInt on (1+r) scaled
        bench("BigInt fxPowInt()", () => {
            let acc = 0n;
            for (const rs of ["-0.2","0","0.0001","0.01","0.05","0.1234"]) {
                const rSig = stringToBigIntScaled(rs);
                const one = pow10n(cfg.scale);
                const base = fxAdd(one, rSig);
                for (const n of Ns) acc ^= fxPowInt(base, n);
            }
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal pow()", () => {
            let acc = 0n;
            for (const rs of ["0.01","0.05","0.075","0.1234"]) {
                const base = new Decimal(1).plus(new Decimal(rs));
                for (const n of Ns) acc ^= decToSig(base.pow(n), cfg.scale);
            }
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    // == NPV ==
    console.log("\n== NPV ==");
    {
        const series = [
            { r: "-0.058817", cfs: ["-700.9838","111.1301","-106.2009","-567.8489"] },
            { r: "0.0432",     cfs: ["-150","50","60","65","70"] },
            { r: "0.10",       cfs: ["-1000","300","420","500","120"] },
        ].map(({ r, cfs }) => ({
            r: stringToBigIntScaled(r),
            cfs: cfs.map(stringToBigIntScaled),
        }));

        bench("BigInt fxNPV()", () => {
            let acc = 0n;
            for (const { r, cfs } of series) acc ^= fxNPV(r, cfs);
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });

        bench("Decimal baseline NPV", () => {
            let acc = 0n;
            for (const { r, cfs } of series) {
                const rd = new Decimal(bigIntScaledToString(r));
                let ref = new Decimal(0);
                for (let t = 0; t < cfs.length; t++) {
                    ref = ref.plus(new Decimal(bigIntScaledToString(cfs[t])).div(new Decimal(1).plus(rd).pow(t)));
                }
                acc ^= decToSig(ref, cfg.scale);
            }
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    // == PMT + amortization schedule ==
    console.log("\n== Amortization schedule (with PMT) ==");
    {
        // keep n as a plain integer count
        const loan = { r: "0.0125", n: 36, pv: "25000" };

        const r  = stringToBigIntScaled(loan.r);   // rate at MATH_SCALE
        const pv = stringToBigIntScaled(loan.pv);  // principal at MATH_SCALE
        const n  = loan.n;                         // periods as Number (integer)

        bench("BigInt fxPmt()", () => {
            for (let i = 0; i < 100; i++) fxPmt(r, n, pv);
        }, { iters: CFG.ITERS });

        bench("BigInt fxAmortizationSchedule()", () => {
            for (let i = 0; i < 50; i++) fxAmortizationSchedule(pv, r, n); // ✅ (principal, rate, periods)
        }, { iters: CFG.ITERS });

        bench("Decimal PMT baseline", () => {
            // PMT (ordinary): r * (PV * (1+r)^n) / ((1+r)^n - 1)
            const rd  = new Decimal(bigIntScaledToString(r));
            const one = new Decimal(1);
            const base = one.plus(rd);
            const pow  = base.pow(n); // n is Number
            const pmt  = rd.times(new Decimal(bigIntScaledToString(pv)).times(pow))
              .div(pow.minus(one));
            void pmt; // prevent DCE
        }, { iters: CFG.ITERS });
    }
}
