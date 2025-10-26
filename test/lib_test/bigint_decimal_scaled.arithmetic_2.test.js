import {
    _TEST_ONLY__set,
    stringToBigIntScaled,
    bigIntScaledToString,
    fxAdd, fxSub, fxMul, fxDiv,
    roundToAccounting,
} from '../../src/lib/bigint_decimal_scaled.arithmetic_x.js';
import {ROUNDING_MODES} from '../../src/config/engine.js';
import { Decimal } from '../../vendor/decimaljs/decimal.unlocked_vendor_test_only.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const MATH_SCALE = 20;
const ACCOUNTING_DECIMAL_PLACES = 4;
// first set
_TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });

// --- helpers to compare to Decimal.js-light ---

/**
 * Convert a Decimal to our scale-20 BigInt by using toFixed(MATH_SCALE).
 * Respects Decimal's global rounding setting.
 * @param {Decimal} d
 * @returns {bigint}
 */
function decToSig20(d) {
    const s = d.toFixed(MATH_SCALE);        // string with exactly MATH_SCALE decimals
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const parts = t.split(".");
    const merged = parts[0] + (parts[1] || "").padEnd(MATH_SCALE, "0");
    const sig = BigInt(merged.replace(/^0+(?=\d)/, "") || "0");
    return (neg ? -sig : sig);
}

/**
 * Convert Decimal to scale-20 BigInt snapped to accounting grid (4 dp),
 * keeping scale 20, using the provided Decimal rounding mode.
 * @param {Decimal} d
 * @param {number} rounding  Decimal.ROUND_*
 * @returns {bigint}
 */
function decSnapToAccountingSig20(d, rounding) {
    const prev = Decimal.rounding;
    Decimal.set({ rounding });
    const s = d.toFixed(ACCOUNTING_DECIMAL_PLACES);
    Decimal.set({ rounding: prev });
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const parts = t.split(".");
    const merged = parts[0] + (parts[1] || "").padEnd(ACCOUNTING_DECIMAL_PLACES, "0");
    // re-upscale to 20 by appending (20-4) zeros
    const merged20 = merged + "0".repeat(MATH_SCALE - ACCOUNTING_DECIMAL_PLACES);
    const sig = BigInt(merged20.replace(/^0+(?=\d)/, "") || "0");
    return (neg ? -sig : sig);
}

// --- configure Decimal for tests ---
Decimal.set({ precision: 60, rounding: Decimal.ROUND_HALF_EVEN }); // high precision, HALF_EVEN default

// ------------------ parsing tests ------------------

t('test stringToBigIntScaled', () => {
    const cases = [
        ["0", "0.00000000000000000000"],
        ["42", "42.00000000000000000000"],
        ["-0.0001", "-0.00010000000000000000"],
        ["123.45", "123.45000000000000000000"],
        ["-999999999999.9999999999", "-999999999999.99999999990000000000"],
        ["1.23456789012345678901234", "1.23456789012345678901"], // rounds at 20 dp (HALF_EVEN)
    ];
    for (const [inp, exp] of cases) {
        const got = stringToBigIntScaled(inp);
        assert.strictEqual(bigIntScaledToString(got, {trim: false}), exp);
    }
});

t('test stringToBigIntScaled number with exponent', () => {
    const cases = [
        ["1e0", "1.00000000000000000000"],
        ["1e2", "100.00000000000000000000"],
        ["1.23e-4", "0.00012300000000000000"],
        ["-3e8", "-300000000.00000000000000000000"],
        ["9.999999999999999999995e-1", "1.00000000000000000000"], // tie up to even
    ];
    for (const [inp, exp] of cases) {
        const got = stringToBigIntScaled(inp);
        assert.strictEqual(bigIntScaledToString(got, {trim: false}), exp);
    }
});

// ------------------ arithmetic vs Decimal ------------------

t('test Add Sub', () => {
    const pairs = [
        ["123.456", "0.0044"],
        ["-10.5", "10.5"],
        ["999999.9999", "0.0001"],
    ];
    for (const [a, b] of pairs) {
        const sa = stringToBigIntScaled(a);
        const sb = stringToBigIntScaled(b);
        const sum = fxAdd(sa, sb);
        const dif = fxSub(sa, sb);

        const da = new Decimal(a), db = new Decimal(b);
        const dsum = decToSig20(da.plus(db));
        const ddif = decToSig20(da.minus(db));

        assert.strictEqual(sum, dsum);
        assert.strictEqual(dif, ddif);
    }
});

t('test Mul HalfEven', () => {
    const pairs = [
        ["1.234567890123456789", "2.34567890123456789"],
        ["-0.00005", "2.5"],        // near tie
        ["-1.25", "-1.25"],
    ];
    Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
    _TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
    for (const [a, b] of pairs) {
        const sa = stringToBigIntScaled(a);
        const sb = stringToBigIntScaled(b);
        const got = fxMul(sa, sb);

        const dgot = decToSig20(new Decimal(a).times(new Decimal(b)));
        assert.strictEqual(got, dgot);
    }
});

t('test Mul HalfUp', () => {
    const pairs = [
        ["0.00005", "1"],    // tie goes up
        ["-0.00005", "1"],   // tie goes away from zero
    ];
    Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
    _TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_UP });
    for (const [a, b] of pairs) {
        const sa = stringToBigIntScaled(a);
        const sb = stringToBigIntScaled(b);
        const got = fxMul(sa, sb);

        const dgot = decToSig20(new Decimal(a).times(new Decimal(b)));
        assert.strictEqual(got, dgot);
    }
});

t('test Div HalfEven', () => {
    const pairs = [
        ["1", "3"],
        ["-1", "3"],
        ["2.5", "0.5"],
    ];
    Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
    _TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
    for (const [a, b] of pairs) {
        const sa = stringToBigIntScaled(a);
        const sb = stringToBigIntScaled(b);
        const got = fxDiv(sa, sb);

        const dgot = decToSig20(new Decimal(a).div(new Decimal(b)));
        assert.strictEqual(got, dgot);
    }
});

t('test Div HalfUp', () => {
    const pairs = [
        ["1", "2"],
        ["-1", "2"],
    ];
    Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
    _TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_UP });
    for (const [a, b] of pairs) {
        const sa = stringToBigIntScaled(a);
        const sb = stringToBigIntScaled(b);
        const got = fxDiv(sa, sb);

        const dgot = decToSig20(new Decimal(a).div(new Decimal(b)));
        assert.strictEqual(got, dgot);
    }
});

// ------------------ accounting grid (keep scale 20) ------------------

t('test roundToAccounting HalfEven', () => {
    Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
    _TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
    const inputs = [
        "123.456789",     // rounds on 5th decimal
        "0.00005",
        "-0.00005",
        "-123.45005",
    ];
    for (const s of inputs) {
        const sig20 = stringToBigIntScaled(s);
        const got = roundToAccounting(sig20);

        const d = new Decimal(s);
        const expSig20 = decSnapToAccountingSig20(d, Decimal.ROUND_HALF_EVEN);
        assert.strictEqual(got, expSig20);
    }
});

t('test roundToAccounting HalfUp', () => {
    Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
    _TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_UP });
    const inputs = ["0.00005", "-0.00005", "1.23455", "-1.23455"];
    for (const s of inputs) {
        const sig20 = stringToBigIntScaled(s);
        const got = roundToAccounting(sig20);

        const d = new Decimal(s);
        const expSig20 = decSnapToAccountingSig20(d, Decimal.ROUND_HALF_UP);
        assert.strictEqual(got, expSig20);
    }
});

// ------------------ formatting & edge cases ------------------

t('test bigIntScaledToString + trim', () => {
    /** @type {[string, boolean, string][]} */
    const cases = [
        ["0", false, "0.00000000000000000000"],
        ["0", true,  "0"],
        ["123.4500", false, "123.45000000000000000000"],
        ["123.4500", true,  "123.45"],
        ["-0.00005", false, "-0.00005000000000000000"],
    ];
    for (const [inp, trim, exp] of cases) {
        const sig20 = stringToBigIntScaled(inp);
        assert.strictEqual(bigIntScaledToString(sig20, { trim }), exp);
    }
});

t('test Negative Zero normalization', () => {
    _TEST_ONLY__set({ decimalScale: MATH_SCALE, accountingDecimalPlaces: ACCOUNTING_DECIMAL_PLACES, roundingMode: ROUNDING_MODES.HALF_EVEN });
    // A tiny negative that rounds to zero on accounting snap
    const tinyNeg = stringToBigIntScaled("-0.00000000000000000009"); // -9e-20
    const snapped = roundToAccounting(tinyNeg);
    assert.strictEqual(snapped, 0n);
    assert.strictEqual(bigIntScaledToString(snapped, {trim: false}), "0.00000000000000000000");
});
