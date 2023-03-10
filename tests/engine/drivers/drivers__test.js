import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { Drivers } from '../../../src/engine/drivers/drivers.js';
import * as STD_NAMES from '../../../src/modules/_names/standard_names.js';

Deno.test('Drivers tests', async () => {
  const drivers = new Drivers();

  const input = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25), value: 55 },  // #driver1[0]
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver ABC', value: 66 },  //  #driver2   value without date, set to Date(0)
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2), value: 5555 },  // #driver1[2]
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25), value: 555 },  // #driver1[1]

    { unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25), value: 77 },  // #driver3[0]  missing scenario
    { scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2), value: 7777 },  // #driver3[2]
    { scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25), value: 777 },  // #driver3[1]
  ];
  drivers.set(input);

  const input_ignored = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 12, 25), value: 99 }
  ];
  drivers.set(input_ignored);

  // query with all parameters empty: undefined
  //@ts-ignore
  assertEquals(drivers.get({ }), undefined);

  // throws if the query parameter is not an object
  //@ts-ignore
  assertThrows(() => drivers.get());


  // query with wrong driver parameters: undefined
  assertEquals(drivers.get({ scenario: 'SCENARIOAAA', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // wrong scenario
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitBBB', name: 'driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // wrong unit
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver CCC', date: new Date(2022, 11, 24) }), undefined);  // wrong name

  // #driver1[0] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ' }), 55);  // query without date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25) }), 55);  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 26) }), 55);  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 24) }), 55);  // query with last date before next driver
  assertEquals(drivers.get({ scenario: 'sCeNaRiO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25) }), 55);  // query scenario with wrong case

  // #driver1[1] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25) }), 555);  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 26) }), 555);  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 1) }), 555);  // query with last date before next driver

  // #driver1[2] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2) }), 5555);  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 3) }), 5555);  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ', date: new Date(2099, 0, 1) }), 5555);  // query with a date long after driver

  // #driver2 tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver ABC' }), 66);  // query without date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver ABC', date: new Date(0) }), 66);  // query with date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver ABC', date: new Date(2099, 0, 1) }), 66);  // query with date

  // #driver3[0] tests
  assertEquals(drivers.get({ unit: 'UnitA', name: 'driver XYZ' }), 77);  // query without date, missing scenario
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25) }), 77);  // query with exact date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 24) }), 77);  // query with last date before next driver

  // #driver3[1] tests
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25) }), 777);  // query with exact date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 1) }), 777);  // query with last date before next driver

  // #driver3[2] tests
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2) }), 7777);  // query with exact date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2099, 0, 1) }), 7777);  // query with a date long after driver
});
