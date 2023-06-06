import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { Agenda } from '../../../src/modules/_utils/agenda.js';

Deno.test('Agenda test', async () => {
  // create agenda
  const agenda = new Agenda();

  // set simulation start date
  agenda.setSimulationStartDate(new Date('2020-01-01 23:59:08'));  // the time part is ignored
  assertThrows(() => agenda.setSimulationStartDate(new Date('2020-01-01')));  // the date can't be set two times

  // get items before adding any
  assertEquals(agenda.get({ date: new Date('2020-01-01') }), []);

  // add some simulation items
  agenda.set({ date: '2020/01/01', value: 999, isSimulation: true, info: {} });  // string in date format
  agenda.set({ date: new Date('2020-01-01 10:18:25'), value: '1', isSimulation: true, info: { aaa: 999 } });  // the time part is ignored, number in string format
  agenda.set({ date: new Date('2020-01-01 23:10'), value: 888, isSimulation: false, info: {} });  // isSimulation is false, so it is ignored
  agenda.set({ date: new Date('2020-01-01 23:10'), value: 2, isSimulation: true, info: {} });  // the time part is ignored
  agenda.set({ date: '2020-01-02', value: 3, isSimulation: true, info: {} });  // string in date format
  agenda.set({ date: '2020.01.04', value: 4, isSimulation: true, info: {} });  // string in date format
  // add some historical items
  agenda.set({ date: new Date('2019-12-31'), value: '777.05', isSimulation: false, info: {} });  // number in string format
  agenda.set({ date: new Date('2019-12-31'), value: '777,05', isSimulation: false, info: {} });  // number in INVALID string format, ignored
  agenda.set({ date: new Date('2019-12-31'), value: 'AAA', isSimulation: false, info: {} });  // number in INVALID string format, ignored
  agenda.set({ date: new Date('2019-12-31 10:18:25'), value: 2, isSimulation: false, info: { aaa: 999 } });  // the time part is ignored
  agenda.set({ date: new Date('2019-12-31 23:10'), value: 555, isSimulation: true, info: {} });  // isSimulation is true, so it is ignored
  agenda.set({ date: new Date('2019-12-31 23:10'), value: 3, isSimulation: false, info: {} });  // the time part is ignored

  // get items
  assertEquals(
    agenda.get({ date: new Date('2019-12-31 08:08') }),
    [
      { value: 777.05, isSimulation: false, info: {} },
      { value: 2, isSimulation: false, info: { aaa: 999 } },
      { value: 3, isSimulation: false, info: {} }
    ]
  );
  assertEquals(
    agenda.get({ date: new Date('2020-01-01 08:08') }),
    [
      { value: 999, isSimulation: true, info: {} },
      { value: 1, isSimulation: true, info: { aaa: 999 } },
      { value: 2, isSimulation: true, info: {} }
    ]
  );
  assertEquals(agenda.get({ date: new Date('2020-01-02') }), [{ value: 3, isSimulation: true, info: {} }]);
  assertEquals(agenda.get({ date: new Date('2020-01-03') }), []);
  assertEquals(agenda.get({ date: new Date('2020-01-04') }), [{ value: 4, isSimulation: true, info: {} }]);
});
