import { SimObject_Metadata } from '../../../../src/engine/simobject/parts/simobject_metadata.js';

import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../../deps.js';
import { eqObj } from '../../../deps.js';

Deno.test('SimObject_Metadata tests', async (t) => {
  await t.step('test normal use, successful', async () => {
    const p1 = { metadata__Name: ['AA'], metadata__Value: ['BB'], metadata__PercentageWeight: [0.5] };
    const _1 = new SimObject_Metadata(p1);
    assert(eqObj(_1, p1));

    const p2 = { metadata__Name: ['AA', 'AAA'], metadata__Value: ['BB', 'BBB'], metadata__PercentageWeight: [0.5, 0.6] };
    const _2 = new SimObject_Metadata(p2);
    assert(eqObj(_2, p2));
  });

  await t.step('test error, array of different length', async () => {
    let _error = '';
    try {
      const p1 = { metadata__Name: ['AA'], metadata__Value: ['BB'], metadata__PercentageWeight: [] };
      const _1 = new SimObject_Metadata(p1);
    } catch (error) {
      _error = error.message;
    }
    assertEquals(_error, 'length of metadata arrays must be equal, got name = 1, value = 1, weight= 0');
  });

  await t.step('test error, extraneous property not present in validation object', async () => {
    let _error = '';
    try {
      const p1 = { extraneous_property: 99, metadata__Name: ['AA'], metadata__Value: ['BB'], metadata__PercentageWeight: [0.5] };
      const _1 = new SimObject_Metadata(p1);
    } catch (error) {
      _error = error.message;
    }
    assertEquals(_error, 'Validation error: ["extraneous_property is not a valid key, is missing from validation object"]');
  });
});
