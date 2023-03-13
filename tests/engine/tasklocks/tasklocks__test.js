import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { TaskLocks } from '../../../src/engine/tasklocks/tasklocks.js';
import * as STD_NAMES from '../../../src/modules/_names/standard_names.js';

Deno.test('TaskLocks tests', async () => {
  const taskLocks = new TaskLocks();

  // set
  assert(taskLocks.set({ name: 'testFunc', value: testFunc }));
  assertFalse(taskLocks.set({ name: 'testFunc', value: testFunc }));

  // get without unit
  assertEquals(taskLocks.get({ name: 'testFunc' })(), 99);

  // get with unit
  assertEquals(taskLocks.get({ unit: STD_NAMES.Simulation.NAME, name: 'testFunc' })(), 99);
});

function testFunc() {
  return 99;
}
