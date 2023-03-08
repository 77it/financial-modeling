export { simObject_Validation };

import { DoubleEntrySide_enum_validation } from '../enums/DoubleEntrySide_enum.js';
import { Currency_enum_validation } from '../enums/currency_enum.js';
import { validation } from '../../../deps.js';

const simObject_Validation = {
  type: validation.STRING_TYPE,

  id: validation.STRING_TYPE,

  dateTime: validation.DATE_TYPE,

  name: validation.STRING_TYPE,
  description: validation.STRING_TYPE,  // immutable, is used to generate Reports Detail
  mutableDescription: validation.STRING_TYPE,  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: validation.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: validation.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: validation.ARRAY_OF_NUMBERS_TYPE,

  unitId: validation.STRING_TYPE,

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: DoubleEntrySide_enum_validation,

  currency: Currency_enum_validation,

  intercompanyInfo__VsUnitId: validation.STRING_TYPE,

  value: validation.BIGJS_NUMBER_TYPE,
  writingValue: validation.BIGJS_NUMBER_TYPE,

  alive: validation.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: validation.STRING_TYPE,
  command__DebugDescription: validation.STRING_TYPE,

  commandGroup__Id: validation.STRING_TYPE,
  commandGroup__DebugDescription: validation.STRING_TYPE,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: validation.BIGJS_NUMBER_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: validation.ARRAY_OF_DATES_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: validation.ARRAY_OF_BIGJS_NUMBER_TYPE,

  is_Link__SimObjId: validation.STRING_TYPE,
  //#endregion properties common only to some kind of SimObjects

  //#region properties not exported to json dump
  vsSimObjectId: validation.STRING_TYPE,
  versionId: validation.NUMBER_TYPE,
  //[REMOVED] //previousVersionId: validation.STRING_TYPE,
  extras: validation.ANY_TYPE + '?',
  //#endregion properties not exported to json dump
};
