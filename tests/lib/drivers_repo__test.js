import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../deps.js';
import { sanitization } from '../deps.js';

import { DriversRepo } from '../../src/lib/drivers_repo.js';
import * as STD_NAMES from '../../src/modules/_names/standard_names.js';

Deno.test('Drivers tests', async () => {
  const _currentScenario = 'SCENARIO1';
  const drivers = new DriversRepo({
    currentScenario: _currentScenario,
    baseScenario: STD_NAMES.Scenario.BASE,
    defaultUnit: STD_NAMES.Simulation.NAME,
    typeForValueSanitization: sanitization.NUMBER_TYPE,
    prefix__immutable_without_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITHOUT_DATES,
    prefix__immutable_with_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITH_DATES,
    allowMutable: true
  });

  const input = [
    { unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), value: 55 },  // #driver1[0]  missing scenario

    // immutable without dates
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', date: new Date(2024, 0, 2), value: 6677 },  //  #driver2, immutable without date; having a date, this set will be ignored
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', value: 66 },  //  #driver2   value without date, set to Date(0)
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', value: 6655 },  //  #driver2; being already set, will be ignored

    // immutable with dates
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2, 6, 2), value: '5555' },  // #driver1[2], string converted to number (after keeping only yyyy-mm-dd)
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2, 10, 30), value: '111' },  // date already present (after keeping only yyyy-mm-dd), ignored
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25), value: 555 },  // #driver1[1]

    // mutable
    { scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25), value: 77 },  // #driver3[0]
    { scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2), value: 7_777 },  // #driver3[3]
    { scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25), value: 777 },  // #driver3[1]

    { name: 'driver XYZ2', date: new Date(2023, 1, 25), value: 77_777 },  // #driver4  missing scenario and unit

    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3', value: 88_888 },  // #driver5  missing date, set to Date(0)
  ];
  const input_clone = structuredClone(input);
  const errors1 = drivers.set(input);
  assertEquals(
    errors1,
    [
      'Driver {"scenario":"scenario1","unit":"unita","name":"$$driver abc"} is immutable without dates and the date is not Date(0)',
      'Driver {"scenario":"scenario1","unit":"unita","name":"$$driver abc"} is immutable and the date 1970-01-01 is already present',
      'Driver {"scenario":"scenario1","unit":"unita","name":"$driver xyz"} is immutable and the date 2024-01-02 is already present',
    ]
  );
  assertEquals(input, input_clone);  // input is not modified

  const input2 = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', value: 6655 },  //  #driver2; being already set, will be ignored
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 12, 25), value: 99 },  // immutable, ignored
    { scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 25), value: 7_775 },  // #driver3[2]
  ];
  const input2_clone = structuredClone(input2);
  const errors2 = drivers.set(input2);
  assertEquals(
    errors2,
    [
      'Driver {"scenario":"scenario1","unit":"unita","name":"$$driver abc"} is immutable and it is already present',
      'Driver {"scenario":"scenario1","unit":"unita","name":"$driver xyz"} is immutable and it is already present'
    ]
  );
  assertEquals(input2, input2_clone);  // input2 is not modified

  // query with all parameters empty: undefined
  //@ts-ignore
  assertEquals(drivers.get({ }), undefined);

  // throws if the query parameter is not an object
  //@ts-ignore
  assertThrows(() => drivers.get());


  // query with wrong driver parameters: undefined
  const _query1 = { scenario: 'SCENARIOAAA', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) };
  const _query_clone = structuredClone(_query1);
  assertEquals(drivers.get(_query1), undefined);  // wrong scenario
  assertEquals(_query1, _query_clone);  // _query1 is not modified
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitBBB', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // wrong unit
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver CCC', date: new Date(2022, 11, 24) }), undefined);  // wrong name

  // #driver1[0] tests
  assertEquals(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ' }),undefined);  // query without date, will query Date(0)
  assertEquals(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assertEquals(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25, 1, 1, 1, 1) }), 55);  // query with exact date; the time part is ignored
  assertEquals(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 26) }), 55);  // query with first date after driver
  assertEquals(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 24) }), 55);  // query with last date before next driver
  assertEquals(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25) }), 55);  // query scenario with wrong case

  // #driver1[1] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25) }), 555);  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 26) }), 555);  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 1) }), 555);  // query with last date before next driver

  // #driver1[2] tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2) }), 5555);  // query with exact date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3) }), 5555);  // query with first date after driver
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2099, 0, 1) }), 5555);  // query with a date long after driver

  // #driver2 tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC' }), 66);  // query without date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', date: new Date(0) }), 66);  // query with date
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', date: new Date(2099, 0, 1) }), 66);  // query with date

  // #driver3[0] tests
  drivers.setToday(new Date(2022, 11, 25));  // set today
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ' }), 77);  // query without date (will query today)
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25) }), 77);  // query with exact date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 24) }), 77);  // query with last date before next driver
  drivers.setToday(new Date(0));  // reset today

  // #driver3[1] tests
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25) }), 777);  // query with exact date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 24) }), 777);  // query with last date before next driver

  // #driver3[2] tests
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 25) }), 7_775);  // query with exact date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 31) }), 7_775);  // query with last date before next driver

  // #driver3[3] tests
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 1) }), 7_775);  // query before set date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2) }), 7_777);  // query with exact date
  assertEquals(drivers.get({ scenario: STD_NAMES.Scenario.BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2099, 0, 1) }), 7_777);  // query with a date long after driver

  // #driver4 tests
  assertEquals(drivers.get({ scenario: _currentScenario, unit: STD_NAMES.Simulation.NAME, name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date
  assertEquals(drivers.get({ scenario: _currentScenario, unit: STD_NAMES.Simulation.NAME, name: 'driver XYZ2', date: new Date(2024, 0, 1) }), 77_777);  // query with last date before next driver
  // missing scenario
  assertEquals(drivers.get({ unit: STD_NAMES.Simulation.NAME, name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date
  // missing Unit
  assertEquals(drivers.get({ scenario: _currentScenario, name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date
  // missing scenario and Unit
  assertEquals(drivers.get({ name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date

  // #driver5 tests
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3' }),88_888);  // query without date, will query Date(0)
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3', date: new Date(0) }),88_888);
  assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3', date: new Date(2023, 1, 25) }),88_888);
});

Deno.test('Advanced Drivers tests', async (t) => {
  await t.step('get() with parseAsJSON5', async () => {
    const _currentScenario = 'SCENARIO1';
    const drivers = new DriversRepo({
      currentScenario: _currentScenario,
      baseScenario: STD_NAMES.Scenario.BASE,
      defaultUnit: STD_NAMES.Simulation.NAME,
      typeForValueSanitization: sanitization.ANY_TYPE,
      prefix__immutable_without_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITHOUT_DATES,
      prefix__immutable_with_dates: STD_NAMES.ImmutablePrefix.PREFIX__IMMUTABLE_WITH_DATES,
      allowMutable: true
    });

    const input = [
      { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', value: '{a: 99, b: false, c: [1, 2, \'3\', "4"]}' },
    ];
    drivers.set(input);

    assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC'}), '{a: 99, b: false, c: [1, 2, \'3\', "4"]}');
    assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', parseAsJSON5: true }), {a: 99, b: false, c: [1, 2, "3", '4']});
    assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', parseAsJSON5: true }).a, 99);
    assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', parseAsJSON5: true }).b, false);
    assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', parseAsJSON5: true }).c[2], "3");
    assertEquals(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', parseAsJSON5: true }).c[3], "4");
  });
});
