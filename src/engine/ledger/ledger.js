export { Ledger };

import { Big } from '../../deps.js';
import { validate, validation, sanitizeObj } from '../../deps.js';
import { SimObject } from '../simobject/simobject.js';
import { AddSimObjectDto } from './methods_params/addsimobjectdto.js';

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
    const _today = new Date(0);
    this.#today = new Date(_today.getFullYear(), _today.getMonth(), _today.getDate(), 0, 0, 0, 0);
  }

  //#region public methods
  /**
   * Commit the current transaction, if any.
   * @throws {Error} If the transaction is not valid, not squared, etc.
   */
  commit () {
    if (this.#currentTransaction.length === 0) return;
    this.#appendTrnDump(JSON.stringify(this.#currentTransaction));
    this.#currentTransaction = [];  // reset the current transaction

    // TODO validate trn: errore se non quadra;
  }

  /**
   * Add a SimObject to the transaction, keeping it open; if no transaction is currently open, open a new one.
   @param {AddSimObjectDto} addSimObjectDto
   */
  add (addSimObjectDto) {
    sanitizeObj({ obj: addSimObjectDto, sanitization: addSimObjectDto_Validation })

    const simObject = new SimObject({
      type: addSimObjectDto.type,
      id: this.#getNextId().toString(),
      dateTime: this.#today,
      name: addSimObjectDto.name,
      description: addSimObjectDto.description,
      mutableDescription: addSimObjectDto.mutableDescription,
      metadata__Name: [...addSimObjectDto.metadata__Name],
      metadata__Value: [...addSimObjectDto.metadata__Value],
      metadata__PercentageWeight: [...addSimObjectDto.metadata__PercentageWeight],
      unitId: addSimObjectDto.unitId,
      doubleEntrySide: addSimObjectDto.doubleEntrySide,
      currency: addSimObjectDto.currency,
      intercompanyInfo__VsUnitId: addSimObjectDto.intercompanyInfo__VsUnitId,
      value: new Big(addSimObjectDto.value),
      writingValue: new Big(addSimObjectDto.writingValue),
      alive: addSimObjectDto.alive,
      command__Id: this.#getNextCommandId().toString(),
      command__DebugDescription: addSimObjectDto.command__DebugDescription,
      commandGroup__Id: this.#getNextTransactionId().toString(),
      commandGroup__DebugDescription: addSimObjectDto.commandGroup__DebugDescription,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: new Big(addSimObjectDto.bs_Principal__PrincipalToPay_IndefiniteExpiryDate),
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [...addSimObjectDto.bs_Principal__PrincipalToPay_AmortizationSchedule__Date],
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: addSimObjectDto.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.map((number) => new Big(number)),
      is_Link__SimObjId: addSimObjectDto.is_Link__SimObjId,
      vsSimObjectId: addSimObjectDto.vsSimObjectId,
      versionId: 0,
      extras: addSimObjectDto.extras
    });

    this.#currentTransaction.push(simObject);
  }

  /** @returns {boolean} */
  transactionIsOpen () {
    // returns true if #currentTransaction is not empty
    return this.#currentTransaction.length !== 0;
  }

  /** @param {Date} today */
  setToday (today) {
    validate({ value: today, validation: validation.DATE_TYPE });
    this.#today = today;
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