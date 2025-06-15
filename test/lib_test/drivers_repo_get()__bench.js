// run it with `deno bench --allow-import`

/*
    CPU | Intel(R) Core(TM) i5-10210U CPU @ 1.60GHz
Runtime | Deno 2.2.12 (x86_64-pc-windows-msvc)

file:///C:/Users/virgo/github/PUBLIC/financial-modeling/test/lib_test/obj_utils__binarySearch_position_atOrBefore()__bench.js

benchmark                                                      time/iter (avg)        iter/s      (min … max)           p75      p99     p995
-------------------------------------------------------------- ----------------------------- --------------------- --------------------------
obj utils binarySearch_position_atOrBefore(), 1.000.000 loop          324.8 ms           3.1 (307.2 ms … 359.9 ms) 331.6 ms 359.9 ms 359.9 ms
comparable test: search same keys in a map, 1.000.000 loop             6.3 ms         158.2 (  3.0 ms …  71.2 ms)   5.1 ms  71.2 ms  71.2 ms
 */

import { DriversRepo } from '../../src/lib/drivers_repo.js';
import { addDaysToLocalDate, addMonthsToLocalDate } from '../../src/lib/date_utils.js';
import * as CFG from '../../src/config/engine.js';
import * as schema from '../../src/lib/schema.js';

import { sanitize } from '../../src/lib/schema_sanitization_utils.js';
import { stripTimeToLocalDate } from '../../src/lib/date_utils.js';
import { isNullOrWhiteSpace } from '../../src/lib/string_utils.js';

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

// 60 entry, one for each month (5 years)
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

// one entry for each day (5 years + 2 months), starting from the first date of the month
/** @type *[]} */
const searchArray = [];
{
  let currentDateToSearch = new Date(2022, 11, 1);  // from the first of the month
  for (let i = 0; i < (365 * 5 + 60); i++) {  // loop for 5 years + 2 months
    currentDateToSearch = addDaysToLocalDate(currentDateToSearch, 1);
    searchArray.push({ scenario: CFG.SCENARIO_BASE, unit: 'UnitA', name: 'driver XYZ', date: currentDateToSearch });
  }
}



//xxx; testa range




Deno.bench(`driver get() benchmark, search single date, ${loopCount.toLocaleString('it-IT')} loop`, () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < searchArray.length; j++) {
      const _result = drivers.get(searchArray[j]);
    }
  }
});

Deno.bench(`driver SUPERDEDED_get_without_indexing() benchmark, search single date, ${loopCount.toLocaleString('it-IT')} loop`, () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    for (let j = 0; j < searchArray.length; j++) {
      const _result = drivers.SUPERDEDED_get_without_indexing(searchArray[j]);
    }
  }
});
