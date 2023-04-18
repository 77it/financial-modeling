import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { Settings } from '../../../src/engine/settings/settings.js';
import * as STD_NAMES from '../../../src/config/standard_names.js';

Deno.test('Settings tests', async () => {
  const drivers = new Settings({
    baseScenario: STD_NAMES.Scenario.BASE,
    currentScenario: 'SCENARIO1',
    defaultUnit: STD_NAMES.Simulation.NAME,
    prefix__immutable_without_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITHOUT_DATES,
    prefix__immutable_with_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITH_DATES,
  });

  const input = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 25), value: 55 },  // #setting0, mutable, accepted

    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), value: '55' },  // #setting1[0], sanitized
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', value: '66' },  //  #setting2   value without date, set to Date(0), sanitized
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2), value: '5555' },  // #setting1[2], sanitized
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25), value: '555' },  // #setting1[1], sanitized

    { unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 25), value: 77 },  // #setting3[0]  missing scenario
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 2), value: 7777 },  // #setting3[2]
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 25), value: 777 },  // #setting3[1]
  ];
  drivers.set(input);

  const input2 = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 12, 25), value: 9999 }  // #driver1 ignored, is immutable
  ];
  drivers.set(input2);

  // query with all parameters empty: undefined
  //@ts-ignore
    assertEquals(drivers.get({ }), undefined);

  // throws if the query parameter is not an object
  //@ts-ignore
  assertThrows(() => drivers.get());


  // query with wrong parameters: undefined
  assertEquals(drivers.get({ scenario: 'SCENARIOAAA', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // wrong scenario
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitBBB', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // wrong unit
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver CCC', date: new Date(2022, 11, 24) }), undefined);  // wrong name

  // #setting0 tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 25) }), 55);  // mutable, accepted

  // #setting1[0] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25) }), '55');  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 26) }), '55');  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 24) }), '55');  // query with last date before next driver
  assertEquals(drivers.get({ scenario: 'sCeNaRiO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25) }), '55');  // query scenario with wrong case

  // #setting1[1] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25) }), "555");  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 26) }), "555");  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 1) }), "555");  // query with last date before next driver

  // #setting1[2] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2) }), "5555");  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3) }), "5555");  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2099, 0, 1) }), "5555");  // query with a date long after driver

  // #setting1, range of dates test
  //@ts-ignore
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), endDate: new Date(2022, 11, 24) }), "55");  // endDate is ignored, also if is < date
  //@ts-ignore
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), endDate: new Date(2023, 1, 25) }), "55");
  //@ts-ignore
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31) }), undefined);
  //@ts-ignore
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: 'sum' }), undefined);

  // #setting2 tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC' }), '66');  // query without date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', date: new Date(0) }), '66');  // query with date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', date: new Date(2099, 0, 1) }), '66');  // query with date

  // #setting3[0] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assertEquals(drivers.get({ unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 25) }), 77);  // query with exact date, missing scenario
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 24) }), 77);  // query with last date before next driver

  // #setting3[1] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 25) }), 777);  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 1) }), 777);  // query with last date before next driver

  // #setting3[2] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 2) }), 7777);  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2099, 0, 1) }), 7777);  // query with a date long after driver

  // update mutable settings (adding new dates, editing existing one)
  const input3 = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 25), value: 5555 },  // #setting0[0], updated
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 27), value: { a:888, b:[555] } },  // #setting0[1], new
  ];
  drivers.set(input3);
  // #setting0 tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 25) }), 5555);  // #setting0[0], exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 26) }), 5555);  // #setting0[0], later
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 27) }), { a:888, b:[555] });  // #setting0[1], exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 28) }), { a:888, b:[555] });  // #setting0[1], later
});
