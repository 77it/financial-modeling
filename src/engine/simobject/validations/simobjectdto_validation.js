export {simObjectDto_Validation}

import {doubleEntrySide_enum} from '../enums/doubleentryside_enum.js'
import { currency_enum } from '../enums/currency_enum.js';

/**
 object used to validate simObjectDto
*/
const simObjectDto_Validation = {
  type: 'string',

  id: 'string',

  dateTime: 'date',

  name: 'string',
  description: 'string',  // immutable, is used to generate Reports Detail
  mutableDescription: 'string',  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: 'array[string]',
  metadata__Value: 'array[string]',
  metadata__PercentageWeight: 'array[string]',  // converted from array of Big.js

  unitId: 'string',

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: doubleEntrySide_enum,

  currency: currency_enum,

  intercompanyInfo__VsUnitId: 'string',

  value: 'string',  // converted from Big.js
  writingValue: 'string',  // converted from Big.js

  alive: 'boolean',

  //#region command, command group properties
  command__Id: 'string',
  command__DebugDescription: 'string',

  commandGroup__Id: 'string',
  commandGroup__DebugDescription: 'string',
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: 'string',  // converted from Big.js
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: 'array[date]',
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: 'array[string]',  // converted from array of Big.js

  is_Link__SimObjId: 'string'
  //#endregion properties common only to some kind of SimObjects
}
