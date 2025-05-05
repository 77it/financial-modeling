import { Drivers } from '../../../src/engine/drivers/drivers.js';
import * as CFG from '../../../src/config/engine.js';

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

  const input = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25), value: 999 },  // #driver0, mutable, ignored (not added)

    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), value: '55' },  // #driver1[0], sanitized
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', value: '66' },  //  #driver2   value without date, set to Date(0), sanitized
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2), value: '5555' },  // #driver1[2], sanitized
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25), value: '555' },  // #driver1[1], sanitized

    { unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 25), value: 77 },  // #driver3[0]  missing scenario
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 2), value: 7777 },  // #driver3[2]
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 25), value: 777 },  // #driver3[1]

    { scenario: CFG.SCENARIO_BASE, unit: CFG.SIMULATION_NAME, name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25), value: 888 },  // #driver4[0]

    { name: '$driver XYZ4 missing Scenario and Unit', date: new Date(2023, 1, 25), value: 999 },  // #driver5[0]
  ];
  const _retErr = drivers.set(input);
  assert.deepStrictEqual(_retErr, [
    'Driver {"scenario":"scenario1","unit":"unita","name":"driver xyz"} is mutable and this is not allowed'
  ]);

  const input2 = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 12, 25), value: 9999 }  // #driver1 ignored, is immutable
  ];
  drivers.set(input2);

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
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: 'sum' }), 55+555+5555);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: 'average' }), (55+555+5555)/3);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: 'min' }), 55);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: 'max' }), 5555);

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
});
