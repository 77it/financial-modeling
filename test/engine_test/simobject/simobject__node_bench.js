// run it with `node --import ./__node__register-hooks.js`
// run it with `run --allow-read --allow-write --allow-net --allow-import`

// docs https://benchmarkjs.com/

/*
P16s

# With Validation (4/5 times slower than without validation)
RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = false
circa 17 seconds for 1 million SimObjects

NODEJS run
SimObject benchmark: normal use x 57,606 ops/sec ±5.09% (64 runs sampled)

DENO run
SimObject benchmark: normal use x 61,084 ops/sec ±3.25% (63 runs sampled)



# Without Validation
RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = true
circa 4 seconds for 1 million SimObjects

NODEJS run
SimObject benchmark: normal use x 286,455 ops/sec ±3.46% (63 runs sampled)

DENO run
SimObject benchmark: normal use x 250,524 ops/sec ±7.24% (65 runs sampled)
 */

import * as Benchmark from "benchmark";
const suite = new Benchmark.default.Suite('');

import { SimObject } from '../../../src/engine/simobject/simobject.js';
import { SimObjectTypes_enum } from '../../../src/engine/simobject/enums/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../src/engine/simobject/enums/doubleentryside_enum.js';
import { ensureBigIntScaled } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import * as CFG from '../../../src/config/engine.js';

const p = {
  type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
  id: '1',
  dateTime: new Date(2020, 0, 1, 5, 10, 55, 55),
  name: 'Bank account',
  description: 'Bank account description',
  mutableDescription: '',
  metadata__Name: ['a', 'b', 'c'],
  metadata__Value: ['1', '2', '3'],
  metadata__PercentageWeight: [0.1, 0.2, 0.3],
  unitId: 'UnitA',
  doubleEntrySide: DoubleEntrySide_enum.BALANCESHEET_CREDIT,
  currency: 'EUR',
  intercompanyInfo__VsUnitId: '',
  value: ensureBigIntScaled(19),
  writingValue: ensureBigIntScaled(19),
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  financialSchedule__amountWithoutScheduledDate: ensureBigIntScaled(18.9),
  financialSchedule__scheduledDates: [new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
  financialSchedule__scheduledAmounts: [1n, 11n, 111n, 877n],
  is_Link__SimObjId: '123',
  vsSimObjectName: '991',
  versionId: 1
};

console.log(`RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS = ${CFG.RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS}`);

// add tests
suite.add('SimObject benchmark: normal use', function() {
  new SimObject(p);
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
