export { simObject_Schema };

import { DoubleEntrySide_enum_validation } from './enums/doubleentryside_enum.js';
import { Currency_enum_validation } from './enums/currency_enum.js';
import * as schema from '../../lib/schema.js';

const simObject_Schema = {
  decimalPlaces: schema.NUMBER_TYPE,  // Decimal places to return numbers with

  type: schema.STRING_TYPE,

  id: schema.STRING_TYPE,

  dateTime: schema.DATE_TYPE,

  name: schema.STRING_TYPE,  // name, must be unique between ALIVE SimObjects in the same Unit  // C# validation is called `Name__is_unique_between_Alive_SimObjects_in_the_same_Unit()`
  description: schema.STRING_TYPE,  // immutable, is used to generate Reports Detail
  mutableDescription: schema.STRING_TYPE,  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: schema.ARRAY_OF_STRINGS_TYPE,
  // value of a single metadata must be >=0 and <=1
  // see `metadata__PercentageWeight` notes below [1]
  metadata__PercentageWeight: schema.ARRAY_OF_NUMBERS_TYPE,

  unitId: schema.STRING_TYPE,

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: DoubleEntrySide_enum_validation,

  currency: Currency_enum_validation,

  // In a writing Group, IntercompanyInfo can be: inverted, missing on some, equal on all, missing totally.
  // IS NOT ALLOWED the presence of more than two different Units in a writing Group.
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
  financialSchedule__amountWithoutScheduledDate: schema.BIGINT_NUMBER_TYPE,
  financialSchedule__scheduledDates: schema.ARRAY_OF_DATES_TYPE,
  financialSchedule__scheduledAmounts: schema.ARRAY_OF_BIGINT_NUMBER_TYPE,

  is_Link__SimObjId: schema.STRING_TYPE,  // for IS SimObjects, is the id of the BS SimObject that is the counterpart of this IS SimObject
  //#endregion properties common only to some kind of SimObjects

  //#region properties NOT EXPORTED TO JSON DUMP
  // See notes below [2] >vsSimObjectName_note_20231111. This is the name of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
  vsSimObjectName: schema.STRING_TYPE,
  //[REPLACED] //vsSimObjectId: schema.STRING_TYPE,  // REPLACED WITH `vsSimObjectName` because we will can't set in both linked SimObjects the Id of the other, because the other will not exist yet; instead the name can be set in both linked SimObjects
  versionId: schema.NUMBER_TYPE,
  //[REMOVED] //previousVersionId: schema.STRING_TYPE,
  extras: schema.ANY_TYPE + '?',  // Class or an object with all the extra properties specific to the SimObject
  //#endregion properties NOT EXPORTED TO JSON DUMP
};

// NOTES

// [1] `metadata__PercentageWeight` notes
/*
Weight is a number used to split the DTO value.

During validation is enforced that the value of a single metadata is >=0 and <=1.

Reading `ReportsSettings` are summed all the weights of all the metadata name + metadata defined in `ReportsSettings` matching the one defined in the DTO.

Then, the total weight is used to split the value of the SimObject as described below.

If whitelist:
* if total_matching_weight >= 1, no filter applicable, return null
* if total_matching_weight <= 0, filter the whole DTO without returning any unfiltered half
* if total_matching_weight > 0 & < 1, eg 0.7, attribute 70% of the value and filter the 30 % of the value

If blacklist:
* if total_matching_weight >= 1, filter the whole DTO without returning any unfiltered half
* if total_matching_weight <= 0, no filter applicable, return null
* if total_matching_weight > 0 & < 1, eg 0.7, attribute 30% of the value and filter the 70 % of the value
*/

// [2] `vsSimObjectName` notes   #vsSimObjectName_note_20231111
/*
This property must be set with intercompanyInfo__VsUnitId, to define the linked Unit of which is referenced a SimObject by name.

Can be used to align automatically the payment schedule of the linked SimObjects but only if the residual value of the
two SimObject is the same before. See Ledger and NWC notes.

If this property is set in one SimObject A only and is missing from the linked SimObject B
the two SimObjects A & B will still be considered linked and will be treated as if they have an opposite/matching vsSimObjectName & intercompanyInfo__VsUnitId.
Furthermore, B can't define a vsSimObjectName vs C, because this will be a fatal error.
*/

