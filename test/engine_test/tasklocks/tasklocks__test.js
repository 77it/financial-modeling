import { TaskLocks } from '../../../src/engine/tasklocks/tasklocks.js';
import * as CFG from '../../../src/config/engine.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

t('TaskLocks tests', async () => {
  const taskLocks = new TaskLocks({ defaultUnit: CFG.SIMULATION_NAME });

  // set on default unit
  assert(taskLocks.set({ name: 'testFunc', value: testFunc }));
  assert(!taskLocks.set({ name: 'testFunc', value: testFunc }));
  assert(taskLocks.set({ unit: '', name: 'testFunc2', value: testFunc }));

  // set on named unit
  assert(taskLocks.set({ unit: 'AAA', name: 'testFunc', value: testFunc }));

  // get without unit
  assert.deepStrictEqual(taskLocks.get({ name: 'testFunc' })(), 99);
  assert.deepStrictEqual(taskLocks.get({ name: 'testFunc2' })(), 99);

  // get without unit, with invalid/empty unit values
  assert.deepStrictEqual(taskLocks.get({ unit: '', name: 'testFunc' })(), 99);
  assert.deepStrictEqual(taskLocks.get({ unit: '     ', name: 'testFunc' })(), 99);
  assert.deepStrictEqual(taskLocks.get({ unit: undefined, name: 'testFunc' })(), 99);
  //@ts-ignore
  assert.deepStrictEqual(taskLocks.get({ unit: null, name: 'testFunc' })(), 99);

  // get with unit
  assert.deepStrictEqual(taskLocks.get({ unit: CFG.SIMULATION_NAME, name: 'testFunc' })(), 99);
  assert.deepStrictEqual(taskLocks.get({ unit: CFG.SIMULATION_NAME, name: 'testFunc2' })(), 99);
  assert.deepStrictEqual(taskLocks.get({ unit: 'AAA', name: 'testFunc' })(), 99);

  // error getting non-existing TaskLock
  assert.throws(() => taskLocks.get({ name: 'nonExisting' }), { message: `TaskLock '{"unit":"$","name":"nonexisting"}' is not defined.` });

  // testing defined TaskLock
  assert(taskLocks.isDefined({ name: 'testFunc' }));
  assert(taskLocks.isDefined({ unit: CFG.SIMULATION_NAME, name: 'testFunc' }));

  // testing not defined TaskLock
  assert(!taskLocks.isDefined({ name: 'nonExisting' }));
});

function testFunc() {
  return 99;
}
