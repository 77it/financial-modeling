// run it with `deno bench`

/*
benchmark                            time (avg)        iter/s             (min … max)       p75       p99      p995
------------------------------------------------------------------------------------- -----------------------------
SimObject benchmark: normal use        1.47 s/iter           0.7    (980.76 ms … 1.99 s) 1.73 s 1.99 s 1.99 s
 */

import { SimObject } from '../../../src/engine/simobject/simobject.js';
import { SimObjectTypes_enum } from '../../../src/engine/simobject/enums/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../src/engine/simobject/enums/doubleentryside_enum.js';
import { ensureBigIntScaled } from '../../../src/lib/bigint_decimal_scaled.arithmetic_x.js';

const loopCount = 100_000;

Deno.bench("SimObject benchmark: normal use", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    new SimObject(p);
  }
});

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
