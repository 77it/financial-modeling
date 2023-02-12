export { SimObject };

import { validateObj } from '../../lib/validation_utils.js';
import { simObject_Validation } from './validations/simobject_validation.js';
import { Big } from '../../deps.js';
import { SimObjectDto } from './simobjectdto.js';
import { SimObjectJsonDumpDto } from './simobjectjsondumpdto.js';

// info
/*
# about numbers and dates
* numbers: stored with big.js http://mikemcl.github.io/big.js/
* store dates in SimObject as local dates, no UTC  // dates can have hour/minutes/seconds if needed, won't be stripped/normalized
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
   * @param {string} p.vsSimObjectId [NOT EXPORTED TO JSON DUMP] This is the id of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
   * @param {string} p.versionId [NOT EXPORTED TO JSON DUMP]
   * @param {*} p.extras [NOT EXPORTED TO JSON DUMP] Class or an object with all the extra properties specific to the SimObject
   // properties not implemented, can be included in `extras`
   //quantity: 'number',
   //unityOfMeasure: 'string',
   */
  constructor (p) {
    validateObj({ obj: p, validation: simObject_Validation });

    this.type = p.type;
    this.id = p.id;
    this.dateTime = p.dateTime;
    this.name = p.name;
    this.description = p.description;
    this.mutableDescription = p.mutableDescription;
    this.metadata__Name = p.metadata__Name;
    this.metadata__Value = p.metadata__Value;
    this.metadata__PercentageWeight = p.metadata__PercentageWeight;
    this.unitId = p.unitId;
    this.doubleEntrySide = p.doubleEntrySide;
    this.currency = p.currency;
    this.intercompanyInfo__VsUnitId = p.intercompanyInfo__VsUnitId;
    this.value = p.value;
    this.writingValue = p.writingValue;
    this.alive = p.alive;
    this.command__Id = p.command__Id;
    this.command__DebugDescription = p.command__DebugDescription;
    this.commandGroup__Id = p.commandGroup__Id;
    this.commandGroup__DebugDescription = p.commandGroup__DebugDescription;
    this.bs_Principal__PrincipalToPay_IndefiniteExpiryDate = p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate;
    this.bs_Principal__PrincipalToPay_AmortizationSchedule__Date = p.bs_Principal__PrincipalToPay_AmortizationSchedule__Date;
    this.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal;
    this.is_Link__SimObjId = p.is_Link__SimObjId;
    // NOT EXPORTED TO JSON DUMP
    this.vsSimObjectId = p.vsSimObjectId;
    this.versionId = p.versionId;
    this.extras = p.extras;
  }

  /**
   * Deep clone of the SimObject
   * @returns {SimObject}
   */
  clone() {
    return new SimObject({
      type: this.type,
      id: this.id,
      dateTime: this.dateTime,
      name: this.name,
      description: this.description,
      mutableDescription: this.mutableDescription,
      metadata__Name: [...this.metadata__Name],
      metadata__Value: [...this.metadata__Value],
      metadata__PercentageWeight: [...this.metadata__PercentageWeight],
      unitId: this.unitId,
      doubleEntrySide: this.doubleEntrySide,
      currency: this.currency,
      intercompanyInfo__VsUnitId: this.intercompanyInfo__VsUnitId,
      value: this.value,
      writingValue: this.writingValue,
      alive: this.alive,
      command__Id: this.command__Id,
      command__DebugDescription: this.command__DebugDescription,
      commandGroup__Id: this.commandGroup__Id,
      commandGroup__DebugDescription: this.commandGroup__DebugDescription,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: this.bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [...this.bs_Principal__PrincipalToPay_AmortizationSchedule__Date],
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [...this.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal],
      is_Link__SimObjId: this.is_Link__SimObjId,
      vsSimObjectId: this.vsSimObjectId,
      versionId: this.versionId,
      extras: this.extras,
    });
  }

  /**
   * Convert the SimObject to a SimObjectDto
   * @returns {SimObjectDto}
   */
  toDto() {
    return new SimObjectDto({
      type: this.type,
      id: this.id,
      dateTime: this.dateTime,
      name: this.name,
      description: this.description,
      mutableDescription: this.mutableDescription,
      metadata__Name: [...this.metadata__Name],
      metadata__Value: [...this.metadata__Value],
      metadata__PercentageWeight: this.metadata__PercentageWeight.map((big) => big.toNumber()),
      unitId: this.unitId,
      doubleEntrySide: this.doubleEntrySide,
      currency: this.currency,
      intercompanyInfo__VsUnitId: this.intercompanyInfo__VsUnitId,
      value: this.value.toNumber(),
      writingValue: this.writingValue.toNumber(),
      alive: this.alive,
      command__Id: this.command__Id,
      command__DebugDescription: this.command__DebugDescription,
      commandGroup__Id: this.commandGroup__Id,
      commandGroup__DebugDescription: this.commandGroup__DebugDescription,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: this.bs_Principal__PrincipalToPay_IndefiniteExpiryDate.toNumber(),
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [...this.bs_Principal__PrincipalToPay_AmortizationSchedule__Date],
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: this.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.map((big) => big.toNumber()),
      is_Link__SimObjId: this.is_Link__SimObjId,
      vsSimObjectId: this.vsSimObjectId,
      versionId: this.versionId,
      extras: this.extras,
    });
  }

  /**
   * Convert the SimObject to a SimObjectJsonDumpDto
   * @returns {SimObjectJsonDumpDto}
   */
  toJsonDumpDto() {
    return new SimObjectJsonDumpDto({
      type: this.type,
      id: this.id,
      dateTime: this.dateTime,
      name: this.name,
      description: this.description,
      mutableDescription: this.mutableDescription,
      metadata__Name: [...this.metadata__Name],
      metadata__Value: [...this.metadata__Value],
      metadata__PercentageWeight: this.metadata__PercentageWeight.map((big) => big.toNumber()),
      unitId: this.unitId,
      doubleEntrySide: this.doubleEntrySide,
      currency: this.currency,
      intercompanyInfo__VsUnitId: this.intercompanyInfo__VsUnitId,
      value: this.value.toNumber(),
      writingValue: this.writingValue.toNumber(),
      alive: this.alive,
      command__Id: this.command__Id,
      command__DebugDescription: this.command__DebugDescription,
      commandGroup__Id: this.commandGroup__Id,
      commandGroup__DebugDescription: this.commandGroup__DebugDescription,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: this.bs_Principal__PrincipalToPay_IndefiniteExpiryDate.toNumber(),
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [...this.bs_Principal__PrincipalToPay_AmortizationSchedule__Date],
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: this.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.map((big) => big.toNumber()),
      is_Link__SimObjId: this.is_Link__SimObjId,
    });
  }
}
