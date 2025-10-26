// file bigint_decimal_scaled.finance.test.js

import { fxPmt, FXPMT_PAYMENT_DUE_TIME } from '../../src/lib/bigint_decimal_scaled.finance.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);
