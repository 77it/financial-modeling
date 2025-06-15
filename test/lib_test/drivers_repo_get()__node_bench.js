// run it with `node --import ./__node__register-hooks.js`
// run it with `run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

# With Validation (4/5 times slower than without validation)
RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = false
circa 4 seconds for 1.000 get for ~1.900 days
circa 8 seconds for 1.000 get for ~1.900 days range

NODEJS run

driver get() benchmark, search single date, for circa ~1.900 times x 267 ops/sec ±4.99% (60 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 147 ops/sec ±0.47% (81 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 119 ops/sec ±1.05% (74 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 80.85 ops/sec ±0.42% (67 runs sampled)

DENO run

driver get() benchmark, search single date, for circa ~1.900 times x 296 ops/sec ±5.17% (63 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 169 ops/sec ±0.92% (86 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 126 ops/sec ±2.11% (72 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 85.24 ops/sec ±1.11% (74 runs sampled)


# Without Validation
RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = true
circa 2 seconds for 1.000 get for ~1.900 days
circa 6,3 seconds for 1.000 get for ~1.900 days range

NODEJS run

driver get() benchmark, search single date, for circa ~1.900 times x 479 ops/sec ±5.91% (66 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 220 ops/sec ±0.47% (82 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 157 ops/sec ±3.40% (76 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 104 ops/sec ±0.70% (75 runs sampled)

DENO run

driver get() benchmark, search single date, for circa ~1.900 times x 576 ops/sec ±6.03% (66 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times x 255 ops/sec ±0.85% (86 runs sampled)
driver get() benchmark, search range of dates, for circa ~1.900 times x 175 ops/sec ±0.74% (83 runs sampled)
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times x 108 ops/sec ±0.92% (79 runs sampled)
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
const searchArray_range = [];
{
  let currentDateToSearch = new Date(2022, 11, 1);  // from the first of the month
  for (let i = 0; i < (365 * 5 + 60); i++) {  // loop for 5 years + 2 months
    currentDateToSearch = addDaysToLocalDate(currentDateToSearch, 1);
    const currentDateToSearch_end = addMonthsToLocalDate(currentDateToSearch, 12);  // range end, + 1 year
    searchArray_range.push({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: currentDateToSearch, endDate: currentDateToSearch_end });
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
    for (let j = 0; j < searchArray_range.length; j++) {
      const _result = drivers.get(searchArray_range[j]);
    }
  })

  .add('driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times', function() {
    for (let j = 0; j < searchArray_range.length; j++) {
      const _result = drivers.SUPERDEDED_get_without_indexing(searchArray_range[j]);
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
