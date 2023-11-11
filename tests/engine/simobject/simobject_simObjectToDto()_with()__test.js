import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { SimObject } from '../../../src/engine/simobject/simobject.js';
import { simObjectToDto, toBigInt } from '../../../src/engine/simobject/utils/simobject_utils.js';
import { SimObjectTypes_enum } from '../../../src/engine/simobject/enums/simobject_types_enum.js';
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
  is_Link__SimObjId: '123',
  //vsSimObjectId: '991',
  versionId: 1
});

const _so2_withExtras = new SimObject({
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
  is_Link__SimObjId: '123',
  //vsSimObjectId: '991',
  versionId: 1,
  extras: {a: 999, b: 'aaa'}
});

Deno.test('SimObject.simObjectToDto() & .with() without value tests', async () => {
  const _so_With = _so.with();
  const _so_With2_withExtras = _so2_withExtras.with({});

  const _soDump_Expected = {
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
    value: 19,
    writingValue: 19,
    alive: true,
    command__Id: '1',
    command__DebugDescription: '',
    commandGroup__Id: '1',
    commandGroup__DebugDescription: '',
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: 18.9,
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [0.0001, 0.0011, 0.0111, 0.0877],
    is_Link__SimObjId: '123',
    //vsSimObjectId: '991',
    versionId: 2
  };

  const _soDump_Expected2_withExtras = {
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
    value: 19,
    writingValue: 19,
    alive: true,
    command__Id: '1',
    command__DebugDescription: '',
    commandGroup__Id: '1',
    commandGroup__DebugDescription: '',
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: 18.9,
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [0.0001, 0.0011, 0.0111, 0.0877],
    is_Link__SimObjId: '123',
    //vsSimObjectId: '991',
    versionId: 2,
    extras: {a: 999, b: 'aaa'}
  };

  assertEquals(_so_With.decimalPlaces, 4);

  let _error = '';

  // save the DTO of the original object, that should be frozen
  const _so_With_Dto = simObjectToDto(_so_With);

  // try to change the value of the DTO, but the changes will go in error, because the DTO is frozen
  try {_so_With_Dto.type = 'abcd';}
  catch (e) {_error = e.message;}
  assertEquals(_error, "Cannot assign to read only property 'type' of object '#<SimObjectDto>'");
  try {
    //@ts-ignore
    _so_With_Dto.newField = 44;}
  catch (e) {_error = e.message;}
  assertEquals(_error, "Cannot add property newField, object is not extensible");

  assertEquals(JSON.stringify(_so_With_Dto), JSON.stringify(_soDump_Expected));

  assertEquals(JSON.stringify(simObjectToDto(_so_With2_withExtras)), JSON.stringify(_soDump_Expected2_withExtras));
});

Deno.test('SimObject.simObjectToDto() & .with() tests', async () => {
  const _so_With = _so2_withExtras.with({
    //@ts-ignore
    decimalPlaces: 44,  // ignored
    type: SimObjectTypes_enum.BS_CREDIT__ACCRUALSCREDITS,  // ignored
    id: '999', // ignored
    dateTime: new Date(2021, 0, 1),  // updated
    name: '!!!Bank account???',  // ignored
    description: '!!!Bank account description???',  // ignored
    mutableDescription: 'xxx',  // updated
    metadata__Name: ['a'],  // ignored
    metadata__Value: ['b'],  // ignored
    metadata__PercentageWeight: [9],  // ignored
    unitId: '!!!UnitA???',  // ignored
    doubleEntrySide: DoubleEntrySide_enum.INCOMESTATEMENT_DEBIT,  // ignored
    currency: '???EUR!!!',  // ignored
    intercompanyInfo__VsUnitId: 'ABCD',  // ignored
    value: toBigInt(18, decimalPlaces, roundingModeIsRound),  // updated
    writingValue: toBigInt(16, decimalPlaces, roundingModeIsRound),  // updated
    alive: false,  // updated
    command__Id: '2',  // updated
    command__DebugDescription: 'xxx aaa',  // updated
    commandGroup__Id: '3',  // updated
    commandGroup__DebugDescription: 'xxx bbb',  // updated
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: toBigInt(17.9, decimalPlaces, roundingModeIsRound),  // updated
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [new Date(2021, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],  // updated
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [1n, 11n, 112n, 876n],  // updated
    is_Link__SimObjId: '8989',  // ignored
    //vsSimObjectId: '776655',
    versionId: 1,  // autoincrement
    extras: {a: 9991, b: 'aaax'}  // updated
  });

  const _soDump_Expected = {
    type: SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT,
    id: '1',
    dateTime: new Date(2021, 0, 1),
    name: 'Bank account',
    description: 'Bank account description',
    mutableDescription: 'xxx',
    metadata__Name: [],
    metadata__Value: [],
    metadata__PercentageWeight: [],
    unitId: 'UnitA',
    doubleEntrySide: DoubleEntrySide_enum.BALANCESHEET_CREDIT,
    currency: 'EUR',
    intercompanyInfo__VsUnitId: '',
    value: 18,
    writingValue: 16,
    alive: false,
    command__Id: '2',
    command__DebugDescription: 'xxx aaa',
    commandGroup__Id: '3',
    commandGroup__DebugDescription: 'xxx bbb',
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: 17.9,
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [new Date(2021, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1), new Date(2020, 0, 1)],
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [0.0001, 0.0011, 0.0112, 0.0876],
    is_Link__SimObjId: '123',
    //vsSimObjectId: '991',
    versionId: 2,
    extras: {a: 9991, b: 'aaax'}
  };

  assertEquals(JSON.stringify(simObjectToDto(_so_With)), JSON.stringify(_soDump_Expected));
});
