import { Drivers, GET_CALC } from '../../../src/engine/drivers/drivers.js';
import * as CFG from '../../../src/config/engine.js';
import { DRIVER_PREFIXES__ZERO_IF_NOT_SET } from '../../../src/config/globals.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('Drivers tests', async () => {
  const drivers = new Drivers({
    baseScenario: CFG.SCENARIO_BASE,
    currentScenario: 'SCENARIO1',
    defaultUnit: CFG.SIMULATION_NAME,
    prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
    prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES,
  });

  drivers.setToday(new Date(2099, 11, 31));  // set today date to the end of year 2099

  // try to query a driver on dates later than today
  assert.throws(
    () => { drivers.get({ name: 'whatever', date: new Date(2100, 1, 25) }); },
    /Error: Date.*is greater than today/);
  assert.throws(
    () => { drivers.get({ name: 'whatever', date: new Date(2000, 1, 25), endDate: new Date(2100, 1, 25) }); },
    /Error: EndDate.*is greater than today/);

  const input = [
    {scenario: ['SCENARIO1'], unit: ['UnitA'], name: 'driver XYZ', date: new Date(2022, 11, 25), value: 999 },  // #driver0, mutable, ignored (not added)

    {scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2022, 11, 25), value: '55' },  // #driver1[0], sanitized
    {scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver ABC', value: '66' },  //  #driver2   value without date, set to Date(0), sanitized
    {scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2024, 0, 2), value: '5555' },  // #driver1[2], sanitized
    {scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2023, 1, 25), value: '555' },  // #driver1[1], sanitized

    { unit: ['UnitA'], name: '$driver XYZ2', date: new Date(2022, 11, 25), value: 77 },  // #driver3[0]  missing scenario
    {scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ2', date: new Date(2024, 0, 2), value: 7777 },  // #driver3[2]
    {scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ2', date: new Date(2023, 1, 25), value: 777 },  // #driver3[1]

    {scenario: [CFG.SCENARIO_BASE], unit: [CFG.SIMULATION_NAME], name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25), value: 888 },  // #driver4[0]

    { name: '$driver XYZ4 missing Scenario and Unit', date: new Date(2023, 1, 25), value: 999 },  // #driver5[0]

    { name: '$$immutable driver without dates', date: new Date(2023, 1, 25), value: 99911999 },  // #driver6[0] immutable driver without dates
  ];
  const _retErr = drivers.set(input);
  assert.deepStrictEqual(_retErr, [
    'Driver {scenario: scenario1, unit: unita, name: driver xyz} is mutable and this is not allowed'
  ]);

  // #driver1 update to immutable driver, throw
  const input2 = [
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2022, 12, 25), value: 9999 }
  ];
  assert.throws(() => { drivers.set(input2); });

  // query #driver6
  assert.deepStrictEqual(drivers.get({ name: '$$immutable driver without dates', date: new Date(0) }), 99911999);

  // #driver6 update to immutable driver without dates, throw
  assert.throws(() => { drivers.set([{ name: '$$immutable driver without dates', date: new Date(2023, 1, 25), value: 99911999 }]); });
  assert.throws(() => { drivers.set([{ name: '$$immutable driver without dates', date: new Date(2023, 1, 26), value: 99911999 }]); });

  // query with all parameters empty: throws, because the driver is not found
  //@ts-ignore
  assert.throws(() => drivers.get({}));

  // throws if the query parameter is not an object
  //@ts-ignore
  assert.throws(() => drivers.get());


  // query with wrong parameters: undefined
  assert.throws(() => drivers.get({ scenario: 'SCENARIOAAA', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }));  // wrong scenario
  assert.throws(() => drivers.get({ scenario: 'SCENARIO1', unit: 'UnitBBB', name: '$driver XYZ', date: new Date(2022, 11, 24) }));  // wrong unit
  assert.throws(() => drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver CCC', date: new Date(2022, 11, 24) }));  // wrong name

  // #driver0 tests
  assert.throws(() => drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25) }));  // mutable driver, not added, then get fails

  // #driver1[0] tests
  assert.deepStrictEqual(drivers.isDefined({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ'}), true);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }), 0);  // sanitized to 0, query before set date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25) }), 55);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 26) }), 55);  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 24) }), 55);  // query with last date before next driver
  assert.deepStrictEqual(drivers.get({ scenario: 'sCeNaRiO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25) }), 55);  // query scenario with wrong case

  // #driver1[1] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25) }), 555);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 26) }), 555);  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 1) }), 555);  // query with last date before next driver

  // #driver1[2] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2) }), 5555);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3) }), 5555);  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2099, 0, 1) }), 5555);  // query with a date long after driver

  // #driver1, range of dates test
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25), endDate: new Date(2022, 11, 25) }), 55+555);  // endDate before date, the query works the same because the dates are inverted
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), endDate: new Date(2023, 1, 25) }), 55+555);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31) }), 55+555+5555);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: GET_CALC.SUM }), 55+555+5555);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: GET_CALC.AVERAGE }), (55+555+5555)/3);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: GET_CALC.MIN }), 55);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: GET_CALC.MAX }), 5555);

  // #driver1, query of empty date range (will return an empty array [] then the returned value will be zero)
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2022, 11, 24) }), 0);  // query before driver date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3), endDate: new Date(2099, 11, 24) }), 0);  // query after driver date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3), endDate: new Date(2099, 11, 24), calc: GET_CALC.SUM }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3), endDate: new Date(2099, 11, 24), calc: GET_CALC.AVERAGE }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3), endDate: new Date(2099, 11, 24), calc: GET_CALC.MIN }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3), endDate: new Date(2099, 11, 24), calc: GET_CALC.MAX }), 0);

  // #driver2 tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC' }), 66);  // query without date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', date: new Date(0) }), 66);  // query with date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', date: new Date(2099, 0, 1) }), 66);  // query with date

  // #driver3[0] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 24) }), 0);  // sanitized to 0, query before set date
  assert.deepStrictEqual(drivers.get({ unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 25) }), 77);  // query with exact date, missing scenario
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 24) }), 77);  // query with last date before next driver

  // #driver3[1] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 25) }), 777);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 1) }), 777);  // query with last date before next driver

  // #driver3[2] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 2) }), 7777);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2099, 0, 1) }), 7777);  // query with a date long after driver

  assert.deepStrictEqual(drivers.isDefined({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2 99999' }), false);  // non-existing driver

  // #driver4[0] tests, search
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: CFG.SIMULATION_NAME, name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Unit search
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario search
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario and Unit search
  assert.deepStrictEqual(drivers.get({ unit: 'UnitA', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario automatically set to Default
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Unit automatically set to Default
  assert.deepStrictEqual(drivers.get({ name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario and Unit automatically set to Default

  // #driver5[0] tests, search
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$driver XYZ4 missing Scenario and Unit', date: new Date(2023, 1, 25) }), 999);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ4 missing Scenario and Unit', date: new Date(2023, 1, 25) }), 999);  // query with exact date, with Unit search

  //#region test daily drivers, with DRIVER_PREFIXES__ZERO_IF_NOT_SET content
  // read first prefix
  const _daily_driver_prefix_1 = DRIVER_PREFIXES__ZERO_IF_NOT_SET.get()[0];
  // read first prefix
  const input_daily_drivers = [
    // daily driver #1
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2022, 11, 25), value: 55 },
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2024, 0, 2), value: 5555 },

    // daily driver #2
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2023, 11, 25), value: 77 },
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2025, 0, 2), value: 888 },
  ];
  const _retErr_daily = drivers.set(input_daily_drivers);

  assert.deepStrictEqual(_retErr_daily, []);

  // get daily driver in the exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2022, 11, 25) }), 55);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2024, 0, 2) }), 5555);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2023, 11, 25) }), 77);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2025, 0, 2) }), 888);

  // get daily driver in date != from definition dates: returns zero
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2022, 11, 24) }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2022, 11, 26) }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2024, 0, 1) }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #1', date: new Date(2024, 0, 3) }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2023, 11, 24) }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2023, 11, 26) }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2025, 0, 1) }), 0);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: _daily_driver_prefix_1 + '$driver XYZ #2', date: new Date(2025, 0, 3) }), 0);
  //#endregion test daily drivers, with DRIVER_PREFIXES__ZERO_IF_NOT_SET content
});
