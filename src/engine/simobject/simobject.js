export { SimObject };

import { simObject_Schema } from './simobject.schema.js';
import { validateObj } from '../../lib/schema_validation_utils.js';

// info
/*
# about numbers and dates
* numbers: stored as BigInt
* date:
  * stored as local dates, without UTC conversion
  * dates can have hour/minutes/seconds if needed, won't be stripped/normalized
  * dates will be converted to UTC when serialized
*/

class SimObject {
  #decimalPlaces;
  #type;
  #id;
  #dateTime;
  #name;
  #description;
  #mutableDescription;
  #metadata__Name;
  #metadata__Value;
  #metadata__PercentageWeight;
  #unitId;
  #doubleEntrySide;
  #currency;
  #intercompanyInfo__VsUnitId;
  #value;
  #writingValue;
  #alive;
  #command__Id;
  #command__DebugDescription;
  #commandGroup__Id;
  #commandGroup__DebugDescription;
  #bs_Principal__PrincipalToPay_IndefiniteExpiryDate;
  #bs_Principal__PrincipalToPay_AmortizationSchedule__Date;
  #bs_Principal__PrincipalToPay_AmortizationSchedule__Principal;
  #is_Link__SimObjId;
  #vsSimObjectName;  // NOT EXPORTED TO JSON DUMP
  #versionId;  // NOT EXPORTED TO JSON DUMP
  #extras;  // NOT EXPORTED TO JSON DUMP

  //#region getters, cloning properties made of mutable objects
  get decimalPlaces () { return this.#decimalPlaces; }

  get type () { return this.#type; }

  get id () { return this.#id; }

  get dateTime () { return this.#dateTime; }

  get name () { return this.#name; }

  get description () { return this.#description; }

  get mutableDescription () { return this.#mutableDescription; }

  get metadata__Name () { return [...this.#metadata__Name]; }

  get metadata__Value () { return [...this.#metadata__Value]; }

  get metadata__PercentageWeight () { return [...this.#metadata__PercentageWeight]; }

  get unitId () { return this.#unitId; }

  get doubleEntrySide () { return this.#doubleEntrySide; }

  get currency () { return this.#currency; }

  get intercompanyInfo__VsUnitId () { return this.#intercompanyInfo__VsUnitId; }

  get value () { return this.#value; }

  get writingValue () { return this.#writingValue; }

  get alive () { return this.#alive; }

  get command__Id () { return this.#command__Id; }

  get command__DebugDescription () { return this.#command__DebugDescription; }

  get commandGroup__Id () { return this.#commandGroup__Id; }

  get commandGroup__DebugDescription () { return this.#commandGroup__DebugDescription; }

  get bs_Principal__PrincipalToPay_IndefiniteExpiryDate () { return this.#bs_Principal__PrincipalToPay_IndefiniteExpiryDate; }

  get bs_Principal__PrincipalToPay_AmortizationSchedule__Date () { return [...this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Date]; }

  get bs_Principal__PrincipalToPay_AmortizationSchedule__Principal () { return [...this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Principal]; }

  get is_Link__SimObjId () { return this.#is_Link__SimObjId; }

  get vsSimObjectName () { return this.#vsSimObjectName; }

  get versionId () { return this.#versionId; }

  get extras () { return this.#StructuredCloneOrClone(this.#extras); }

  //#endregion getters

  /**
   * @param {Object} p
   * @param {number} p.decimalPlaces Decimal places to return numbers with
   * @param {string} p.type
   * @param {string} p.id
   * @param {Date} p.dateTime
   * @param {string} p.name
   * @param {string} p.description
   * @param {string} p.mutableDescription
   * @param {string[]} p.metadata__Name
   * @param {string[]} p.metadata__Value
   * @param {number[]} p.metadata__PercentageWeight
   * @param {string} p.unitId
   * @param {string} p.doubleEntrySide
   * @param {string} p.currency
   * @param {string} p.intercompanyInfo__VsUnitId
   * @param {bigint} p.value
   * @param {bigint} p.writingValue
   * @param {boolean} p.alive
   * @param {string} p.command__Id
   * @param {string} p.command__DebugDescription
   * @param {string} p.commandGroup__Id
   * @param {string} p.commandGroup__DebugDescription
   * @param {bigint} p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate
   * @param {Date[]} p.bs_Principal__PrincipalToPay_AmortizationSchedule__Date
   * @param {bigint[]} p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
   * @param {string} p.is_Link__SimObjId
   * @param {string} p.vsSimObjectName *NOT EXPORTED TO JSON DUMP* This is the name of the SimObject that is the opposite of this one, e.g. a credit is the opposite of a debit
   * @param {number} p.versionId *NOT EXPORTED TO JSON DUMP*
   * @param {*} [p.extras] *NOT EXPORTED TO JSON DUMP* Class or an object with all the extra properties specific to the SimObject
   // properties not implemented, can be included in `extras`
   //quantity: 'number',
   //unityOfMeasure: 'string',
   */
  constructor (p) {
    validateObj({ obj: p, validation: simObject_Schema, strict: true });

    // value must be equal to indefinite + principal
    if (p.value !==
      p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate +
      p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.reduce((a, b) => a + b, 0n))
      throw new Error(`value must be equal to indefinite + principal, got ${p.value} !== ${p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate} + ${p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.reduce((a, b) => a + b, 0n)}`);

    // length of metadata arrays must be equal
    if (p.metadata__Name.length !== p.metadata__Value.length || p.metadata__Name.length !== p.metadata__PercentageWeight.length)
      throw new Error(`length of metadata arrays must be equal, got name = ${p.metadata__Name.length}, value = ${p.metadata__Value.length}, weight= ${p.metadata__PercentageWeight.length}`);

    // check if decimalPlaces is an integer, otherwise raise exception
    if (!Number.isInteger(p.decimalPlaces))
      throw new Error(`decimalPlaces must be an integer, got ${p.decimalPlaces}`);

    // set properties from input
    this.#decimalPlaces = p.decimalPlaces;
    this.#type = p.type;
    this.#id = p.id;
    this.#dateTime = this.#stripTime(p.dateTime);
    this.#name = p.name.toUpperCase().trim();
    this.#description = p.description.toUpperCase().trim();
    this.#mutableDescription = p.mutableDescription;
    this.#metadata__Name = p.metadata__Name.map((name) => name.toUpperCase().trim());
    this.#metadata__Value = p.metadata__Value.map((value) => value.toUpperCase().trim());
    this.#metadata__PercentageWeight = [...p.metadata__PercentageWeight];
    this.#unitId = p.unitId.toUpperCase().trim();
    this.#doubleEntrySide = p.doubleEntrySide;
    this.#currency = p.currency;
    this.#intercompanyInfo__VsUnitId = p.intercompanyInfo__VsUnitId.toUpperCase().trim();
    this.#value = p.value;
    this.#writingValue = p.writingValue;
    this.#alive = p.alive;
    this.#command__Id = p.command__Id;
    this.#command__DebugDescription = p.command__DebugDescription;
    this.#commandGroup__Id = p.commandGroup__Id;
    this.#commandGroup__DebugDescription = p.commandGroup__DebugDescription;
    this.#bs_Principal__PrincipalToPay_IndefiniteExpiryDate = p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate;
    this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Date = p.bs_Principal__PrincipalToPay_AmortizationSchedule__Date.map((date) => this.#stripTime(date));
    this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [...p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal];
    this.#is_Link__SimObjId = p.is_Link__SimObjId;
    this.#vsSimObjectName = p.vsSimObjectName;
    this.#versionId = p.versionId;
    this.#extras = this.#StructuredCloneOrClone(p.extras);
  }

  /**
   * Deep clone of the SimObject
   * @returns {SimObject}
   */
  clone () {
    // don't clone Array and extras, because they are already cloned in the constructor
    return new SimObject({
      decimalPlaces: this.#decimalPlaces,
      type: this.#type,
      id: this.#id,
      dateTime: this.#dateTime,
      name: this.#name,
      description: this.#description,
      mutableDescription: this.#mutableDescription,
      metadata__Name: this.#metadata__Name,
      metadata__Value: this.#metadata__Value,
      metadata__PercentageWeight: this.#metadata__PercentageWeight,
      unitId: this.#unitId,
      doubleEntrySide: this.#doubleEntrySide,
      currency: this.#currency,
      intercompanyInfo__VsUnitId: this.#intercompanyInfo__VsUnitId,
      value: this.#value,
      writingValue: this.#writingValue,
      alive: this.#alive,
      command__Id: this.#command__Id,
      command__DebugDescription: this.#command__DebugDescription,
      commandGroup__Id: this.#commandGroup__Id,
      commandGroup__DebugDescription: this.#commandGroup__DebugDescription,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: this.#bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Date,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      is_Link__SimObjId: this.#is_Link__SimObjId,
      vsSimObjectName: this.#vsSimObjectName,
      versionId: this.#versionId,
      extras: this.#extras,
    });
  }

  /**
   Build a new SimObject using the method properties and filling the missing ones with the current SimObject values.
   Some properties are unavailable in this method, because they are immutable and cannot be changed.
   * @param {Object} [p]
   //param {number} [p.decimalPlaces]
   //param {string} [p.type]
   //param {string} [p.id]
   * @param {Date} [p.dateTime]
   //param {string} [p.name]
   //param {string} [p.description]
   * @param {string} [p.mutableDescription]
   //param {string[]} [p.metadata__Name]
   //param {string[]} [p.metadata__Value]
   //param {number[]} [p.metadata__PercentageWeight]
   //param {string} [p.unitId]
   //param {string} [p.doubleEntrySide]
   //param {string} [p.currency]
   //param {string} [p.intercompanyInfo__VsUnitId]
   * @param {bigint} [p.value]
   * @param {bigint} [p.writingValue]
   * @param {boolean} [p.alive]
   * @param {string} [p.command__Id]
   * @param {string} [p.command__DebugDescription]
   * @param {string} [p.commandGroup__Id]
   * @param {string} [p.commandGroup__DebugDescription]
   * @param {bigint} [p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate]
   * @param {Date[]} [p.bs_Principal__PrincipalToPay_AmortizationSchedule__Date]
   * @param {bigint[]} [p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal]
   //param {string} [p.is_Link__SimObjId]
   //param {string} [p.vsSimObjectName]
   * @param {*} [p.extras]
   * @returns {SimObject}
   */
  with (p) {
    // don't clone Array and extras, because they are already cloned in the constructor
    return new SimObject({
      decimalPlaces: this.#decimalPlaces,
      type: this.#type,
      id: this.#id,
      dateTime: p?.dateTime ?? this.#dateTime,
      name: this.#name,
      description: this.#description,
      mutableDescription: p?.mutableDescription ?? this.#mutableDescription,
      metadata__Name: this.#metadata__Name,
      metadata__Value: this.#metadata__Value,
      metadata__PercentageWeight: this.#metadata__PercentageWeight,
      unitId: this.#unitId,
      doubleEntrySide: this.#doubleEntrySide,
      currency: this.#currency,
      intercompanyInfo__VsUnitId: this.#intercompanyInfo__VsUnitId,
      value: p?.value ?? this.#value,
      writingValue: p?.writingValue ?? this.#writingValue,
      alive: p?.alive ?? this.#alive,
      command__Id: p?.command__Id ?? this.#command__Id,
      command__DebugDescription: p?.command__DebugDescription ?? this.#command__DebugDescription,
      commandGroup__Id: p?.commandGroup__Id ?? this.#commandGroup__Id,
      commandGroup__DebugDescription: p?.commandGroup__DebugDescription ?? this.#commandGroup__DebugDescription,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: p?.bs_Principal__PrincipalToPay_IndefiniteExpiryDate ?? this.#bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: p?.bs_Principal__PrincipalToPay_AmortizationSchedule__Date ?? this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Date,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: p?.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal ?? this.#bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      is_Link__SimObjId: this.#is_Link__SimObjId,
      vsSimObjectName: this.#vsSimObjectName,
      versionId: this.#versionId + 1,
      extras: p?.extras ?? this.#extras,
    });
  }

  //#region private methods
  /**
   * Try to clone the extras object using the clone() method; if the clone method is not defined, try cloning with structuredClone; cloning fails, an exception is raised
   * @param {*} obj
   * @returns {*}
   * @throws {Error} if clone() or structuredClone() fails
   */
  #StructuredCloneOrClone (obj) {
    if (obj?.clone)
      return obj.clone();
    else
      return structuredClone(obj);
  }

  /**
   * Accept a date and return a date with only the year, month and day (stripping the time part)
   *
   * @param {Date} date
   * @returns {Date}
   */
  #stripTime (date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  //#endregion
}
