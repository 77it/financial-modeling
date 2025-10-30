import { SimObject } from '../../../src/engine/simobject/simobject.js';
import { simObjectToDto } from '../../../src/engine/simobject/utils/simobject_to_dto.js';
import { ensureBigIntScaled } from '../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { SimObjectTypes_enum } from '../../../src/engine/simobject/enums/simobject_types_enum.js';
import { DoubleEntrySide_enum } from '../../../src/engine/simobject/enums/doubleentryside_enum.js';
import { eqObj } from '../../lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const _so = new SimObject({
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
  value: ensureBigIntScaled(19),
  writingValue: ensureBigIntScaled(19),
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  financialSchedule__amountWithoutScheduledDate: ensureBigIntScaled(18.9),
  financialSchedule__scheduledDates: [new Date(2020, 0, 1, 1, 1, 1, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
  financialSchedule__scheduledAmounts: [
    ensureBigIntScaled(0.0001),
    ensureBigIntScaled(0.0011),
    ensureBigIntScaled(0.0111),
    ensureBigIntScaled(0.0877)
  ],
  is_Link__SimObjId: '123',
  vsSimObjectName: '991aaa',
  versionId: 1
});

const _so2_withExtras = new SimObject({
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
  value: ensureBigIntScaled(19),
  writingValue: ensureBigIntScaled(19),
  alive: true,
  command__Id: '1',
  command__DebugDescription: '',
  commandGroup__Id: '1',
  commandGroup__DebugDescription: '',
  financialSchedule__amountWithoutScheduledDate: ensureBigIntScaled(18.9),
  financialSchedule__scheduledDates: [new Date(2020, 0, 1, 1, 1, 1, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
  financialSchedule__scheduledAmounts: [
    ensureBigIntScaled(0.0001),
    ensureBigIntScaled(0.0011),
    ensureBigIntScaled(0.0111),
    ensureBigIntScaled(0.0877)
  ],
  is_Link__SimObjId: '123',
  vsSimObjectName: '991aaa',
  versionId: 1,
  extras: {a: 999, b: 'aaa'}
});

t('SimObject.simObjectToDto() & .with() without value tests', async () => {
  const _so_With = _so.with();
  const _so_With2_withExtras = _so2_withExtras.with({});

  const _soDump_Expected = {
    type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
    id: '1',
    dateTime: new Date(2020, 0, 1),
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
    is_Link__SimObjId: '123',
    vsSimObjectName: '991AAA',
    versionId: 2,
    extras: {}
  };

  const _soDump_Expected2_withExtras = {
    type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
    id: '1',
    dateTime: new Date(2020, 0, 1),
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
    is_Link__SimObjId: '123',
    vsSimObjectName: '991AAA',
    versionId: 2,
    extras: {a: 999, b: 'aaa'}
  };

  let _error = '';

  // save the DTO of the original object, that should be frozen
  const _so_With_Dto = simObjectToDto(_so_With);

  // try to change the value of the DTO, but the changes will go in error, because the DTO is frozen
  try {
    _so_With_Dto.type = 'abcd';
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  assert(_error === "Cannot assign to read only property 'type' of object '#<SimObjectDto>'"
    || _error === "Attempted to assign to readonly property.");  // second message is for Bun platform
  try {
    //@ts-ignore
    _so_With_Dto.newField = 44;
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  console.log(_error);
  assert(_error === "Cannot add property newField, object is not extensible"
    || _error === "Attempting to define property on object that is not extensible.");  // second message is for Bun platform

  assert(eqObj(_so_With_Dto, _soDump_Expected));

  assert(eqObj(simObjectToDto(_so_With2_withExtras), _soDump_Expected2_withExtras));
});

t('SimObject.simObjectToDto() & .with() tests', async () => {
  const _so_With = _so2_withExtras.with({
    //@ts-ignore
    type: SimObjectTypes_enum.BS_CREDIT__ACCRUALSCREDITS,  // ignored
    id: '999', // ignored
    dateTime: new Date(2021, 0, 1),  // updated
    name: '!!!bank account???',  // ignored
    description: '!!!Bank account description???',  // ignored
    mutableDescription: 'aaa',  // updated
    metadata__Name: ['a'],  // ignored
    metadata__Value: ['b'],  // ignored
    metadata__PercentageWeight: [9],  // ignored
    unitId: '!!!UnitA???',  // ignored
    doubleEntrySide: DoubleEntrySide_enum.INCOMESTATEMENT_DEBIT,  // ignored
    currency: '???EUR!!!',  // ignored
    intercompanyInfo__VsUnitId: 'ABCD',  // ignored
    value: ensureBigIntScaled(18),  // updated
    writingValue: ensureBigIntScaled(16),  // updated
    alive: false,  // updated
    command__Id: '2',  // updated
    command__DebugDescription: 'aaa aaa',  // updated
    commandGroup__Id: '3',  // updated
    commandGroup__DebugDescription: 'aaa bbb',  // updated
    financialSchedule__amountWithoutScheduledDate: ensureBigIntScaled(17.9),  // updated
    financialSchedule__scheduledDates: [new Date(2021, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],  // updated
    financialSchedule__scheduledAmounts:[
      ensureBigIntScaled(0.0001),
      ensureBigIntScaled(0.0011),
      ensureBigIntScaled(0.0112),
      ensureBigIntScaled(0.0876)
    ],
    is_Link__SimObjId: '8989',  // ignored
    vsSimObjectName: '776655',  // ignored
    versionId: 1,  // autoincrement
    extras: {a: 9991, b: 'aaax'}  // updated
  });

  const _soDump_Expected = {
    type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
    id: '1',
    dateTime: new Date(2021, 0, 1),
    name: 'BANK ACCOUNT',
    description: 'BANK ACCOUNT DESCRIPTION',
    mutableDescription: 'aaa',
    metadata__Name: [],
    metadata__Value: [],
    metadata__PercentageWeight: [],
    unitId: 'UNITA',
    doubleEntrySide: DoubleEntrySide_enum.BALANCESHEET_CREDIT,
    currency: 'EUR',
    intercompanyInfo__VsUnitId: '',
    value: ensureBigIntScaled(18),
    writingValue: ensureBigIntScaled(16),
    alive: false,
    command__Id: '2',
    command__DebugDescription: 'aaa aaa',
    commandGroup__Id: '3',
    commandGroup__DebugDescription: 'aaa bbb',
    financialSchedule__amountWithoutScheduledDate: ensureBigIntScaled(17.9),
    financialSchedule__scheduledDates: [new Date(2021, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
    financialSchedule__scheduledAmounts:[
      ensureBigIntScaled(0.0001),
      ensureBigIntScaled(0.0011),
      ensureBigIntScaled(0.0112),
      ensureBigIntScaled(0.0876)
    ],
    is_Link__SimObjId: '123',
    vsSimObjectName: '991AAA',
    versionId: 2,
    extras: {a: 9991, b: 'aaax'}
  };

  assert(eqObj(simObjectToDto(_so_With), _soDump_Expected));
});
