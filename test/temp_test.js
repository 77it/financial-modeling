import { eqObj } from './lib/obj_utils.js';
import { Decimal } from '../vendor/decimal/decimal.js';
import { parseJSON5strict } from '../src/lib/json5.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('temp test', async () => {
  const a = new Decimal(".75");
  const b = new Decimal(.75);
  assert(eqObj(a, b));

  const d = parseJSON5strict('[".5",-.25,1000]');
  assert.deepStrictEqual(d, [".5",-.25,1000]);

  console.log(new Decimal("00"));
});
