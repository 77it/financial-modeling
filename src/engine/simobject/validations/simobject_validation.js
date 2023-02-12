export {simObject_Validation}

import {doubleEntrySide_enum} from '../enums/doubleentryside_enum.js'
import { currency_enum } from '../enums/currency_enum.js';

const simObject_Validation = {
  type: 'string',

  id: 'string',

  dateTime: 'date',

  name: 'string',
  description: 'string',  // immutable, is used to generate Reports Detail
  mutableDescription: 'string',  // unused during Reports generation, can be used for debug purpose (and in the future to be shown to the user during a Drill Down of reports voices)

  metadata__Name: 'array[string]',
  metadata__Value: 'array[string]',
  metadata__PercentageWeight: 'array[big_js_number]',

  unitId: 'string',

  // the values are always positive, also debts and costs, then this is the sign/side (debit/credit, left/right) and the type (BS/IS) of the voice
  doubleEntrySide: doubleEntrySide_enum,

  currency: currency_enum,

  intercompanyInfo__VsUnitId: 'string',

  value: 'big_js_number',
  writingValue: 'big_js_number',

  alive: 'boolean',

  //#region command, command group properties
  command__Id: 'string',
  command__DebugDescription: 'string',

  commandGroup__Id: 'string',
  commandGroup__DebugDescription: 'string',
  //#endregion command, command group properties

  //#region properties common only to some kind of SimObjects
  bs_Principal__PrincipalToPay_IndefiniteExpiryDate: 'big_js_number',
  bs_Principal__PrincipalToPay_AmortizationSchedule__Date: 'array[date]',
  bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: 'array[big_js_number]',

  is_Link__SimObjId: 'string',
  //#endregion properties common only to some kind of SimObjects

  //#region properties not exported to json dump
  vsSimObjectId: 'string',
  versionId: 'string',
  previousVersionId: 'string',
  extras: 'any',
  //#endregion properties not exported to json dump
}
