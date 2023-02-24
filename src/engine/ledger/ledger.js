export { Ledger };

import { Big } from '../../deps.js';
import { validate, validation, sanitizeObj } from '../../deps.js';
import { SimObject } from '../simobject/simobject.js';
import { NewSimObjectDto } from './commands/newsimobjectdto.js';
import { newSimObjectDto_Sanitization } from './commands/newsimobjectdto_sanitization.js';
import { NewDebugSimObjectDto } from './commands/newdebugsimobjectdto.js';
import { newDebugSimObjectDto_Sanitization } from './commands/newdebugsimobjectdto_sanitization.js';
import { doubleEntrySide_enum } from '../simobject/enums/doubleentryside_enum.js';
import { currency_enum } from '../simobject/enums/currency_enum.js';
import { ModuleData } from '../modules/module_data.js';

// TODO

// init

// dates: store dates in Ledger as local dates, no UTC

/*
Js Ledger, metodi

extinguish(): accetta un id di un SO BalanceSheet, accoda alle transazioni una scrittura con: importo residuo di un SimObject + alive = false; return void. name from [1] https://www.iasplus.com/en/standards/ifric/ifric19

delta(): accetta un id e un importo delta (eventualmente precisando principal schedule e indefinite, altrimenti tutto su indefinite), crea una scrittura con una variazione del SimObject del delta indicato; restituisce l’oggetto creato, con amount in formato Big.

square(): input SimObjectType/SimObjectName or SimObjectId (es per cash o ammortamenti);
  aggiunge una scrittura di importo giusto per quadrare la transazione; restituisce l’oggetto creato, con amount in formato Big

 */

// SimObjects storage and edits, #queue
/*
Don't provide a queue of future movements, because a SimObject can be changed by other modules.

Store, as a property of the SimObject, an object with custom properties, as the payment plans, the interest, etc.
 */

class Ledger {
  /** @type {appendTrnDump} */
  #appendTrnDump;
  /** Map to store SimObjects: SimObject id as string key, SimObject as value.
   * @type {Map<String, SimObject>} */
  #simObjectsRepo;
  /** @type {SimObject[]} */
  #currentTransaction;
  /** @type {Date} */
  #today;
  /** @type {number} */
  #lastId;
  /** @type {number} */
  #lastCommandId;
  /** @type {number} */
  #lastTransactionId;
  /** @type {boolean} */
  #debug;
  /** @type {null|ModuleData} */
  #currentModuleData;

  /**
   @param {Object} p
   @param {appendTrnDump} p.appendTrnDump Callback to dump the transactions
   */
  constructor ({ appendTrnDump }) {
    this.#appendTrnDump = appendTrnDump;
    this.#simObjectsRepo = new Map();
    this.#currentTransaction = [];
    this.#lastId = 0;
    this.#lastCommandId = 0;
    this.#lastTransactionId = 0;
    this.#today = new Date(0);
    this.#debug = false;
    this.#currentModuleData = null;
  }

  //#region public methods
  /**
   * Set the debug flag to true.
   */
  setDebug () {
    this.#debug = true;
  }

  /** @param {Date} today */
  setToday (today) {
    validate({ value: today, validation: validation.DATE_TYPE });
    this.#today = today;
  }

  /** @param {ModuleData} moduleData */
  setCurrentModuleData (moduleData) {
    this.#currentModuleData = moduleData;
  }

  /** @returns {boolean} */
  transactionIsOpen () {
    // returns true if #currentTransaction is not empty
    return this.#currentTransaction.length !== 0;
  }

  /**
   * BEWARE: this method must be called only by the engine, not by the modules.
   * Commit the current transaction without any validation
   */
  forceCommitWithoutValidation () {
    if (this.#currentTransaction.length === 0) return;
    this.#appendTrnDump(JSON.stringify(this.#currentTransaction));
    this.#currentTransaction = [];  // reset the current transaction
  }

  /**
   * Commit the current transaction, if any.
   * @throws {Error} If the transaction is not valid, not squared, etc.
   */
  commit () {
    if (this.#currentTransaction.length === 0) return;
    this.#appendTrnDump(JSON.stringify(this.#currentTransaction));
    this.#currentTransaction = [];  // reset the current transaction

    // TODO validate trn: errore se non quadra transazione/unit, se il tipo non è un tipo riconosciuto, etc;
  }

  /** @returns {string} */
  getDebugModuleInfo () {
    return `moduleName: '${this.#currentModuleData?.moduleName}', moduleEngineURI: '${this.#currentModuleData?.moduleEngineURI}', moduleSourceLocation: '${this.#currentModuleData?.moduleSourceLocation}'`;
  }

  /**
   * Add a SimObject to the transaction, keeping it open
   @param {NewSimObjectDto} newSimObjectDto
   */
  newSimObject (newSimObjectDto) {
    sanitizeObj({ obj: newSimObjectDto, sanitization: newSimObjectDto_Sanitization });

    const debug_moduleInfo = (this.#debug) ? this.getDebugModuleInfo() : '';

    const simObject = new SimObject({
      type: newSimObjectDto.type,
      id: this.#getNextId().toString(),
      dateTime: this.#today,
      name: newSimObjectDto.name ?? '',
      description: newSimObjectDto.description ?? '',
      mutableDescription: newSimObjectDto.mutableDescription ?? '',
      metadata__Name: (newSimObjectDto.metadata__Name) ? [...newSimObjectDto.metadata__Name] : [],
      metadata__Value: (newSimObjectDto.metadata__Value) ? [...newSimObjectDto.metadata__Value] : [],
      metadata__PercentageWeight: (newSimObjectDto.metadata__PercentageWeight) ? [...newSimObjectDto.metadata__PercentageWeight] : [],
      unitId: newSimObjectDto.unitId,
      doubleEntrySide: newSimObjectDto.doubleEntrySide,
      currency: newSimObjectDto.currency,
      intercompanyInfo__VsUnitId: newSimObjectDto.intercompanyInfo__VsUnitId ?? '',
      value: new Big(newSimObjectDto.value),
      writingValue: new Big(newSimObjectDto.value),
      alive: newSimObjectDto.alive,
      command__Id: this.#getNextCommandId().toString(),
      command__DebugDescription: newSimObjectDto.command__DebugDescription ?? '',
      commandGroup__Id: this.#getNextTransactionId().toString(),
      commandGroup__DebugDescription: newSimObjectDto.commandGroup__DebugDescription ?? debug_moduleInfo,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: new Big(newSimObjectDto.bs_Principal__PrincipalToPay_IndefiniteExpiryDate),
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [...newSimObjectDto.bs_Principal__PrincipalToPay_AmortizationSchedule__Date],
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: newSimObjectDto.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.map((number) => new Big(number)),
      is_Link__SimObjId: newSimObjectDto.is_Link__SimObjId ?? '',
      vsSimObjectId: newSimObjectDto.vsSimObjectId ?? '',
      versionId: 0,
      extras: newSimObjectDto.extras
    });

    this.#currentTransaction.push(simObject);
  }

  /**
   * Add a Debug SimObject to the transaction, keeping it open
   @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugSimObject (newDebugSimObjectDto) {
    sanitizeObj({ obj: newDebugSimObjectDto, sanitization: newDebugSimObjectDto_Sanitization });

    const debug_moduleInfo = this.getDebugModuleInfo();

    const simObject = new SimObject({
      type: newDebugSimObjectDto.type,
      id: this.#getNextId().toString(),
      dateTime: this.#today,
      name: '',
      description: newDebugSimObjectDto.description,
      mutableDescription: '',
      metadata__Name: [],
      metadata__Value: [],
      metadata__PercentageWeight: [],
      unitId: '',
      doubleEntrySide: doubleEntrySide_enum.DEBUG,
      currency: currency_enum.UNDEFINED,
      intercompanyInfo__VsUnitId: '',
      value: new Big(0),
      writingValue: new Big(0),
      alive: false,
      command__Id: this.#getNextCommandId().toString(),
      command__DebugDescription: newDebugSimObjectDto.command__DebugDescription ?? '',
      commandGroup__Id: this.#getNextTransactionId().toString(),
      commandGroup__DebugDescription: newDebugSimObjectDto.commandGroup__DebugDescription ?? debug_moduleInfo,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: new Big(0),
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [],
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [],
      is_Link__SimObjId: '',
      vsSimObjectId: '',
      versionId: 0,
      extras: null
    });

    this.#currentTransaction.push(simObject);
  }

  //#endregion public methods

  //#region private methods
  //* @returns {number} */
  #getNextId () {
    return ++this.#lastId;
  }

  /** @returns {number} */
  #getNextCommandId () {
    return ++this.#lastCommandId;
  }

  /** @returns {number} */
  #getNextTransactionId () {
    // if #currentTransaction is empty, increment #lastTransactionId
    if (!this.transactionIsOpen())
      this.#lastTransactionId++;
    return this.#lastTransactionId;
  }

  //#endregion private methods
}

//#region types definitions

/**
 * Callback to dump the transactions
 *
 * @callback appendTrnDump
 * @param {string} dump - The transactions dump
 */

//#endregion types definitions