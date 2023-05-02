import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { SimObject } from '../../../src/engine/simobject/simobject.js';
import { simObjectToJsonDumpDto, toBigInt } from '../../../src/engine/simobject/utils/simobject_utils.js';
import { SimObjectTypes_enum } from '../../../src/engine/simobject/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../src/engine/simobject/enums/doubleentryside_enum.js';

const decimalPlaces = 4;
const roundingModeIsRound = true;

const _so = new SimObject({
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
  value: toBigInt(19, decimalPlaces, roundingModeIsRound),
  writingValue: toBigInt(19, decimalPlaces, roundingModeIsRound),
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: toBigInt(18.9, decimalPlaces, roundingModeIsRound),
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [1n, 11n, 111n, 877n],
  is_Link__SimObjId: '',
  vsSimObjectId: '',
  versionId: 1
});

Deno.test('SimObject.toJsonDumpDto() tests', async () => {
  const _soJsonDump_Expected = {
    type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
    id: '1',
    date: '2020-01-01T00:00:00.000Z',
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
    value: '19.0000',
    writingValue: '19.0000',
    alive: true,
    command__Id: '1',
    command__DebugDescription: '',
    commandGroup__Id: '1',
    commandGroup__DebugDescription: '',
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: '18.9000',
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: ['2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z'],
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: ['0.0001', '0.0011', '0.0111', '0.0877'],
    is_Link__SimObjId: ''
  };

  assertEquals(JSON.stringify(simObjectToJsonDumpDto(_so)), JSON.stringify(_soJsonDump_Expected));
});
