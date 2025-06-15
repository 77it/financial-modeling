// run it with `node --import ./__node__register-hooks.js`
// run it with `run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

# With Validation (4/5 times slower than without validation)
RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = false
circa 2,9 seconds for 1.000 get for ~1.900 days (344 ops/sec)
circa 4,2 seconds for 1.000 get for ~1.900 days range (236 ops/sec)

NODEJS run

driver get() benchmark, search single date, for circa ~1.900 times x 369 ops/sec ±1.67% (78 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 218 ops/sec ±1.80% (77 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 300 ops/sec ±1.83% (78 runs sampled)
driver get() benchmark, search range of dates 3 days, for circa ~1.900 times x 318 ops/sec ±2.00% (80 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 130 ops/sec ±1.92% (73 runs sampled)

DENO run

driver get() benchmark, search single date, for circa ~1.900 times x 344 ops/sec ±5.01% (68 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 156 ops/sec ±0.49% (78 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 236 ops/sec ±0.74% (85 runs sampled)
driver get() benchmark, search range of dates 3 days, for circa ~1.900 times x 238 ops/sec ±0.92% (80 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 82.49 ops/sec ±1.26% (71 runs sampled)


# Without Validation
RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = true
circa 1,57 seconds for 1.000 get for ~1.900 days (636 ops/sec)
circa 2,45 seconds for 1.000 get for ~1.900 days range (407 ops/sec)

NODEJS run

RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = true
driver get() benchmark, search single date, for circa ~1.900 times x 636 ops/sec ±2.27% (79 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 293 ops/sec ±1.89% (73 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 478 ops/sec ±1.51% (78 runs sampled)
driver get() benchmark, search range of dates 3 days, for circa ~1.900 times x 489 ops/sec ±1.78% (78 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 151 ops/sec ±1.66% (74 runs sampled)

DENO run

RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = true
driver get() benchmark, search single date, for circa ~1.900 times x 682 ops/sec ±4.10% (73 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 245 ops/sec ±1.29% (80 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 407 ops/sec ±1.32% (86 runs sampled)
driver get() benchmark, search range of dates 3 days, for circa ~1.900 times x 413 ops/sec ±1.53% (83 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 104 ops/sec ±2.13% (77 runs sampled)

 */

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

import { DriversRepo } from '../../src/lib/drivers_repo.js';
import { addDaysToLocalDate, addMonthsToLocalDate } from '../../src/lib/date_utils.js';
import * as CFG from '../../src/config/engine.js';
import * as schema from '../../src/lib/schema.js';

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

// set 60 entry, one for each month (5 years)
/** @type *[]} */
const inputArray = [];
{
  let currentDate = new Date(2022, 11, 25);
  for (let i = 0; i < 60; i++) {
    currentDate = addMonthsToLocalDate(currentDate, 1);
    inputArray.push({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: currentDate, value: i });
  }
}
drivers.set(inputArray);

// list to get one entry for ~1.900 days (5 years + 2 months), starting from the first date of the month
/** @type *[]} */
const searchArray = [];
{
  let currentDateToSearch = new Date(2022, 11, 1);  // from the first of the month
  for (let i = 0; i < (365 * 5 + 60); i++) {  // loop for 5 years + 2 months
    currentDateToSearch = addDaysToLocalDate(currentDateToSearch, 1);
    searchArray.push({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: currentDateToSearch });
  }
}
/** @type *[]} */
const searchArray_range_1year = [];
{
  let currentDateToSearch = new Date(2022, 11, 1);  // from the first of the month
  for (let i = 0; i < (365 * 5 + 60); i++) {  // loop for 5 years + 2 months
    currentDateToSearch = addDaysToLocalDate(currentDateToSearch, 1);
    const currentDateToSearch_end = addMonthsToLocalDate(currentDateToSearch, 12);  // range end, + 1 year
    searchArray_range_1year.push({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: currentDateToSearch, endDate: currentDateToSearch_end });
  }
}
/** @type *[]} */
const searchArray_range_3days = [];
{
  let currentDateToSearch = new Date(2022, 11, 1);  // from the first of the month
  for (let i = 0; i < (365 * 5 + 60); i++) {  // loop for 5 years + 2 months
    currentDateToSearch = addDaysToLocalDate(currentDateToSearch, 1);
    const currentDateToSearch_end = addDaysToLocalDate(currentDateToSearch, 3);  // range end, + 3 days
    searchArray_range_3days.push({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: currentDateToSearch, endDate: currentDateToSearch_end });
  }
}

console.log(`RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = ${CFG.RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS}`);

// add tests
suite.add('driver get() benchmark, search single date, for circa ~1.900 times', function() {
  for (let j = 0; j < searchArray.length; j++) {
    const _result = drivers.get(searchArray[j]);
  }
})

  .add('driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times', function() {
    for (let j = 0; j < searchArray.length; j++) {
      const _result = drivers.SUPERDEDED_get_without_indexing(searchArray[j]);
    }
  })

  .add('driver get() benchmark, search range of dates, for circa ~1.900 times', function() {
    for (let j = 0; j < searchArray_range_1year.length; j++) {
      const _result = drivers.get(searchArray_range_1year[j]);
    }
  })

  .add('driver get() benchmark, search range of dates 3 days, for circa ~1.900 times', function() {
    for (let j = 0; j < searchArray_range_3days.length; j++) {
      const _result = drivers.get(searchArray_range_1year[j]);
    }
  })
  .add('driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times', function() {
    for (let j = 0; j < searchArray_range_1year.length; j++) {
      const _result = drivers.SUPERDEDED_get_without_indexing(searchArray_range_1year[j]);
    }
  })

  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('error', function (event) {
    console.error(`Test "${event.target.name}" failed with error:`);
    console.error(event.target.error); // logs the actual Error object
  })
  // run async
  .run({ 'async': true });
