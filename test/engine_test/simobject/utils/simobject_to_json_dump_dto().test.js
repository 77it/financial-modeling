import { SimObject } from '../../../../src/engine/simobject/simobject.js';
import { simObjectToJsonDumpDto } from '../../../../src/engine/simobject/utils/simobject_to_json_dump_dto.js';
import { ensureBigIntScaled } from '../../../../src/lib/bigint_decimal_scaled.arithmetic_x.js';
import { SimObjectTypes_enum } from '../../../../src/engine/simobject/enums/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../../src/engine/simobject/enums/doubleentryside_enum.js';
import { eqObj } from '../../../deps.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const _so_without_principal = new SimObject({
  type: SimObjectTypes_enum.BS_EQUITY__RESERVES__RELATEDTOMAJORITYSHAREHOLDERS,
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
  value: ensureBigIntScaled(19),
  writingValue: ensureBigIntScaled(19),
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  financialSchedule__amountWithoutScheduledDate: ensureBigIntScaled(18.9),
  financialSchedule__scheduledDates: [new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
  financialSchedule__scheduledAmounts: [
    ensureBigIntScaled(0.0001),
    ensureBigIntScaled(0.0011),
    ensureBigIntScaled(0.0111),
    ensureBigIntScaled(0.0877)
  ],
  is_Link__SimObjId: '',
  vsSimObjectName: '',
  versionId: 1
});

const _so_with_principal = new SimObject({
  type: SimObjectTypes_enum.BS_LIABILITY__FINANCIALDEBTS__LOAN,
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
  value: ensureBigIntScaled(19),
  writingValue: ensureBigIntScaled(19),
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  financialSchedule__amountWithoutScheduledDate: ensureBigIntScaled(18.9),
  financialSchedule__scheduledDates: [new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
  financialSchedule__scheduledAmounts: [
    ensureBigIntScaled(0.0001),
    ensureBigIntScaled(0.0011),
    ensureBigIntScaled(0.0111),
    ensureBigIntScaled(0.0877)
  ],
  is_Link__SimObjId: '',
  vsSimObjectName: '',
  versionId: 1
});

const _so_without_principal__JsonDump_Expected = {
  type: SimObjectTypes_enum.BS_EQUITY__RESERVES__RELATEDTOMAJORITYSHAREHOLDERS,
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
  value: '19',
  writingValue: '19',
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: '',
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [],
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [],
  financialSchedule__amountWithoutScheduledDate: '18.9',
  financialSchedule__scheduledDates: ['2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z'],
  financialSchedule__scheduledAmounts: ['0.0001', '0.0011', '0.0111', '0.0877'],
  is_Link__SimObjId: ''
};

const _so_with_principal__JsonDump_Expected = {
  type: SimObjectTypes_enum.BS_LIABILITY__FINANCIALDEBTS__LOAN,
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
  value: '19',
  writingValue: '19',
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: '18.9',
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: ['2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z'],
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: ['0.0001', '0.0011', '0.0111', '0.0877'],
  financialSchedule__amountWithoutScheduledDate: '',
  financialSchedule__scheduledDates: [],
  financialSchedule__scheduledAmounts: [],
  is_Link__SimObjId: ''
};

t('SimObject with principal: SimObject.toJsonDumpDto() tests', async () => {
  // save the DTO of the original object, that should be frozen
  const _so_Dto = simObjectToJsonDumpDto(_so_with_principal);

  assert(eqObj(_so_Dto, _so_with_principal__JsonDump_Expected));

  // try to change the value of the DTO, but the changes should be ignored, because the DTO is frozen
  try {_so_Dto.type = 'abcd';}
  catch (e) {}
  try {
    //@ts-ignore
    _so_Dto.newField = 44;
  }
  catch (e) {}
});

t('SimObject without principal: SimObject.toJsonDumpDto() tests', async () => {
  // save the DTO of the original object, that should be frozen
  const _so_Dto = simObjectToJsonDumpDto(_so_without_principal);
  assert(eqObj(_so_Dto, _so_without_principal__JsonDump_Expected));
});
