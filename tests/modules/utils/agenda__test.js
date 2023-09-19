import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { Agenda } from '../../../src/modules/_utils/agenda.js';

Deno.test('Agenda test', async () => {
  // create agenda + set simulation start date (the time part is ignored)
  const agenda = new Agenda({ simulationStartDate: new Date('2020-01-01 23:59:08') });

  // get items before adding any
  assertEquals(agenda.get({ date: new Date('2020-01-01') }), []);

  // add some simulation items
  agenda.set({ date: '2020/01/01', isSimulation: true, data: { value: '999' } });  // string in date format, value is string (no sanitization is done)
  agenda.set({ date: new Date('2020-01-01 10:18:25'), isSimulation: true, data: { aaa: 999, value: 1 } });  // the time part is ignored
  agenda.set({ date: new Date('2020-01-01 23:10'), isSimulation: false, data: {} });  // isSimulation is false, so it is ignored
  agenda.set({ date: new Date('2020-01-01 23:10'), isSimulation: true, data: { value: 2 } });  // the time part is ignored
  agenda.set({ date: '2020-01-02', isSimulation: true, data: { value: 3 } });  // date in string format
  agenda.set({ date: '2020.01.04', isSimulation: true, data: { value: 4 } });  // date in string format
  // add some historical items
  agenda.set({ date: new Date('2019-12-31'), isSimulation: false, data: { value: 777.05 } });
  agenda.set({ date: new Date('2019-12-31 10:18:25'), isSimulation: false, data: { aaa: 999, value: 2 } });  // the time part is ignored
  agenda.set({ date: new Date('2019-12-31 23:10'), isSimulation: true, data: {} });  // isSimulation is true, so it is ignored
  agenda.set({ date: new Date('2019-12-31 23:10'), isSimulation: false, data: { value: 3 } });  // the time part is ignored

  // get items
  assertEquals(
    agenda.get({ date: new Date('2019-12-31 08:08') }),
    [
      { isSimulation: false, data: { value: 777.05 } },
      { isSimulation: false, data: { aaa: 999, value: 2 } },
      { isSimulation: false, data: { value: 3 } }
    ]
  );
  assertEquals(
    agenda.get({ date: new Date('2020-01-01 08:08') }),
    [
      { isSimulation: true, data: { value: '999' } },
      { isSimulation: true, data: { aaa: 999, value: 1 } },
      { isSimulation: true, data: { value: 2 } }
    ]
  );
  assertEquals(agenda.get({ date: new Date('2020-01-02') }), [{ isSimulation: true, data: { value: 3 } }]);
  assertEquals(agenda.get({ date: new Date('2020-01-03') }), []);
  assertEquals(agenda.get({ date: new Date('2020-01-04') }), [{ isSimulation: true, data: { value: 4 } }]);
});
