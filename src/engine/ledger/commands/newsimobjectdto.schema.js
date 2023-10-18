export { newSimObjectDto_Schema };

import { DoubleEntrySide_enum_validation } from '../../simobject/enums/doubleentryside_enum.js';
import { Currency_enum_validation } from '../../simobject/enums/currency_enum.js';
import * as sanitization from '../../../lib/sanitization_utils.js';

/**
 object used to validate NewSimObjectDto
 */
const newSimObjectDto_Schema = {
  type: sanitization.STRINGUPPERCASETRIMMED_TYPE,

  name: sanitization.STRINGLOWERCASETRIMMED_TYPE,
  description: sanitization.STRING_TYPE,
  mutableDescription: sanitization.STRING_TYPE,

  metadata__Name: sanitization.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: sanitization.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: sanitization.ARRAY_OF_NUMBERS_TYPE,

  unitId: sanitization.STRING_TYPE,

  currency: sanitization.STRINGUPPERCASETRIMMED_TYPE,

  intercompanyInfo__VsUnitId: sanitization.STRING_TYPE,

  value: sanitization.NUMBER_TYPE,
  writingValue: sanitization.NUMBER_TYPE,

  alive: sanitization.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: sanitization.STRING_TYPE,
  command__DebugDescription: sanitization.STRING_TYPE,

  commandGroup__Id: sanitization.STRING_TYPE,
  commandGroup__DebugDescription: sanitization.STRING_TYPE,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: sanitization.NUMBER_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: sanitization.ARRAY_OF_DATES_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: sanitization.ARRAY_OF_NUMBERS_TYPE,

  is_Link__SimObjId: sanitization.STRING_TYPE,
  //#endregion properties common only to some kind of SimObjects

  //vsSimObjectId: sanitization.STRING_TYPE,

  extras: sanitization.ANY_TYPE + '?',
};
