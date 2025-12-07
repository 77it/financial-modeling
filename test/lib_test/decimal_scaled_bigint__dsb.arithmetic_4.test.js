// @ts-nocheck
// <file bigint_decimal_scaled.arithmetic_parse_rounding.test.js>

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined'
  ? Deno.test
  : await import('bun:test').then(m => m.test).catch(() => test);

import {
  _TEST_ONLY__set,
  stringToBigIntScaled,
  bigIntScaledToString,
} from '../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { ROUNDING_MODES } from '../../src/config/engine.js';

const SCALE = 20;
const ACC   = 4;


function S(x) { return stringToBigIntScaled(String(x)); }
/** fixed-dp rendering for unambiguous comparisons */
function toFixed(sig) { return bigIntScaledToString(sig, { trim: false }); }

/** parse two spellings (plain vs sci) → same scaled integer */
function assertParseSame(a, b, msg) {
  const A = S(a), B = S(b);
  assert.strictEqual(A, B, msg || `${a} vs ${b} differ`);
}

/** parse → exact fixed-dp string */
function assertParseTo(str, expected) {
  const got = toFixed(S(str));
  assert.strictEqual(got, expected, `parse ${str} -> ${expected}`);
}

// ---------------- tests ----------------

t('HALF_EVEN: ties at 21st digit (plain vs sci) round identically', () => {
  _TEST_ONLY__set(
    () => {
      // exact 5 at 21st digit
      assertParseTo('0.000000000000000000005', '0.00000000000000000000'); // even → stay
      assertParseSame('0.000000000000000000005', '5e-21');

      assertParseTo('1.000000000000000000005', '1.00000000000000000000'); // even → stay
      assertParseSame('1.000000000000000000005', '1.000000000000000000005e0');

      assertParseTo('1.230000000000000000005', '1.23000000000000000000'); // ...0 even
      assertParseSame('1.230000000000000000005', '1.230000000000000000005e0');

      // odd last kept digit → bump
      assertParseTo('0.000000000000000000015', '0.00000000000000000002');
      assertParseSame('0.000000000000000000015', '1.5e-20');

      assertParseTo('123.000000000000000000015', '123.00000000000000000002');
      assertParseSame('123.000000000000000000015', '1.23000000000000000000015e2');

      // negatives
      assertParseTo('-0.000000000000000000005', '0.00000000000000000000'); // even → stay @ 0
      assertParseSame('-0.000000000000000000005', '-5e-21');

      assertParseTo('-0.000000000000000000015', '-0.00000000000000000002'); // odd → bump away
      assertParseSame('-0.000000000000000000015', '-1.5e-20');

      assertParseTo('-1.000000000000000000005', '-1.00000000000000000000'); // even → stay
      assertParseTo('-1.000000000000000000015', '-1.00000000000000000002'); // odd → bump
    },
    { decimalScale: SCALE, accountingDecimalPlaces: ACC, roundingMode: ROUNDING_MODES.HALF_EVEN });
});

t('HALF_UP: ties at 21st digit (plain vs sci) always bump away from zero, identically', () => {
  _TEST_ONLY__set(
    () => {
      assertParseTo('0.000000000000000000005', '0.00000000000000000001');
      assertParseSame('0.000000000000000000005', '5e-21');

      assertParseTo('-0.000000000000000000005', '-0.00000000000000000001');
      assertParseSame('-0.000000000000000000005', '-5e-21');

      assertParseTo('1.000000000000000000005', '1.00000000000000000001');
      assertParseTo('-1.000000000000000000005', '-1.00000000000000000001');

      assertParseTo('0.000000000000000000015', '0.00000000000000000002');
      assertParseTo('-0.000000000000000000015', '-0.00000000000000000002');

      assertParseTo('123.000000000000000000005', '123.00000000000000000001');
      assertParseSame('123.000000000000000000005', '1.23000000000000000000005e2');
    },
    { decimalScale: SCALE, accountingDecimalPlaces: ACC, roundingMode: ROUNDING_MODES.HALF_UP });
});

t('non-tie tails: >5 always bumps; <5 never bumps (both modes); plain == sci', () => {
  _TEST_ONLY__set(
    () => {
      assertParseTo('0.000000000000000000006', '0.00000000000000000001'); // >5
      assertParseSame('0.000000000000000000006', '6e-21');
      assertParseTo('1.000000000000000000004', '1.00000000000000000000'); // <5
      assertParseSame('1.000000000000000000004', '1.000000000000000000004e0');
    },
    { decimalScale: SCALE, accountingDecimalPlaces: ACC, roundingMode: ROUNDING_MODES.HALF_EVEN });

  _TEST_ONLY__set(
    () => {
      assertParseTo('0.000000000000000000006', '0.00000000000000000001'); // >5
      assertParseSame('0.000000000000000000006', '6e-21');
      assertParseTo('1.000000000000000000004', '1.00000000000000000000'); // <5
      assertParseSame('1.000000000000000000004', '1.000000000000000000004e0');    },
    { decimalScale: SCALE, accountingDecimalPlaces: ACC, roundingMode: ROUNDING_MODES.HALF_UP });
});

t('invalid inputs: throw on malformed numbers; accept lonely sign as 0', () => {
  _TEST_ONLY__set(
    () => {
      const bad = [
        '.', '+.', '-.', '1..2', '1.2.3',
        '1e', 'e10', '1ee10', '1e+', '1e-', '1e--2',
        'abc', 'NaN', 'Infinity', '+Infinity', '-Infinity',
        '0x10', '--1', '++2', '1.-2',
      ];
      for (const s of bad) {
        let threw = false;
        try { stringToBigIntScaled(s); } catch { threw = true; }
        if (!threw) assert.fail(`Expected throw, but parsed: "${s}"`);
      }

      // Contract: lonely signs are accepted as zero
      assert.strictEqual(toFixed(S('+')), '0.' + '0'.repeat(SCALE));
      assert.strictEqual(toFixed(S('-')), '0.' + '0'.repeat(SCALE));    },
    { decimalScale: SCALE, accountingDecimalPlaces: ACC, roundingMode: ROUNDING_MODES.HALF_EVEN });
});
