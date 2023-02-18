export { newSimObjectDto_Validation };

import { doubleEntrySide_enum_validation } from '../../simobject/enums/doubleentryside_enum.js';
import { currency_enum_validation } from '../../simobject/enums/currency_enum.js';
import { sanitization } from '../../../deps.js';

/**
 object used to validate simObjectDto
 */
const newSimObjectDto_Validation = {
  type: sanitization.STRING_TYPE,

  name: sanitization.STRING_TYPE + '?',
  description: sanitization.STRING_TYPE + '?',
  mutableDescription: sanitization.STRING_TYPE + '?',

  metadata__Name: sanitization.ARRAY_OF_STRINGS_TYPE + '?',
  metadata__Value: sanitization.ARRAY_OF_STRINGS_TYPE + '?',
  metadata__PercentageWeight: sanitization.ARRAY_OF_NUMBERS_TYPE + '?',

  unitId: sanitization.STRING_TYPE,

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: doubleEntrySide_enum_validation,

  currency: currency_enum_validation,

  intercompanyInfo__VsUnitId: sanitization.STRING_TYPE + '?',

  value: sanitization.NUMBER_TYPE,  // converted from Big.js
  writingValue: sanitization.NUMBER_TYPE,  // converted from Big.js

  alive: sanitization.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: sanitization.STRING_TYPE,
  command__DebugDescription: sanitization.STRING_TYPE + '?',

  commandGroup__Id: sanitization.STRING_TYPE,
  commandGroup__DebugDescription: sanitization.STRING_TYPE + '?',
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: sanitization.NUMBER_TYPE,  // converted from Big.js
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: sanitization.ARRAY_OF_DATES_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: sanitization.ARRAY_OF_NUMBERS_TYPE,  // converted from array of Big.js

  is_Link__SimObjId: sanitization.STRING_TYPE + '?',
  //#endregion properties common only to some kind of SimObjects

  vsSimObjectId: sanitization.STRING_TYPE + '?',

  extras: sanitization.ANY_TYPE + '?',
};
