import { SimObject } from '../../../../src/engine/simobject/simobject.js';
import { simObjectToJsonDumpDto } from '../../../../src/engine/simobject/utils/simobject_to_json_dump_dto.js';
import { toBigInt } from '../../../../src/engine/simobject/utils/to_bigint.js';
import { SimObjectTypes_enum } from '../../../../src/engine/simobject/enums/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../../src/engine/simobject/enums/doubleentryside_enum.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const decimalPlaces = 4;
const roundingModeIsRound = true;

const _so = new SimObject({
  decimalPlaces: decimalPlaces,
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
  vsSimObjectName: '',
  versionId: 1
});

t('SimObject.toJsonDumpDto() tests', async () => {
  const _soJsonDump_Expected = {
    type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
    id: '1',
    date: '2020-01-01T00:00:00.000Z',
    name: 'BANK ACCOUNT',
    description: 'BANK ACCOUNT DESCRIPTION',
    mutableDescription: '',
    metadata__Name: [],
    metadata__Value: [],
    metadata__PercentageWeight: [],
    unitId: 'UNITA',
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

  // save the DTO of the original object, that should be frozen
  const _so_Dto = simObjectToJsonDumpDto(_so);
  // try to change the value of the DTO, but the changes should be ignored, because the DTO is frozen
  try {_so_Dto.type = 'abcd';}
  catch (e) {}
  try {
    //@ts-ignore
    _so_Dto.newField = 44;
  }
  catch (e) {}
  assert.deepStrictEqual(JSON.stringify(_so_Dto), JSON.stringify(_soJsonDump_Expected));
});
