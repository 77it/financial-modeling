import { eqObj } from './lib/obj_utils.js';
import { Decimal } from '../vendor/decimaljs/decimal.js';
import { parseJSON5strict } from '../src/lib/json5.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('temp test', async () => {
  //@ts-ignore
  console.log(BigInt([]));
});
