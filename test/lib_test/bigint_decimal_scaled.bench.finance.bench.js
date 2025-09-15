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
    MATH_SCALE, ACCOUNTING_DECIMAL_PLACES, bench, makeRng,
    decToSig20, pow10n,
} from "./bigint_decimal_scaled.common.js";

const CFG = { ITERS: 5, SEED: 0xA5F00D, DEC_ROUND: Decimal.ROUND_HALF_EVEN };
Decimal.set({ precision: 40, rounding: CFG.DEC_ROUND });

function setMode() {
    _TEST_ONLY__set_arith({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
    _TEST_ONLY__set_fin({  decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
}
setMode();

(function run() {
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
        }, { iters: CFG.ITERS });

        bench("Decimal pow()", () => {
            let acc = 0n;
            for (const rs of ["0.01","0.05","0.075","0.1234"]) {
                const base = new Decimal(1).plus(new Decimal(rs));
                for (const n of Ns) acc ^= decToSig20(base.pow(n));
            }
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    console.log("\n== NPV ==");
    {
        const rng = makeRng(CFG.SEED ^ 0x222);
        const CASES = 200;
        const series = Array.from({ length: CASES }, () => {
            const len = 3 + Math.floor(rng() * 6);
            const cfs = new Array(len);
            for (let t = 0; t < len; t++) {
                const val = (rng() * 2000 - 1000).toFixed(4);
                const s = (t === 0 && !val.startsWith("-")) ? "-" + val : val;
                cfs[t] = stringToBigIntScaled(s);
            }
            const r = stringToBigIntScaled((rng() * 0.3 - 0.1).toFixed(6));
            return { r, cfs };
        });

        bench("BigInt fxNPV", () => {
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
                acc ^= decToSig20(ref);
            }
            if (acc === 42n) process.stdout.write("");
        }, { iters: CFG.ITERS });
    }

    console.log("\n== Amortization schedule (with PMT) ==");
    {
        const principal = stringToBigIntScaled("100000");
        const r = stringToBigIntScaled("0.01");
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
})();
