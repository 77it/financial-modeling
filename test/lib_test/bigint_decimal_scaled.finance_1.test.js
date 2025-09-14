import { Decimal } from '../../vendor/decimaljs/decimal.js';
import {
    _TEST_ONLY__set as _TEST_ONLY__set_arithmetic,
    stringToBigIntScaled,
    bigIntScaledToString,
    fxAdd, fxSub, fxDiv, fxMul
} from '../../src/lib/bigint_decimal_scaled.arithmetic.js';
import { _TEST_ONLY__set as _TEST_ONLY__set_finance, fxPmt, fxPowInt } from '../../src/lib/bigint_decimal_scaled.finance.js';
import {ROUNDING_MODES} from '../../src/config/engine.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const MATH_SCALE = 20;
const ACCOUNTING_DECIMAL_PLACES = 4;
const ONE = stringToBigIntScaled("1"); // 1.0 at current base scale
// first set
_TEST_ONLY__set_arithmetic({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
_TEST_ONLY__set_finance({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

// --- helpers ---

//@ts-ignore .
function absBI(x){ return x < 0n ? -x : x; }
/** Allow a few ulps (units in last place at base scale) */
//@ts-ignore .
function assertUlpsClose(a, b, maxUlps = 200n) {
    const d = absBI(a - b);
    if (d > maxUlps) {
        throw new Error(`message: |diff|=${d} ulps > ${maxUlps} ulps, actual: a, expected: b, operator: 'ulpsClose'`);
    }
}

// --- configure Decimal for tests ---
Decimal.set({ precision: 60, rounding: Decimal.ROUND_HALF_EVEN }); // high precision, HALF_EVEN default

// ------------------ parsing tests ------------------

t('micro-checks so PMT can’t regress', () => {
    // Zero-rate path (matches current library sign: same sign as pv)
    {
        const pv = stringToBigIntScaled("-1200");
        const n  = 12;
        const expected = fxDiv(fxAdd(pv, 0n), stringToBigIntScaled(String(n)));
        assert.strictEqual(fxPmt(0n, n, pv), expected);
        // Identity check: n * pmt === pv (since fv=0 and r=0)
        assert.strictEqual(
          fxMul(expected, stringToBigIntScaled(String(n))),
          pv
        );
    }

    // Annuity-due vs ordinary annuity
    {
        const r  = stringToBigIntScaled("0.05") / 12n;                // monthly 5%/yr
        const n  = 24;
        const pv = stringToBigIntScaled("-10000");
        const pOrd = fxPmt(r, n, pv, 0n, false);
        const pDue = fxPmt(r, n, pv, 0n, true);
        // due payment must be smaller in magnitude
        assert.ok(pDue > pOrd);
    }

    // Sign & -0n normalization
    {
        const r = stringToBigIntScaled("0.01");
        const p = fxPmt(r, 1, stringToBigIntScaled("-100"));
        assert.notStrictEqual(p, -0n); // never return a signed zero
    }

    // FV path (target non-zero): identities without division (more stable numerically)
    {
        const r  = stringToBigIntScaled("0.01");
        const n  = 36;
        const pv = stringToBigIntScaled("0");
        const fv = stringToBigIntScaled("-1000");
        const ONE = stringToBigIntScaled("1");

        const pow = fxPowInt(fxAdd(ONE, r), BigInt(n)); // (1+r)^n at base scale

        // Ordinary annuity identity (cross-multiplied):
        //   (pow - 1) * PMT_ord  ==  r * (pv*pow + fv)
        {
            const pOrd = fxPmt(r, n, pv, fv, false);
            const lhs = fxMul(fxSub(pow, ONE), pOrd);
            const rhs = fxMul(r, fxAdd(fxMul(pv, pow), fv));
            assertUlpsClose(lhs, rhs, 300n);
        }

        // Annuity-due identity (multiply both sides of ordinary identity by (1+r)):
        //   (pow - 1) * (1 + r) * PMT_due  ==  r * (pv*pow + fv)
        {
            const pDue = fxPmt(r, n, pv, fv, true);
            const lhsDue = fxMul(fxMul(fxSub(pow, ONE), fxAdd(ONE, r)), pDue);
            const rhsDue = fxMul(r, fxAdd(fxMul(pv, pow), fv));
            assertUlpsClose(lhsDue, rhsDue, 300n);
        }
    }
    {
        const r  = stringToBigIntScaled("0.01");
        const n  = 36;
        const pv = stringToBigIntScaled("0");
        const fv = stringToBigIntScaled("-1000");
        const ONE = stringToBigIntScaled("1");

        const pOrd = fxPmt(r, n, pv, fv, false);
        let bal = pv;
        for (let i = 0; i < n; i++) {
            bal = fxAdd(fxMul(bal, fxAdd(ONE, r)), pOrd); // ordinary timing
        }
        // ordinary timing loop check: allow tiny rounding drift (≤ 10 ulps)
        // Your fxPmt rounds once after guard-scale math (good), but the loop does n base-scale roundings. Expect ≤ a few-ulps drift; 2 ulps is well within a sane tolerance.
        // The identity checks (cross-multiplied) still verify the PMT formula itself. Keep those with a small tolerance (e.g., 100–300 ulps depending on your guard scale). For the loop check, a much tighter tolerance (like 10 ulps) is realistic; you’re already at 2.
        assertUlpsClose(bal, fv, 10n);
    }
});
