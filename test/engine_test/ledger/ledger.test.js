// run with `deno test --allow-read THIS-FILE-NAME`

import { Ledger } from '../../../src/engine/ledger/ledger.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

/**
 * Fake callback to dump the transactions
 * @param {string} dump - The transactions dump
 */
function appendTrnDump(dump) {
  console.log(dump);
}


const ledger = new Ledger({ appendTrnDump: appendTrnDump, decimalPlaces: 4, roundingModeIsRound: true });

t('ledger: getNextSequentialId() & getNextSequentialIdString()', async () => {
  /** @type {any} */ let _id = ledger.getNextSequentialId();
  assert.deepStrictEqual(_id, 1);
  _id = ledger.getNextSequentialIdString();
  assert.deepStrictEqual(_id, "2");
  _id = ledger.getNextSequentialId();
  assert.deepStrictEqual(_id, 3);
  assert.notDeepStrictEqual(_id, "3");
  _id = ledger.getNextSequentialIdString();
  assert.deepStrictEqual(_id, "4");
  assert.notDeepStrictEqual(_id, 4);
});
