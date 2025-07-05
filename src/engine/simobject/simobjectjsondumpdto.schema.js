export { simObjectJsonDumpDto_Schema };

import { DoubleEntrySide_enum_validation } from './enums/doubleentryside_enum.js';
import { Currency_enum_validation } from './enums/currency_enum.js';
import * as schema from '../../lib/schema.js';

/**
 object used to validate simObjectDto
 */
const simObjectJsonDumpDto_Schema = {
  type: schema.STRING_TYPE,

  id: schema.STRING_TYPE,

  dateTime: schema.STRING_TYPE,

  name: schema.STRING_TYPE,
  description: schema.STRING_TYPE,  // immutable, is used to generate Reports Detail
  mutableDescription: schema.STRING_TYPE,  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__Value: schema.ARRAY_OF_STRINGS_TYPE,
  metadata__PercentageWeight: schema.ARRAY_OF_NUMBERS_TYPE,

  unitId: schema.STRING_TYPE,

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: DoubleEntrySide_enum_validation,

  currency: Currency_enum_validation,

  intercompanyInfo__VsUnitId: schema.STRING_TYPE,

  value: schema.STRING_TYPE,  // converted from BigInt
  writingValue: schema.STRING_TYPE,  // converted from BigInt

  alive: schema.BOOLEAN_TYPE,

  //#region command, command group properties
  command__Id: schema.STRING_TYPE,
  command__DebugDescription: schema.STRING_TYPE,

  commandGroup__Id: schema.STRING_TYPE,
  commandGroup__DebugDescription: schema.STRING_TYPE,
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects

  //#region properties coming from `financialSchedule__*`
  // see file 'src\engine\simobject\utils\simobject_to_json_dump_dto.js' for the logic of the properties building

  // properties for SimObjects contained in the set `SimObjectTypes_WithPrincipal_set`
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: schema.STRING_TYPE,  // converted from BigInt
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: schema.ARRAY_OF_STRINGS_TYPE,
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: schema.ARRAY_OF_STRINGS_TYPE,  // converted from array of BigInt

  // properties for the other SimObjects that had `financialSchedule__*` properties not being in the set `SimObjectTypes_WithPrincipal_set`
  financialSchedule__amountWithoutScheduledDate: schema.STRING_TYPE,  // converted from BigInt
  financialSchedule__scheduledDates: schema.ARRAY_OF_STRINGS_TYPE,
  financialSchedule__scheduledAmounts: schema.ARRAY_OF_STRINGS_TYPE,  // converted from array of BigInt
  //#endregion region properties coming from `financialSchedule__*`

  is_Link__SimObjId: schema.STRING_TYPE,
  //#endregion properties common only to some kind of SimObjects
};
