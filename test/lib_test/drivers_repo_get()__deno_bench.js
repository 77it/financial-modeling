// run it with `deno bench --allow-import`

/*
RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = false

benchmark                                                                                                       time/iter (avg)        iter/s      (min … max)           p75      p99     p995
--------------------------------------------------------------------------------------------------------------- ----------------------------- --------------------- --------------------------
driver get() benchmark, search single date, for circa ~1.900 times, 1.000 loop                                            2.4 s           0.4 (   2.3 s …    2.6 s)    2.4 s    2.6 s    2.6 s
driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times, 1.000 loop                3.6 s           0.3 (   3.4 s …    4.0 s)    3.7 s    4.0 s    4.0 s
driver get() benchmark, search range of dates, for circa ~1.900 times, 1.000 loop                                         4.9 s           0.2 (   4.5 s …    5.4 s)    5.2 s    5.4 s    5.4 s
driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times, 1.000 loop             7.1 s           0.1 (   6.7 s …    8.3 s)    7.4 s    8.3 s    8.3 s
 */

import { DriversRepo } from '../../src/lib/drivers_repo.js';
import { addDaysToLocalDate, addMonthsToLocalDate } from '../../src/lib/date_utils.js';
import * as CFG from '../../src/config/engine.js';
import * as schema from '../../src/lib/schema.js';

const loopCount = 1_000;

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

// list to get one entry for each day (5 years + 2 months), starting from the first date of the month
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

Deno.bench(`driver get() benchmark, search single date, for circa ~1.900 times, ${loopCount.toLocaleString('it-IT')} loop`, () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < searchArray.length; j++) {
      const _result = drivers.get(searchArray[j]);
    }
  }
});

Deno.bench(`driver SUPERDEDED_get_without_indexing() benchmark, search single date, for circa ~1.900 times, ${loopCount.toLocaleString('it-IT')} loop`, () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < searchArray.length; j++) {
      const _result = drivers.SUPERDEDED_get_without_indexing(searchArray[j]);
    }
  }
});

Deno.bench(`driver get() benchmark, search range of dates, for circa ~1.900 times, ${loopCount.toLocaleString('it-IT')} loop`, () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < searchArray_range.length; j++) {
      const _result = drivers.get(searchArray_range[j]);
    }
  }
});

Deno.bench(`driver SUPERDEDED_get_without_indexing() benchmark, search range of dates, for circa ~1.900 times, ${loopCount.toLocaleString('it-IT')} loop`, () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < searchArray_range.length; j++) {
      const _result = drivers.SUPERDEDED_get_without_indexing(searchArray_range[j]);
    }
  }
});
