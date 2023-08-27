export { simObject_Validation };

import { DoubleEntrySide_enum_validation } from '../enums/doubleentryside_enum.js';
import { Currency_enum_validation } from '../enums/currency_enum.js';
import * as validation from '../../../lib/validation_utils.js';

const simObject_Validation = {
  decimalPlaces: validation.NUMBER_TYPE,  // Decimal places to return numbers with

  type: validation.STRING_TYPE,

  id: validation.STRING_TYPE,

  dateTime: validation.DATE_TYPE,

  name: validation.STRING_TYPE,
  description: validation.STRING_TYPE,  // immutable, is used to generate Reports Detail
  mutableDescription: validation.STRING_TYPE,  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: validation.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: validation.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: validation.ARRAY_OF_NUMBERS_TYPE,  // numbers used to split the value filtering metadata name+value; the sum of the applicable weight is used to split the value of the SimObject; if the sum of the weights is > 1 no split will be done (the value can't be greater than the entire value); if the sum of the weights is < 0 the value will be zero.

  unitId: validation.STRING_TYPE,

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: DoubleEntrySide_enum_validation,

  currency: Currency_enum_validation,

  intercompanyInfo__VsUnitId: validation.STRING_TYPE,

  value: validation.BIGINT_NUMBER_TYPE,
  writingValue: validation.BIGINT_NUMBER_TYPE,

  alive: validation.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: validation.STRING_TYPE,
  command__DebugDescription: validation.STRING_TYPE,

  commandGroup__Id: validation.STRING_TYPE,
  commandGroup__DebugDescription: validation.STRING_TYPE,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: validation.BIGINT_NUMBER_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: validation.ARRAY_OF_DATES_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: validation.ARRAY_OF_BIGINT_NUMBER_TYPE,

  is_Link__SimObjId: validation.STRING_TYPE,  // for IS SimObjects, is the id of the BS SimObject that is the counterpart of this IS SimObject
  //#endregion properties common only to some kind of SimObjects

  //#region properties NOT EXPORTED TO JSON DUMP
  //vsSimObjectId: validation.STRING_TYPE,  // This is the id of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
  versionId: validation.NUMBER_TYPE,
  //[REMOVED] //previousVersionId: validation.STRING_TYPE,
  extras: validation.ANY_TYPE + '?',  // Class or an object with all the extra properties specific to the SimObject
  //#endregion properties NOT EXPORTED TO JSON DUMP
};
