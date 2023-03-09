import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { SharedConstants } from '../../../src/engine/sharedconstants/sharedconstants.js';
import * as STD_NAMES from '../../../src/modules/_names/standardnames.js';

Deno.test('SharedConstants tests', async () => {
  const sharedConstants = new SharedConstants();

  // set
  sharedConstants.set({ name: 'testFunc', value: testFunc });

  // get without namespace
  assertEquals(sharedConstants.get({ name: 'testFunc' })(), 99);

  // get with namespace
  assertEquals(sharedConstants.get({ namespace: STD_NAMES.Simulation.NAME, name: 'testFunc' })(), 99);
});

function testFunc() {
  return 99;
}
