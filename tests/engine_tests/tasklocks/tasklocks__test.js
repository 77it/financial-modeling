import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { TaskLocks } from '../../../src/engine/tasklocks/tasklocks.js';
import * as CFG from '../../../src/config/engine.js';

Deno.test('TaskLocks tests', async () => {
  const taskLocks = new TaskLocks({ defaultUnit: CFG.SIMULATION_NAME });

  // set
  assert(taskLocks.set({ name: 'testFunc', value: testFunc }));
  assertFalse(taskLocks.set({ name: 'testFunc', value: testFunc }));

  // get without unit
  assertEquals(taskLocks.get({ name: 'testFunc' })(), 99);

  // get with unit
  assertEquals(taskLocks.get({ unit: CFG.SIMULATION_NAME, name: 'testFunc' })(), 99);
});

function testFunc() {
  return 99;
}
