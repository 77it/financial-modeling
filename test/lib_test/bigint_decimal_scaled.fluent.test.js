import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

import {
  dsb
} from '../../src/lib/bigint_decimal_scaled.fluent.js';

t('bigint_decimal_scaled.fluent tests', () => {
  const out = dsb("10.50")
    .add("4.25")
    .sub("2")
    .mul(3)
    .div("0.5")
    .roundToAccounting()
    .toString({ trim: true });

  assert.strictEqual(out, '76.5');
});
