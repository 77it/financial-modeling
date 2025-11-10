// file bigint_decimal_scaled.EXPERIMENTAL_finance_3.test.js
/*
**Purpose:** Regression test the BigInt fixed-point libraries (arithmetic + finance)
across multiple scales defined in RUN_CONFIGS.

It configures both libs to the same scale/rounding, sets Decimal precision to
the per-scale decprec, and cross-checks a representative set of operations
against Decimal.js with strict equality at the selected scale.
*/

import { Decimal } from '../../vendor/decimaljs/decimal.unlocked_vendor_test_only.js';
import { ROUNDING_MODES } from '../../src/config/engine.js';
import {
  _TEST_ONLY__set as _TEST_ONLY__set_arithmetic,
  stringToBigIntScaled, bigIntScaledToString, fxAdd, fxSub, fxMul, fxDiv, roundToAccounting,
} from '../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import {
  fxPowInt, fxNPV, fxPmt,
} from '../../src/lib/decimal_scaled_bigint__dsb.EXPERIMENTAL_finance_x.js';

import {
  RUN_CONFIGS, decToSig, pow10n,
} from './decimal_scaled_bigint__dsb.test_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('Strict regression test of all BigInt arithmetic/finance functions against Decimal.js at variable scale', () => {
  for (const cfg of RUN_CONFIGS) {
    console.log(`\n===== REGRESSION @ scale=${cfg.scale}, acc=${cfg.acc}, decprec=${cfg.decprec} =====`);

    Decimal.set({ precision: cfg.decprec, rounding: Decimal.ROUND_HALF_EVEN });

    _TEST_ONLY__set_arithmetic(
      () => {
        // --- Parse / format round-trip ---
        {
          const s = '-414709.5842125638743'; // diverse magnitude + many frac digits
          const sig = stringToBigIntScaled(s);
          const back = bigIntScaledToString(sig);
          // Compare to Decimal at current scale
          const refSig = decToSig(new Decimal(s), cfg.scale);
          assert.strictEqual(sig, refSig, 'parse mismatch vs Decimal baseline');
          assert.strictEqual(stringToBigIntScaled(back), sig, 'round-trip parse/format mismatch');
        }

        // --- Basic arithmetic vs Decimal ---
        {
          const A = ['-123.4567', '0', '3.14', '99999.9999'].map(stringToBigIntScaled);
          const B = ['5.5', '-2.75', '0.00001', '-7777.0003'].map(stringToBigIntScaled);

          for (let i = 0; i < A.length; i++) {
            const a = A[i], b = B[i];

            // Add
            {
              const ours = fxAdd(a, b);
              const theirs = decToSig(new Decimal(bigIntScaledToString(a)).plus(bigIntScaledToString(b)), cfg.scale);
              assert.strictEqual(ours, theirs, 'fxAdd mismatch');
            }
            // Sub
            {
              const ours = fxSub(a, b);
              const theirs = decToSig(new Decimal(bigIntScaledToString(a)).minus(bigIntScaledToString(b)), cfg.scale);
              assert.strictEqual(ours, theirs, 'fxSub mismatch');
            }
            // Mul
            {
              const ours = fxMul(a, b);
              const theirs = decToSig(new Decimal(bigIntScaledToString(a)).times(bigIntScaledToString(b)), cfg.scale);
              assert.strictEqual(ours, theirs, 'fxMul mismatch');
            }
            // Div (avoid 0)
            {
              const bb = (b === 0n) ? stringToBigIntScaled('1') : b;
              const ours = fxDiv(a, bb);
              const theirs = decToSig(new Decimal(bigIntScaledToString(a)).div(bigIntScaledToString(bb)), cfg.scale);
              assert.strictEqual(ours, theirs, 'fxDiv mismatch');
            }
          }
        }

        // --- Accounting quantization ---
        {
          const x = stringToBigIntScaled('12345.6789012345');
          const q = roundToAccounting(x);
          const ref = decToSig(new Decimal('12345.6789012345').toDecimalPlaces(cfg.acc), cfg.scale);
          // `roundToAccounting` may be implemented at BigInt scale and then upscaled; compare via string rendering to the same decimals
          assert.strictEqual(bigIntScaledToString(q), bigIntScaledToString(ref), 'roundToAccounting mismatch');
        }

        // --- (1+r)^n vs Decimal ---
        {
          const one = pow10n(cfg.scale);
          for (const rs of ['-0.2', '0', '0.0001', '0.01', '0.05', '0.1234']) {
            const rSig = stringToBigIntScaled(rs);
            const base = fxAdd(one, rSig);
            for (const n of [0, 1, 2, 5, 10, 25]) {
              const ours = fxPowInt(base, n);
              const theirs = decToSig(new Decimal(1).plus(new Decimal(rs)).pow(n), cfg.scale);
              assert.strictEqual(ours, theirs, `(1+r)^n mismatch r=${rs}, n=${n}`);
            }
          }
        }

        // --- NPV & PMT sanity vs Decimal ---
        {
          // NPV
          const r = stringToBigIntScaled('0.0432');
          const cfs = ['-150', '50', '60', '65', '70'].map(stringToBigIntScaled);
          const oursNPV = fxNPV(r, cfs);
          let refNPV = new Decimal(0);
          const rd = new Decimal(bigIntScaledToString(r));
          for (let t = 0; t < cfs.length; t++) {
            refNPV = refNPV.plus(new Decimal(bigIntScaledToString(cfs[t])).div(new Decimal(1).plus(rd).pow(t)));
          }
          assert.strictEqual(oursNPV, decToSig(refNPV, cfg.scale), 'fxNPV mismatch');

          // PMT (ordinary)
          const r2 = stringToBigIntScaled('0.0125');
          const pv = stringToBigIntScaled('25000');
          const n = 36;
          const oursPMT = fxPmt(r2, n, pv);
          const base = new Decimal(1).plus(new Decimal(bigIntScaledToString(r2)));
          const pow = base.pow(n);
          const pmtRef = new Decimal(bigIntScaledToString(r2))
            .times(new Decimal(bigIntScaledToString(pv)).times(pow))
            .div(pow.minus(1));
          assert.strictEqual(oursPMT, decToSig(pmtRef, cfg.scale), 'fxPmt mismatch');
        }
      },
      {decimalScale: cfg.scale, accountingDecimalPlaces: cfg.acc, roundingMode: ROUNDING_MODES.HALF_EVEN });
  }
});
