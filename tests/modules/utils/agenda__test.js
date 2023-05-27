import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';

import { Agenda } from '../../../src/modules/_utils/agenda.js';

Deno.test('Agenda test', async () => {
  // create agenda
  const agenda = new Agenda();

  // get items before adding any
  assertEquals(agenda.get({ date: new Date('2020-01-01') }), []);

  // add some items
  agenda.set({ date: new Date('2020-01-01'), value: 1 });
  agenda.set({ date: new Date('2020-01-01'), value: 2 });
  agenda.set({ date: new Date('2020-01-02'), value: 3 });
  agenda.set({ date: new Date('2020-01-04'), value: 4 });

  // get items
  assertEquals(agenda.get({ date: new Date('2020-01-01') }), [1, 2]);
  assertEquals(agenda.get({ date: new Date('2020-01-02') }), [3]);
  assertEquals(agenda.get({ date: new Date('2020-01-03') }), []);
  assertEquals(agenda.get({ date: new Date('2020-01-04') }), [4]);
});
