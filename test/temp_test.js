import { Decimal } from '../vendor/decimal/decimal.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('temp test', async () => {
  const a = new Decimal("0");
  const b = new Decimal("  0   ");
  assert(a.eq(0));
  assert(b.eq(0));
});
