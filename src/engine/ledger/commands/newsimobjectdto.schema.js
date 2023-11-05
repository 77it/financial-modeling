export { newSimObjectDto_Schema };

import * as schema from '../../../lib/schema.js';

/**
 object used to validate NewSimObjectDto
 */
const newSimObjectDto_Schema = {
  type: schema.STRINGUPPERCASETRIMMED_TYPE,

  name: schema.STRINGUPPERCASETRIMMED_TYPE,
  description: schema.STRING_TYPE,
  mutableDescription: schema.STRING_TYPE,

  metadata__Name: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: schema.ARRAY_OF_NUMBERS_TYPE,

  unitId: schema.STRINGUPPERCASETRIMMED_TYPE,

  currency: schema.STRINGUPPERCASETRIMMED_TYPE,

  intercompanyInfo__VsUnitId: schema.STRINGUPPERCASETRIMMED_TYPE,

  value: schema.NUMBER_TYPE,
  writingValue: schema.NUMBER_TYPE,

  alive: schema.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: schema.STRING_TYPE,
  command__DebugDescription: schema.STRING_TYPE,

  commandGroup__Id: schema.STRING_TYPE,
  commandGroup__DebugDescription: schema.STRING_TYPE,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: schema.NUMBER_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: schema.ARRAY_OF_DATES_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: schema.ARRAY_OF_NUMBERS_TYPE,

  is_Link__SimObjId: schema.STRING_TYPE,
  //#endregion properties common only to some kind of SimObjects

  //vsSimObjectId: schema.STRING_TYPE,

  extras: schema.ANY_TYPE + '?',
};
