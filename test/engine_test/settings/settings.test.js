import { Settings } from '../../../src/engine/settings/settings.js';
import * as CFG from '../../../src/config/engine.js';
import { eqObj } from '../../deps.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('Settings tests', async () => {
  const drivers = new Settings({
    baseScenario: CFG.SCENARIO_BASE,
    currentScenario: 'SCENARIO1',
    defaultUnit: CFG.SIMULATION_NAME,
    prefix__immutable_without_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITHOUT_DATES,
    prefix__immutable_with_dates: CFG.IMMUTABLEPREFIX__IMMUTABLE_WITH_DATES,
  });

  drivers.setToday(new Date(2099, 11, 31));  // set today date to the end of year 2099, to let all tests below pass

  const symbol = Symbol('symbol');

  const input = [
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: 'setting XYZ', date: new Date(2022, 11, 25), value: 55 },  // #setting0, mutable, accepted

    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2022, 11, 25), value: '55' },  // #setting1[0], sanitized
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver ABC', value: '66' },  //  #setting2   value without date, set to Date(0), sanitized (default date)
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2024, 0, 2), value: '5555' },  // #setting1[2], sanitized
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2023, 1, 25), value: '555' },  // #setting1[1], sanitized

    { unit: ['UnitA'], name: '$driver XYZ2', date: new Date(2022, 11, 25), value: 77 },  // #setting3[0]  missing scenario
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ2', date: new Date(2024, 0, 2), value: [1, 2, 'aaa'] },  // #setting3[2]
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ2', date: new Date(2023, 1, 25), value: symbol },  // #setting3[1]

    { scenario: [CFG.SCENARIO_BASE], unit: [CFG.SIMULATION_NAME], name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25), value: 888 },  // #setting4[0]

    { name: '$driver XYZ4 missing Scenario and Unit', date: new Date(2023, 1, 25), value: 999 },  // #setting5[0]
  ];
  drivers.set(input);

  const input2 = [
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$driver XYZ', date: new Date(2022, 12, 25), value: 9999 }  // #driver1 ignored, is immutable
  ];
  assert.throws(() => { drivers.set(input2); });

  // query with all parameters empty: undefined
  //@ts-ignore
  assert.throws(() => drivers.get({}));

  // throws if the query parameter is not an object
  //@ts-ignore
  assert.throws(() => drivers.get());

  // query with wrong parameters: undefined
  assert.throws(() => drivers.get({ scenario: 'SCENARIOAAA', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }));  // wrong scenario
  assert.throws(() => drivers.get({ scenario: 'SCENARIO1', unit: 'UnitBBB', name: '$driver XYZ', date: new Date(2022, 11, 24) }));  // wrong unit
  assert.throws(() => drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver CCC', date: new Date(2022, 11, 24) }));  // wrong name

  // #setting0 tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 25) }), 55);  // mutable, accepted

  // #setting1[0] tests
  assert.deepStrictEqual(drivers.isDefined({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ' }), true);
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25) }), '55');  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 26) }), '55');  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 24) }), '55');  // query with last date before next driver
  assert.deepStrictEqual(drivers.get({ scenario: '  sCeNaRiO1  ', unit: '  Unita ', name: ' $driver xyz ', date: new Date(2022, 11, 25) }), '55');  // query scenario, unit, driver name with wrong case and whitespace, works nonetheless

  // #setting1[1] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 25) }), '555');  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2023, 1, 26) }), '555');  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 1) }), '555');  // query with last date before next driver

  // #setting1[2] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 2) }), '5555');  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2024, 0, 3) }), '5555');  // query with first date after driver
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2099, 0, 1) }), '5555');  // query with a date long after driver

  // #setting1, range of dates test
  //@ts-ignore
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), endDate: new Date(2022, 11, 24) }), '55');  // endDate is ignored, also if is < date
  //@ts-ignore
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(2022, 11, 25), endDate: new Date(2023, 1, 25) }), '55');
  //@ts-ignore
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31) }), undefined);
  //@ts-ignore
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ', date: new Date(0), endDate: new Date(2099, 11, 31), calc: 'sum' }), undefined);

  // #setting2 tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC' }), '66');  // query without date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', date: new Date(0) }), '66');  // query with date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver ABC', date: new Date(2099, 0, 1) }), '66');  // query with date

  // #setting3[0] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 24) }), undefined);  // undefined, query before set date
  assert.deepStrictEqual(drivers.get({ unit: 'UnitA', name: '$driver XYZ2', date: new Date(2022, 11, 25) }), 77);  // query with exact date, missing scenario
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 24) }), 77);  // query with last date before next driver

  // #setting3[1] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2023, 1, 25) }), symbol);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 1) }), symbol);  // query with last date before next driver

  // #setting3[2] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2024, 0, 2) }), [1, 2, 'aaa']);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2', date: new Date(2099, 0, 1) }), [1, 2, 'aaa']);  // query with a date long after driver

  // update mutable settings (adding new dates, editing existing one)
  const input3 = [
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: 'setting XYZ', date: new Date(2022, 11, 25), value: 5555 },  // #setting0[0], mutable updated
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: 'setting XYZ', date: new Date(2022, 11, 27), value: { a: 888, b: [555] } },  // #setting0[1], new
  ];
  drivers.set(input3);
  // #setting0 tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 25) }), 5555);  // #setting0[0], exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 26) }), 5555);  // #setting0[0], later
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 27) }), { a: 888, b: [555] });  // #setting0[1], exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ', date: new Date(2022, 11, 28) }), { a: 888, b: [555] });  // #setting0[1], later

  assert.deepStrictEqual(drivers.isDefined({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ2 99999' }), false);  // non-existing setting

  // #setting4[0] tests, search
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: CFG.SIMULATION_NAME, name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Unit search
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario search
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario and Unit search
  assert.deepStrictEqual(drivers.get({ unit: 'UnitA', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario automatically set to Default
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Unit automatically set to Default
  assert.deepStrictEqual(drivers.get({ name: '$driver XYZ3 default Scenario and Unit', date: new Date(2023, 1, 25) }), 888);  // query with exact date, with Scenario and Unit automatically set to Default

  // #setting5[0] tests, search
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: CFG.SIMULATION_NAME, name: '$driver XYZ4 missing Scenario and Unit', date: new Date(2023, 1, 25) }), 999);  // query with exact date
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$driver XYZ4 missing Scenario and Unit', date: new Date(2023, 1, 25) }), 999);  // query with exact date, with Unit search

  // add immutable settings with object and class value, that will be frozen
  const object1 = { a: 1, b: [2, 3] };

  //@ts-ignore
  class Class1 { #count; constructor() { this.#count = 0; this.a = 1; this.b = [2, 3];} count() { this.#count++; return this.#count } };
  const instance1 = new Class1();
  const input4 = [
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$$setting XYZ-object1', date: new Date(2022, 11, 25), value: object1 },  // #setting6[0], immutable drivers without dates, the first value is set
    { scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$setting XYZ-class1', date: new Date(2022, 11, 27), value: instance1 },  // #setting7[0]
  ];
  drivers.set(input4);

  drivers.setToday(new Date(0));
  // #setting6[0] tests with wrong date (immutable without date, set to Date(0))
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$setting XYZ-object1' }), object1);

  // #setting6[0] update to immutable driver, throw
  assert.throws(() => { drivers.set([{ scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$$setting XYZ-object1', date: new Date(2022, 1, 1), value: 123456 }]); });
  assert.throws(() => { drivers.set([{ scenario: ['SCENARIO1'], unit: ['UnitA'], name: '$$setting XYZ-object1', value: 654321 }]); });

  drivers.setToday(new Date(2022, 11, 27));

  // try to query a setting on a date later than today
  assert.throws(
    () => { drivers.get({ name: 'whatever', date: new Date(2023, 1, 25) }); },
    /Error: Date.*is greater than today/);

  // #setting6[0] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$setting XYZ-object1' }), { a: 1, b: [2, 3] });  // query with date set by today
  // test that returned objects are made immutable
  const _object1 = drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$$setting XYZ-object1' });
  assert.throws(() => { _object1.a = 2; });  // try to change object
  assert.throws(() => { _object1.c = 2; });  // try to add a new property
  assert.throws(() => { _object1.b.push(4); });  // try to change inner object

  // #setting7[0] tests
  assert(eqObj(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-class1' }), { a: 1, b: [2, 3] }));  // query with date set by today
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-class1', date: new Date(0) }), undefined); // #setting7[0] tests with wrong date (no value set on Date(0))
  // test that returned objects are made immutable
  const _instance1 = drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: '$setting XYZ-class1' });
  assert.deepStrictEqual(_instance1.count(), 1);  // the functions work also after freeze
  assert.deepStrictEqual(_instance1.count(), 2);  // the functions work also after freeze
  assert.throws(() => { _instance1.a = 2; });  // try to change object
  assert.throws(() => { _instance1.b.push(4); });  // try to change inner object

  // add mutable settings with object value, that won't be frozen
  const object2 = { a: 1, b: [2, 3] };
  const input5 = [
    { scenario:  ['SCENARIO1'], unit: ['UnitA'], name: 'setting XYZ-object2', date: new Date(2022, 11, 25), value: object2 },  // #setting8[0]
  ];
  drivers.set(input5);
  // #setting8[0] tests
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-object2' }), { a: 1, b: [2, 3] });  // query with date set by today
  // test that returned objects are stil mutable
  const _object2 = drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-object2' });

  // try to change object, edits are ignored, because every saved setting is immutable (not cloned with StructuredClone but frozen with deepFreeze)
  try {
    _object2.a = 2;
    _object2.c = 9;
  } catch (_) {
    // errors are expected, and ignored
  }
  assert.deepStrictEqual(drivers.get({ scenario: 'SCENARIO1', unit: 'UnitA', name: 'setting XYZ-object2' }), { a: 1, b: [2, 3] });  // query of unchanged values
});
