import { TaskLocks } from '../../../src/engine/tasklocks/tasklocks.js';
import * as CFG from '../../../src/config/engine.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

t('TaskLocks tests', async () => {
  const taskLocks = new TaskLocks({ defaultUnit: CFG.SIMULATION_NAME });

  // set
  assert(taskLocks.set({ name: 'testFunc', value: testFunc }));
  assert(!taskLocks.set({ name: 'testFunc', value: testFunc }));

  // get without unit
  assert.deepStrictEqual(taskLocks.get({ name: 'testFunc' })(), 99);

  // get with unit
  assert.deepStrictEqual(taskLocks.get({ unit: CFG.SIMULATION_NAME, name: 'testFunc' })(), 99);
});

function testFunc() {
  return 99;
}
