export { SimObject };

import { validateObj } from '../../lib/validation_utils.js';
import { simObject_Validation } from './validations/simobject_validation.js';
import { Big } from '../../deps.js';

// this is the SimObject stored in Ledger

// TODO SimObject

// numbers and dates
/*
* numbers: stored with big.js http://mikemcl.github.io/big.js/
* store dates in SimObject as local dates, no UTC  // dates can have hour/minutes/seconds if needed, won't be stripped/normalized
*/

// # not exported properties
/*
* extras: property that contain a class or an object with all the extra properties specific to the SimObject
* vsSimObjectId: id of the versus SimObject  // this is the id of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
* versionId
* previousVersionId
* quantity
* unityOfMeasure
*/

class SimObject {
  /**
   * @param {Object} p
   * @param {string} p.type
   * @param {string} p.id
   * @param {Date} p.dateTime
   * @param {string} p.name
   * @param {string} p.description
   * @param {string} p.mutableDescription
   * @param {string[]} p.metadata__Name
   * @param {string[]} p.metadata__Value
   * @param {Big[]} p.metadata__PercentageWeight
   * @param {string} p.unitId
   * @param {string} p.doubleEntrySide
   * @param {string} p.currency
   * @param {string} p.intercompanyInfo__VsUnitId
   * @param {Big} p.value
   * @param {Big} p.writingValue
   * @param {boolean} p.alive
   * @param {string} p.command__Id
   * @param {string} p.command__DebugDescription
   * @param {string} p.commandGroup__Id
   * @param {string} p.commandGroup__DebugDescription
   * @param {Big} p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate
   * @param {Date[]} p.bs_Principal__PrincipalToPay_AmortizationSchedule__Date
   * @param {Big[]} p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
   * @param {string} p.is_Link__SimObjId
   */
  constructor (p) {
    validateObj({ obj: p, validation: simObject_Validation });
    // TODO not implemented
    throw new Error('not implemented');
  }
}
