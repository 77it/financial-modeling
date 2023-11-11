import { SimObject } from '../../../src/engine/simobject/simobject.js';

import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';
import { SimObjectTypes_enum } from '../../../src/engine/simobject/enums/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../src/engine/simobject/enums/doubleentryside_enum.js';
import { toBigInt } from '../../../src/engine/simobject/utils/simobject_utils.js';

const DECIMALPLACES = 4;
const ROUNDINGMODEISROUND = true;

const p = {
  decimalPlaces: 4,
  type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
  id: '1',
  dateTime: new Date(2020, 0, 1),
  name: 'Bank account',
  description: 'Bank account description',
  mutableDescription: '',
  metadata__Name: [],
  metadata__Value: [],
  metadata__PercentageWeight: [],
  unitId: 'UnitA',
  doubleEntrySide: DoubleEntrySide_enum.BALANCESHEET_CREDIT,
  currency: 'EUR',
  intercompanyInfo__VsUnitId: '',
  value: toBigInt(19, DECIMALPLACES, ROUNDINGMODEISROUND),
  writingValue: toBigInt(19, DECIMALPLACES, ROUNDINGMODEISROUND),
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: toBigInt(18.9, DECIMALPLACES, ROUNDINGMODEISROUND),
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [1n, 11n, 111n, 877n],
  is_Link__SimObjId: '123',
  //vsSimObjectId: '991',
  versionId: 1
};

Deno.test('SimObject tests', async (t) => {
  await t.step('test normal use, successful', async () => {
    new SimObject(p);
  });

  await t.step('test error, metadata array of different length', async () => {
    const p1 = structuredClone(p);
    p1.metadata__Name = ['AA'];
    let _error = '';
    try {
      new SimObject(p1);
    } catch (error) {
      _error = error.message;
    }
    assertEquals(_error, 'length of metadata arrays must be equal, got name = 1, value = 0, weight= 0');
  });

  await t.step('test error, extraneous property not present in validation object', async () => {
    const p1 = structuredClone(p);
    p1.extraneous_property = 99;
    let _error = '';
    try {
      new SimObject(p1);
    } catch (error) {
      _error = error.message;
    }
    assertEquals(_error, 'Validation error: ["extraneous_property is not a valid key, is missing from validation object"]');
  });
});
