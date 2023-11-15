export { simObject_Schema };

import { DoubleEntrySide_enum_validation } from './enums/doubleentryside_enum.js';
import { Currency_enum_validation } from './enums/currency_enum.js';
import * as schema from '../../lib/schema.js';

const simObject_Schema = {
  decimalPlaces: schema.NUMBER_TYPE,  // Decimal places to return numbers with

  type: schema.STRING_TYPE,

  id: schema.STRING_TYPE,

  dateTime: schema.DATE_TYPE,

  name: schema.STRING_TYPE,
  description: schema.STRING_TYPE,  // immutable, is used to generate Reports Detail
  mutableDescription: schema.STRING_TYPE,  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: schema.ARRAY_OF_NUMBERS_TYPE,  // numbers used to split the value filtering metadata name+value; the sum of the applicable weight is used to split the value of the SimObject; if the sum of the weights is > 1 no split will be done (the value can't be greater than the entire value); if the sum of the weights is < 0 the value will be zero.

  unitId: schema.STRING_TYPE,

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: DoubleEntrySide_enum_validation,

  currency: Currency_enum_validation,

  intercompanyInfo__VsUnitId: schema.STRING_TYPE,

  value: schema.BIGINT_NUMBER_TYPE,
  writingValue: schema.BIGINT_NUMBER_TYPE,

  alive: schema.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: schema.STRING_TYPE,
  command__DebugDescription: schema.STRING_TYPE,

  commandGroup__Id: schema.STRING_TYPE,
  commandGroup__DebugDescription: schema.STRING_TYPE,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: schema.BIGINT_NUMBER_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: schema.ARRAY_OF_DATES_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: schema.ARRAY_OF_BIGINT_NUMBER_TYPE,

  is_Link__SimObjId: schema.STRING_TYPE,  // for IS SimObjects, is the id of the BS SimObject that is the counterpart of this IS SimObject
  //#endregion properties common only to some kind of SimObjects

  //#region properties NOT EXPORTED TO JSON DUMP
  vsSimObjectName: schema.STRING_TYPE,  // This is the name of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
  //[REPLACED] //vsSimObjectId: schema.STRING_TYPE,  // REPLACED WITH `vsSimObjectName` because we will can't set in both linked SimObjects the Id of the other, because the other will not exist yet; instead the name can be set in both linked SimObjects
  versionId: schema.NUMBER_TYPE,
  //[REMOVED] //previousVersionId: schema.STRING_TYPE,
  extras: schema.ANY_TYPE + '?',  // Class or an object with all the extra properties specific to the SimObject
  //#endregion properties NOT EXPORTED TO JSON DUMP
};

// NOTES
/*
# vsSimObjectName   #vsSimObjectName_note_20231111
Could be used to extinguish the linked SimObjects when the first is closed.

Is unused for the daily schedule payments, because every SimObject should be managed by itself;
the reason is that we don't know which one of the 2 linked SimObject is already paid for the daily schedule:
if today is not present in the other SimObject - because already paid - what must we do: align the schedule? or ignore
the mismatch? we don't know, then better to leave the management to the SimObject itself.
*/