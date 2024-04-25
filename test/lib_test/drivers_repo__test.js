import { schema } from '../deps.js';

import { DriversRepo } from '../../src/lib/drivers_repo.js';
import * as CFG from '../../src/config/engine.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('Drivers tests', async () => {
  const _currentScenario = 'SCENARIO1';
  const drivers = new DriversRepo({
    currentScenario: _currentScenario,
    baseScenario: CFG.SCENARIO_BASE,
    defaultUnit: CFG.SIMULATION_NAME,
    sanitizationType: schema.NUMBER_TYPE,
    prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
    prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES,
    allowMutable: true,
    freezeValues: false
  });

  const input = [
    { unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), value: 55 },  // #driver1[0]  missing scenario

    // immutable without dates
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', date: new Date(2024, 0, 2), value: 6677 },  //  #driver2, immutable without date; having a date, the date is removed and the value is saved
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', value: 66 },  //  #driver2; being already set, will be ignored
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', value: 6655 },  //  #driver2; being already set, will be ignored

    // immutable with dates
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2, 6, 2), value: '5555' },  // #driver1[2], string converted to number (after keeping only yyyy-mm-dd)
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2, 10, 30), value: '111' },  // date already present (after keeping only yyyy-mm-dd), ignored
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25), value: 555 },  // #driver1[1]

    // mutable
    { scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25), value: 77 },  // #driver3[0]
    { scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2), value: 7_777 },  // #driver3[3]
    { scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25), value: 777 },  // #driver3[1]

    { name: 'driver XYZ2', date: new Date(2023, 1, 25), value: 77_777 },  // #driver4  missing scenario and unit

    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3', value: 88_888 },  // #driver5  missing date, set to Date(0)
  ];
  const input_clone = structuredClone(input);
  const errors1 = drivers.set(input);
  assert.deepStrictEqual(
    errors1,
    [
      'Driver {"scenario":"scenario1","unit":"unita","name":"$$driver abc"} is immutable and the date 1970-01-01 is already present',
      'Driver {"scenario":"scenario1","unit":"unita","name":"$$driver abc"} is immutable and the date 1970-01-01 is already present',
      'Driver {"scenario":"scenario1","unit":"unita","name":"$driver xyz"} is immutable and the date 2024-01-02 is already present',
    ]
  );
  assert.deepStrictEqual(input, input_clone);  // input is not modified

  const input2 = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', value: 6655 },  //  #driver2; being already set, will be ignored
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 12, 25), value: 99 },  // immutable, ignored
    { scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 25), value: 7_775 },  // #driver3[2]
  ];
  const input2_clone = structuredClone(input2);
  const errors2 = drivers.set(input2);
  assert.deepStrictEqual(
    errors2,
    [
      'Driver {"scenario":"scenario1","unit":"unita","name":"$$driver abc"} is immutable and it is already present',
      'Driver {"scenario":"scenario1","unit":"unita","name":"$driver xyz"} is immutable and it is already present'
    ]
  );
  assert.deepStrictEqual(input2, input2_clone);  // input2 is not modified

  // query with all parameters empty: undefined
  //@ts-ignore
  assert.deepStrictEqual(drivers.get({}), undefined);

  // throws if the query parameter is not an object
  //@ts-ignore
  assert.throws(() => drivers.get());

  // query with wrong parameters: undefined
  const _query1 = { scenario: 'SCENARIOAAA', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) };
  const _query_clone = structuredClone(_query1);
  assert.deepStrictEqual(drivers.get(_query1), undefined);  // wrong scenario
  assert.deepStrictEqual(_query1, _query_clone);  // _query1 is not modified
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitBBB', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // wrong unit
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver CCC', date: new Date(2022, 11, 24) }), undefined);  // wrong name

  // #driver1[0] tests
  assert.deepStrictEqual(drivers.isDefined({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ' }), true);
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ' }), undefined);  // query without date, will query Date(0)
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25, 1, 1, 1, 1) }), 55);  // query with exact date; the time part is ignored
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 26) }), 55);  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 24) }), 55);  // query with last date before next driver
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25) }), 55);  // query scenario with wrong case
  // get an array of drivers with `endDate` parameter (range of dates test)
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), endDate: new Date(2022, 11, 26) }), [55]);
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31) }), [55, 555, 5555]);
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$driver XYZ', date: new Date(2099, 11, 31), endDate: new Date(0) }), [55, 555, 5555]);  // endDate before date, the query works the same because the dates are inverted

  // #driver1[1] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25) }), 555);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 26) }), 555);  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 1) }), 555);  // query with last date before next driver

  // #driver1[2] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2) }), 5555);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3) }), 5555);  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2099, 0, 1) }), 5555);  // query with a date long after driver

  // #driver2 tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC' }), 6677);  // query without date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', date: new Date(0) }), 6677);  // query with date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driver ABC', date: new Date(2099, 0, 1) }), 6677);  // query with date

  // #driver3[0] tests
  drivers.setToday(new Date(2022, 11, 25));  // set today
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ' }), 77);  // query without date (will query today)
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2022, 11, 25) }), 77);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 24) }), 77);  // query with last date before next driver
  drivers.setToday(new Date(0));  // reset today

  // #driver3[1] tests
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 1, 25) }), 777);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 24) }), 777);  // query with last date before next driver

  // #driver3[2] tests
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 25) }), 7_775);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2023, 11, 31) }), 7_775);  // query with last date before next driver

  // #driver3[3] tests
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 1) }), 7_775);  // query before set date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2024, 0, 2) }), 7_777);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: new Date(2099, 0, 1) }), 7_777);  // query with a date long after driver

  // #driver4 tests
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: CFG.SIMULATION_NAME, name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: CFG.SIMULATION_NAME, name: 'driver XYZ2', date: new Date(2024, 0, 1) }), 77_777);  // query with last date before next driver
  // missing scenario
  assert.deepStrictEqual(drivers.get({ unit: CFG.SIMULATION_NAME, name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date
  // missing Unit
  assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date
  // missing scenario and Unit
  assert.deepStrictEqual(drivers.get({ name: 'driver XYZ2', date: new Date(2023, 1, 25) }), 77_777);  // query with exact date

  // #driver5 tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3' }), 88_888);  // query without date, will query Date(0)
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3', date: new Date(0) }), 88_888);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driver XYZ3', date: new Date(2023, 1, 25) }), 88_888);
});

//#region Advanced Drivers tests
{
  const _currentScenario = 'SCENARIO1';
  const drivers = new DriversRepo({
    currentScenario: _currentScenario,
    baseScenario: CFG.SCENARIO_BASE,
    defaultUnit: CFG.SIMULATION_NAME,
    sanitizationType: schema.ANY_TYPE,
    prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
    prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES,
    allowMutable: true,
    freezeValues: false
  });

  const input = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', value: '{a: 99, b: false, c: [1, 2, \'3\', "4"]}' },
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC2', value: 'false' },
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC3', value: '[1, 2, \'3\', "4"]' },

    // 0, '', undefined, null tests
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ4', value: 0 },
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ5', value: '' },
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ6', value: undefined },
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ7', value: null },
  ];
  drivers.set(input);

  t('0, \'\', undefined, null tests', async () => {
    // 0, '', undefined, null tests
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ4' }), 0);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ5' }), '');
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ6' }), undefined);
    assert.deepStrictEqual(drivers.isDefined({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ6' }), true);
    assert.deepStrictEqual(drivers.isDefined({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ69999' }), false);  // non-existing driver
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverXYZ7' }), null);
  });

  t('get() with parseAsJSON5', async () => {
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1' }), '{a: 99, b: false, c: [1, 2, \'3\', "4"]}');
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', parseAsJSON5: true }), { a: 99, b: false, c: [1, 2, '3', '4'] });
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', parseAsJSON5: true }).a, 99);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', parseAsJSON5: true }).b, false);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', parseAsJSON5: true }).c[2], '3');
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', parseAsJSON5: true }).c[3], '4');
  });

  t('get() with sanitizationType as string or array (then sanitize())', async () => {
    // not existing driver is not sanitized
    assert.deepStrictEqual(
      drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'THIS-DRIVER-DOES-NOT-EXIST', sanitizationType: schema.NUMBER_TYPE }),
      undefined);
    assert.deepStrictEqual(
      drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', sanitizationType: schema.NUMBER_TYPE }),
      0);
    assert.deepStrictEqual(
      drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', sanitizationType: schema.STRING_TYPE }),
      '{a: 99, b: false, c: [1, 2, \'3\', "4"]}');
    assert.deepStrictEqual(
      drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', sanitizationType: [999, 888, 'aaa'] }),  // array sanitization, ignored
      '{a: 99, b: false, c: [1, 2, \'3\', "4"]}');
  });

  t('get() with parseAsJSON5 and sanitizationType as object (then sanitizeObj())', async () => {
    assert.deepStrictEqual(
      drivers.get({
        scenario: 'SCENARIO1',
        unit: 'UnitA',
        name: '$$driverABC1',
        parseAsJSON5: true,
        sanitizationType: { a: schema.STRING_TYPE, b: schema.STRING_TYPE, c: schema.ARRAY_OF_NUMBERS_TYPE }
      }),
      { a: '99', b: 'false', c: [1, 2, 3, 4] });
  });

  t('get() with parseAsJSON5 & sanitizationType as string', async () => {
    assert.deepStrictEqual(
      drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC2', parseAsJSON5: true, sanitizationType: schema.BOOLEAN_TYPE }),
      false);
    assert.deepStrictEqual(
      drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC3', parseAsJSON5: true, sanitizationType: schema.ANY_TYPE }),
      [1, 2, '3', '4']);
    assert.deepStrictEqual(
      drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC3', parseAsJSON5: true, sanitizationType: schema.ARRAY_OF_NUMBERS_TYPE }),
      [1, 2, 3, 4]);
  });

  t('get() with search', async () => {
    const input = [
      { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC Unit', value: 1 },
      { scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$$driverABC2 Default Unit', value: 2 },
      { scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: '$$driverABC2 Base Simulation', value: 3 },
      { scenario: CFG.SCENARIO_BASE, unit: CFG.SIMULATION_NAME, name: '$$driverABC2 Base Simulation, Default Unit', value: 4 },
    ];
    drivers.set(input);

    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC Unit', search: true }), 1);

    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC2 Default Unit', search: true }), 2);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$$driverABC2 Default Unit', search: true }), 2);
    assert.deepStrictEqual(drivers.get({
      scenario: CFG.SCENARIO_BASE,
      unit: CFG.SIMULATION_NAME,
      name: '$$driverABC2 Default Unit',
      search: true
    }), undefined);

    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC2 Base Simulation', search: true }), 3);
    assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: '$$driverABC2 Base Simulation', search: true }), 3);

    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC2 Base Simulation, Default Unit', search: true }), 4);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$$driverABC2 Base Simulation, Default Unit', search: true }), 4);
    assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: '$$driverABC2 Base Simulation, Default Unit', search: true }), 4);
    assert.deepStrictEqual(drivers.get({
      scenario: CFG.SCENARIO_BASE,
      unit: CFG.SIMULATION_NAME,
      name: '$$driverABC2 Base Simulation, Default Unit',
      search: true
    }), 4);
  });

  t('Scenario = undefined, Unit = undefined', async () => {
    // undefined scenario = _currentScenario
    drivers.set([{ scenario: undefined, unit: 'UnitA', name: '$$undefinedDriver1', value: 12345671 }]);
    assert.deepStrictEqual(drivers.get({ scenario: undefined, unit: 'UnitA', name: '$$undefinedDriver1' }), 12345671);
    assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$$undefinedDriver1' }), 12345671);
    // omitted scenario = _currentScenario
    drivers.set([{ unit: 'UnitA', name: '$$undefinedDriver1b', value: 123456711 }]);
    assert.deepStrictEqual(drivers.get({ unit: 'UnitA', name: '$$undefinedDriver1b' }), 123456711);
    assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: 'UnitA', name: '$$undefinedDriver1b' }), 123456711);

    // undefined unit = CFG.SIMULATION_NAME
    drivers.set([{ scenario: 'SCENARIO1', unit: undefined, name: '$$undefinedDriver2', value: 12345672 }]);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: undefined, name: '$$undefinedDriver2' }), 12345672);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$$undefinedDriver2' }), 12345672);
    // omitted unit = CFG.SIMULATION_NAME
    drivers.set([{ scenario: 'SCENARIO1', name: '$$undefinedDriver2b', value: 123456722 }]);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', name: '$$undefinedDriver2b' }), 123456722);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$$undefinedDriver2b' }), 123456722);

    // undefined scenario & undefined unit = _currentScenario & CFG.SIMULATION_NAME
    drivers.set([{ scenario: undefined, unit: undefined, name: '$$undefinedDriver3', value: 12345673 }]);
    assert.deepStrictEqual(drivers.get({ scenario: undefined, unit: undefined, name: '$$undefinedDriver3' }), 12345673);
    assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: CFG.SIMULATION_NAME, name: '$$undefinedDriver3' }), 12345673);
    // omitted scenario & omitted unit = _currentScenario & CFG.SIMULATION_NAME
    drivers.set([{ name: '$$undefinedDriver3b', value: 123456733 }]);
    assert.deepStrictEqual(drivers.get({ name: '$$undefinedDriver3b' }), 123456733);
    assert.deepStrictEqual(drivers.get({ scenario: _currentScenario, unit: CFG.SIMULATION_NAME, name: '$$undefinedDriver3b' }), 123456733);
  });

  t('Immutable driver with freezeValues: false, values are still mutable inside', async () => {
    // add immutable driver with object value, that won't be frozen
    const object = { a: 1, b: [2, 3] };
    const input = [
      { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$setting XYZ-object2', value: object },
    ];
    drivers.set(input);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$setting XYZ-object2' }), { a: 1, b: [2, 3] });
    // test that returned objects are stil mutable
    const _object = drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$setting XYZ-object2' });
    _object.a = 2;  // try to change object
    _object.c = 9; // try to add property
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$setting XYZ-object2' }), { a: 2, b: [2, 3], c: 9 });  // query of changed values
  });

  t('Immutable driver, subsequent writing on immutable items with the same date are ignored', async () => {
    const input = [
      { scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-immutable-with-same-date', date: new Date(2022, 11, 25), value: 'sameDate1' },
      { scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-immutable-with-same-date', date: new Date(2022, 11, 25), value: 'sameDate2' },
      { scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-immutable-with-same-date', date: new Date(2022, 11, 25), value: 'sameDate3' },
    ];
    drivers.set(input);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-immutable-with-same-date', date: new Date(2022, 11, 24) }), undefined);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-immutable-with-same-date', date: new Date(2022, 11, 25) }), 'sameDate1');
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-immutable-with-same-date', date: new Date(2022, 11, 26) }), 'sameDate1');
  });

  t('Mutable driver, subsequent writing on mutable items with the same date are overwritten', async () => {
    const input = [
      { scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-mutable-with-same-date', date: new Date(2022, 11, 25), value: 'sameDate1' },
      { scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-mutable-with-same-date', date: new Date(2022, 11, 25), value: 'sameDate2' },
      { scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-mutable-with-same-date', date: new Date(2022, 11, 25), value: 'sameDate3' },
    ];
    drivers.set(input);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-mutable-with-same-date', date: new Date(2022, 11, 24) }), undefined);
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-mutable-with-same-date', date: new Date(2022, 11, 25) }), 'sameDate3');
    assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-mutable-with-same-date', date: new Date(2022, 11, 26) }), 'sameDate3');
  });
}
//#endregion Advanced Drivers tests

//#region Immutable Drivers tests
{
  const _currentScenario = 'SCENARIO1';
  const drivers = new DriversRepo({
    currentScenario: _currentScenario,
    baseScenario: CFG.SCENARIO_BASE,
    defaultUnit: CFG.SIMULATION_NAME,
    sanitizationType: schema.ANY_TYPE,
    prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
    prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES,
    allowMutable: true,
    freezeValues: true
  });

  const input = [
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1', value: { a: 99, b: false, c: [1, 2, '3', '4'] } },
    { scenario: 'SCENARIO1', unit: 'UnitA', name: '$driverABC2', value: { a: 99, b: false, c: [1, 2, '3', '4'] } },
    { scenario: 'SCENARIO1', unit: 'UnitA', name: 'driverABC3', value: { a: 99, b: false, c: [1, 2, '3', '4'] } },
  ];
  drivers.set(input);

  t('Immutable driver with freezeValues: true, also mutable settings values are not mutable inside', async () => {
    const _object1 = drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$driverABC1' });
    const _object2 = drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driverABC2' });
    const _object3 = drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'driverABC3' });

    assert.deepStrictEqual(_object1, { a: 99, b: false, c: [1, 2, '3', '4'] });
    assert.deepStrictEqual(_object2, { a: 99, b: false, c: [1, 2, '3', '4'] });
    assert.deepStrictEqual(_object3, { a: 99, b: false, c: [1, 2, '3', '4'] });

    try {
      _object1.a = 2;  // try to change object
      _object2.a = 2;  // try to change object
      _object3.a = 2;  // try to change object
    } catch (_) {
      // ignore error
    }

    // assert that the saved objects are immutable
    assert.deepStrictEqual(_object1, { a: 99, b: false, c: [1, 2, '3', '4'] });
    assert.deepStrictEqual(_object2, { a: 99, b: false, c: [1, 2, '3', '4'] });
    assert.deepStrictEqual(_object3, { a: 99, b: false, c: [1, 2, '3', '4'] });
  });
}
//#endregion Immutable Drivers tests

