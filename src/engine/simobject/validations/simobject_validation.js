export { simObject_Validation };

import { doubleEntrySide_enum_validation } from '../enums/doubleentryside_enum.js';
import { currency_enum_validation } from '../enums/currency_enum.js';
import { sanitization } from '../../../deps.js';

const simObject_Validation = {
  type: sanitization.STRING_TYPE,

  id: sanitization.STRING_TYPE,

  dateTime: sanitization.DATE_TYPE,

  name: sanitization.STRING_TYPE,
  description: sanitization.STRING_TYPE,  // immutable, is used to generate Reports Detail
  mutableDescription: sanitization.STRING_TYPE,  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: sanitization.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: sanitization.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: sanitization.ARRAY_OF_NUMBERS_TYPE,

  unitId: sanitization.STRING_TYPE,

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: doubleEntrySide_enum_validation,

  currency: currency_enum_validation,

  intercompanyInfo__VsUnitId: sanitization.STRING_TYPE,

  value: sanitization.BIGJS_NUMBER_TYPE,
  writingValue: sanitization.BIGJS_NUMBER_TYPE,

  alive: sanitization.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: sanitization.STRING_TYPE,
  command__DebugDescription: sanitization.STRING_TYPE,

  commandGroup__Id: sanitization.STRING_TYPE,
  commandGroup__DebugDescription: sanitization.STRING_TYPE,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: sanitization.BIGJS_NUMBER_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: sanitization.ARRAY_OF_DATES_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: sanitization.ARRAY_OF_BIGJS_NUMBER_TYPE,

  is_Link__SimObjId: sanitization.STRING_TYPE,
  //#endregion properties common only to some kind of SimObjects

  //#region properties not exported to json dump
  vsSimObjectId: sanitization.STRING_TYPE,
  versionId: sanitization.NUMBER_TYPE,
  //[REMOVED] //previousVersionId: sanitization.STRING_TYPE,
  extras: sanitization.ANY_TYPE + '?',
  //#endregion properties not exported to json dump
};
