// @ts-nocheck

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

import {
  _TEST_ONLY__set,
  stringToBigIntScaled,
  bigIntScaledToString,
  fxAdd, fxSub, fxMul, fxDiv,
} from '../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { ROUNDING_MODES } from '../../src/config/engine.js';
import { Decimal } from '../../vendor/decimaljs/decimal.unlocked_vendor_test_only.js';

// ----------------- shared helpers (local) -----------------
const SCALE20 = 20;

/** Convert Decimal to scale-20 BigInt, respecting Decimal's rounding. */
function decToSig20(d) {
  const s = d.toFixed(SCALE20);
  const neg = s[0] === '-';
  const t = neg ? s.slice(1) : s;
  const [i, f = ''] = t.split('.');
  const merged = (i + f.padEnd(SCALE20, '0')).replace(/^0+(?=\d)/, '') || '0';
  const sig = BigInt(merged);
  return neg ? -sig : sig;
}

function S(x) { return stringToBigIntScaled(String(x)); }
function toStr(sig, trim = true) { return bigIntScaledToString(sig, { trim }); }

// ----------------- (1) pow10 beyond cache via huge exponents -----------------
t('parse scientific notation with huge positive exponent uses pow10n beyond cache (exactness vs Decimal)', () => {
  // Configure standard environment (scale=20, HALF_EVEN)
  Decimal.set({ precision: 120, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -9, toExpPos: 5_000 });

  _TEST_ONLY__set(
    () => {
      // Large exponent: will require pow10n(k) where k >> MAX_POW10 (which is max(2*scale,100))
      const cases = [
        '1e1000',
        '-3.1415e1500',
        '9.99999999999999999999e1200', // many frac digits
      ];

      for (const s of cases) {
        const got = stringToBigIntScaled(s);
        const ref = decToSig20(new Decimal(s));
        assert.strictEqual(got, ref, `sci-parse mismatch for ${s}`);
      }
    },
    { decimalScale: SCALE20, accountingDecimalPlaces: 4, roundingMode: ROUNDING_MODES.HALF_EVEN });
});

t('parse scientific notation with huge negative exponent hits division/rounding path (vs Decimal)', () => {
  Decimal.set({ precision: 120, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -5000, toExpPos: 5000 });

  _TEST_ONLY__set(
    () => {
      const cases = [
        '1e-1000',
        '-2.5e-1021',       // tie-ish behavior down in far tail
        '9.000000000000000000005e-100', // exact 5 at guard tail
      ];

      for (const s of cases) {
        const got = stringToBigIntScaled(s);
        const ref = decToSig20(new Decimal(s));
        assert.strictEqual(got, ref, `sci-parse (neg exp) mismatch for ${s}`);
      }
    },
    { decimalScale: SCALE20, accountingDecimalPlaces: 4, roundingMode: ROUNDING_MODES.HALF_EVEN });
});

// ----------------- (2) invalid parsing should throw -----------------
t('invalid decimal strings should throw', () => {
  _TEST_ONLY__set(
    () => {
      const bad = [
        '.', '+.', '-.',
        '1..2', '1.2.3', '1e', 'e10', '1ee10', '1e+', '1e-', '1e--2',
        'abc', 'NaN', 'Infinity', '+Infinity', '-Infinity',
        '0x10', '1_000', '--1', '++2', '1.-2',
      ];

      for (const s of bad) {
        let threw = false;
        try { stringToBigIntScaled(s); } catch { threw = true; }
        if (!threw) assert.fail(`Expected throw, but parsed: "${s}"`);
      }
    },
    { decimalScale: SCALE20, accountingDecimalPlaces: 4, roundingMode: ROUNDING_MODES.HALF_EVEN });
});

// ----------------- (3) scale = 0 behavior (ties, ops, formatting) -----------------
t('scale=0: HALF_EVEN vs HALF_UP ties, basic ops, and formatting (no decimal point)', () => {
  // SCALE=0 ⇒ ACCOUNTING_DECIMAL_PLACES must be 0 to avoid negative grid exponent.
  Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_EVEN });
  _TEST_ONLY__set(
    () => {
      // HALF_EVEN ties (x.5): 0.5→0, 1.5→2, 2.5→2, -1.5→-2, -2.5→-2
      const halfEvenCases = [
        ['0.5', '0'], ['1.5', '2'], ['2.5', '2'],
        ['-1.5', '-2'], ['-2.5', '-2'],
      ];
      for (const [inp, exp] of halfEvenCases) {
        assert.strictEqual(toStr(S(inp)), exp, `HALF_EVEN parse @ scale=0: ${inp}`);
      }
    },
    { decimalScale: 0, accountingDecimalPlaces: 0, roundingMode: ROUNDING_MODES.HALF_EVEN });

  // Flip to HALF_UP ties: 0.5→1, 2.5→3, -1.5→-2, -2.5→-3
  Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
  _TEST_ONLY__set(
    () => {
      const halfUpCases = [
        ['0.5', '1'], ['2.5', '3'],
        ['-1.5', '-2'], ['-2.5', '-3'],
      ];
      for (const [inp, exp] of halfUpCases) {
        assert.strictEqual(toStr(S(inp)), exp, `HALF_UP parse @ scale=0: ${inp}`);
      }

      // Basic ops @ scale=0 behave like integer arithmetic with correct rounding on div
      // add/sub
      assert.strictEqual(toStr(fxAdd(S('10'), S('5'))), '15');
      assert.strictEqual(toStr(fxSub(S('10'), S('15'))), '-5');

      // mul
      assert.strictEqual(toStr(fxMul(S('7'), S('6'))), '42');

      // div with rounding (HALF_UP now): 5/2 = 2.5 → 3 ; -5/2 = -2.5 → -3
      assert.strictEqual(toStr(fxDiv(S('5'), S('2'))), '3');
      assert.strictEqual(toStr(fxDiv(S('-5'), S('2'))), '-3');

      // formatting has no decimal point at scale=0
      assert.strictEqual(bigIntScaledToString(S('123')), '123');
      assert.strictEqual(bigIntScaledToString(S('-0')), '0');
    },
    { decimalScale: 0, accountingDecimalPlaces: 0, roundingMode: ROUNDING_MODES.HALF_UP });
});
