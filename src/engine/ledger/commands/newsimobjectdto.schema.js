export { newSimObjectDto_Schema };

import * as schema from '../../../lib/schema.js';

/**
 object used to validate NewSimObjectDto
 */
const newSimObjectDto_Schema = {
  type: schema.STRINGUPPERCASETRIMMED_TYPE,

  name: schema.STRINGUPPERCASETRIMMED_TYPE + schema.OPTIONAL,
  description: schema.STRING_TYPE + schema.OPTIONAL,
  mutableDescription: schema.STRING_TYPE + schema.OPTIONAL,

  metadata__Name: schema.ARRAY_OF_STRINGS_TYPE + schema.OPTIONAL,
  metadata__Value: schema.ARRAY_OF_STRINGS_TYPE + schema.OPTIONAL,
  metadata__PercentageWeight: schema.ARRAY_OF_NUMBERS_TYPE + schema.OPTIONAL,

  unitId: schema.STRINGUPPERCASETRIMMED_TYPE,

  currency: schema.STRINGUPPERCASETRIMMED_TYPE,

  intercompanyInfo__VsUnitId: schema.STRINGUPPERCASETRIMMED_TYPE + schema.OPTIONAL,

  value: schema.NUMBER_TYPE,
  writingValue: schema.NUMBER_TYPE,

  alive: schema.BOOLEAN_TYPE,

  //#region command, command group properties
  //command__Id: schema.STRING_TYPE,  // set by Ledger
  command__DebugDescription: schema.STRING_TYPE + schema.OPTIONAL,

  //commandGroup__Id: schema.STRING_TYPE,  // set by Ledger
  commandGroup__DebugDescription: schema.STRING_TYPE + schema.OPTIONAL,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  financialSchedule__amountWithoutScheduledDate: schema.NUMBER_TYPE + schema.OPTIONAL,
  financialSchedule__scheduledDates: schema.ARRAY_OF_DATES_TYPE + schema.OPTIONAL,
  financialSchedule__scheduledAmounts: schema.ARRAY_OF_NUMBERS_TYPE + schema.OPTIONAL,

  is_Link__SimObjId: schema.STRING_TYPE + schema.OPTIONAL,
  //#endregion properties common only to some kind of SimObjects

  vsSimObjectName: schema.STRING_TYPE + schema.OPTIONAL,

  extras: schema.ANY_TYPE + schema.OPTIONAL,
};
