import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';

import { Agenda } from '../../../src/modules/_utils/agenda.js';

Deno.test('Agenda test', async () => {
  // create agenda
  const agenda = new Agenda();

  // get items before adding any
  assertEquals(agenda.get({ date: new Date('2020-01-01') }), []);

  // add some items
  agenda.set({ date: new Date('2020-01-01 10:18:25'), value: 1 });  // the time part is ignored
  agenda.set({ date: new Date('2020-01-01 23:10'), value: 2 });  // the time part is ignored
  agenda.set({ date: new Date('2020-01-02'), value: 3 });
  agenda.set({ date: new Date('2020-01-04'), value: 4 });

  // get items
  assertEquals(agenda.get({ date: new Date('2020-01-01 08:08') }), [1, 2]);  // the time part is ignored
  assertEquals(agenda.get({ date: new Date('2020-01-01') }), [1, 2]);
  assertEquals(agenda.get({ date: new Date('2020-01-02') }), [3]);
  assertEquals(agenda.get({ date: new Date('2020-01-03') }), []);
  assertEquals(agenda.get({ date: new Date('2020-01-04') }), [4]);
});
