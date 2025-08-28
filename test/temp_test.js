import { Decimal } from '../vendor/decimal/decimal.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('temp test', async () => {
  const a = 0.1 + 0.2;
  const b = new Decimal(a);
  console.log(b.toString());
  assert(b.toFixed(1) === '0.3');
});
