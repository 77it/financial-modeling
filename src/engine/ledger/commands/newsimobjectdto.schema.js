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
  // to see why we use ARRAY_OF_NUMBERS_TYPE here, see notes `metadata__PercentageWeight` notes in src/engine/simobject/simobject.schema.js
  metadata__PercentageWeight: schema.ARRAY_OF_NUMBERS_TYPE + schema.OPTIONAL,

  unitId: schema.STRINGUPPERCASETRIMMED_TYPE,

  currency: schema.STRINGUPPERCASETRIMMED_TYPE,

  intercompanyInfo__VsUnitId: schema.STRINGUPPERCASETRIMMED_TYPE + schema.OPTIONAL,

  value: schema.ANY_TYPE,  // can be {string|number|bigint} that will be converted to Decimal Scaled BigInt during SimObject creation, then we skip validation here
  writingValue: schema.NUMBER_TYPE,

  alive: schema.BOOLEAN_TYPE,

  //#region command, command group properties
  //command__Id: schema.STRING_TYPE,  // set by Ledger
  command__DebugDescription: schema.STRING_TYPE + schema.OPTIONAL,

  //commandGroup__Id: schema.STRING_TYPE,  // set by Ledger
  commandGroup__DebugDescription: schema.STRING_TYPE + schema.OPTIONAL,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  financialSchedule__amountWithoutScheduledDate: schema.ANY_TYPE + schema.OPTIONAL,  // can be {string|number|bigint} that will be converted to Decimal Scaled BigInt during SimObject creation, then we skip validation here
  financialSchedule__scheduledDates: schema.ARRAY_OF_DATES_TYPE + schema.OPTIONAL,
  financialSchedule__scheduledAmounts: schema.ARRAY_TYPE + schema.OPTIONAL,  // can be {string[]|number[]|bigint[]} that will be converted to Decimal Scaled BigInt during SimObject creation, then we skip validation here

  is_Link__SimObjId: schema.STRING_TYPE + schema.OPTIONAL,
  //#endregion properties common only to some kind of SimObjects

  vsSimObjectName: schema.STRING_TYPE + schema.OPTIONAL,

  extras: schema.ANY_TYPE + schema.OPTIONAL,
};
