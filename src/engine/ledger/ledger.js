export { Ledger };

import * as schema from '../../lib/schema.js';
import { sanitize } from '../../lib/schema_sanitization_utils.js';
import { validate, validateObj } from '../../lib/schema_validation_utils.js';
import { isNullOrWhiteSpace } from '../../lib/string_utils.js';

import { SimObject } from '../simobject/simobject.js';
import { simObjectToDto, simObjectToJsonDumpDto, splitPrincipal, toBigInt } from '../simobject/utils/simobject_utils.js';
import { doubleEntrySideFromSimObjectType } from '../simobject/enums/doubleentryside_enum.js';
import { SimObjectTypes_enum } from '../simobject/enums/simobject_types_enum.js';
import { SimObjectDebugTypes_enum, SimObjectDebugTypes_enum_validation } from '../simobject/enums/simobject_debugtypes_enum.js';
import { SimObjectErrorDebugTypes_enum, SimObjectErrorDebugTypes_enum_validation } from '../simobject/enums/simobject_errordebugtypes_enum.js';
import { DoubleEntrySide_enum } from '../simobject/enums/doubleentryside_enum.js';
import { Currency_enum } from '../simobject/enums/currency_enum.js';

import { NewSimObjectDto } from './commands/newsimobjectdto.js';
import { newSimObjectDto_Schema } from './commands/newsimobjectdto.schema.js';
import { NewDebugSimObjectDto } from './commands/newdebugsimobjectdto.js';
import { newDebugSimObjectDto_Schema } from './commands/newdebugsimobjectdto.schema.js';

// TODO

// init

// dates: store dates in Ledger as local dates, without UTC conversion, trimmed to date only (no time)

/*
Js Ledger, metodi

extinguish(): accetta un id di un SO BalanceSheet, accoda alle transazioni una scrittura con: importo residuo di un SimObject + alive = false; return void. name from [1] https://www.iasplus.com/en/standards/ifric/ifric19

delta(): accetta un id e un importo delta (eventualmente precisando principal schedule e indefinite, altrimenti tutto su indefinite), crea una scrittura con una variazione del SimObject del delta indicato; restituisce l’oggetto creato, con amount in formato number.

deltaName(SimObjectType, SimObjectName, amount): se c'è un SimObject con nome+tipo corrispondente, lo modifica con delta(amount), altrimenti lo crea con amount(amount)

square(Unit), return number: restituisce il valore della squadratura di un unità, ovvero la somma degli importi dei SO di tipo BalanceSheet e di tipo IncomeStatement che hanno come unità quella indicata. Se l’unità di conto non esiste, restituisce 0.

 */

// SimObjects storage and edits, #queue
/*
Don't provide way to store a queue of future movements, because a SimObject can be changed by other modules.

Store, as a property of the SimObject, an object with custom properties, as the payment plans, the interest, etc.
 */

class Ledger {
  /** @type {appendTrnDump} */
  #appendTrnDump;
  /** Map to store SimObjects: SimObject id as string key, SimObject as value.
   * @type {Map<string, SimObject>} */
  #simObjectsRepo;
  /** Map to store SimObjectTypes_enum object
   * @type {Map<string, string>} */
  #simObjectTypes_enum_map;
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
  /** @type {string} */
  #currentDebugModuleInfo;
  /** @type {number} */
  #decimalPlaces;
  /** @type {boolean} */
  #roundingModeIsRound;
  /** @type {boolean} */
  #isLocked;

  /**
   * @param {Object} p
   * @param {appendTrnDump} p.appendTrnDump Callback to dump the transactions
   * @param {number} p.decimalPlaces Decimal places to use when storing numbers in the ledger
   * @param {boolean} p.roundingModeIsRound Rounding mode to use when storing numbers in the ledger; if true, use Math.round(), otherwise use Math.floor()
   */
  constructor ({ appendTrnDump, decimalPlaces, roundingModeIsRound }) {
    const _p = sanitize({
      value: { decimalPlaces, roundingModeIsRound },
      sanitization: { decimalPlaces: schema.NUMBER_TYPE, roundingModeIsRound: schema.BOOLEAN_TYPE }
    });

    // check if decimalPlaces is an integer, otherwise raise exception
    if (!Number.isInteger(_p.decimalPlaces))
      throw new Error(`decimalPlaces must be an integer, got ${_p.decimalPlaces}`);

    this.#appendTrnDump = appendTrnDump;
    this.#simObjectsRepo = new Map();
    this.#simObjectTypes_enum_map = new Map(Object.entries(SimObjectTypes_enum));
    this.#currentTransaction = [];
    this.#lastId = 0;
    this.#lastCommandId = 0;
    this.#lastTransactionId = 0;
    this.#today = new Date(0);
    this.#debug = false;
    this.#currentDebugModuleInfo = '';
    this.#decimalPlaces = _p.decimalPlaces;
    this.#roundingModeIsRound = _p.roundingModeIsRound;
    this.#isLocked = true;  // lock the ledger
  }

  //#region SET methods
  /** Set the debug module info, used when debug mode is on.
   * @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitize({ value: debugModuleInfo, sanitization: schema.STRING_TYPE });
  }

  /**
   * Set the debug flag to true.
   */
  setDebug () {
    this.#debug = true;
  }

  /** @param {Date} today */
  setToday (today) {
    validate({ value: today, validation: schema.DATE_TYPE });
    this.#today = today;
  }

  /** Lock the ledger, so that no transaction can be added. */
  lock () {
    this.#isLocked = true;
  }

  /** Unlock the ledger, so that transactions can be added. */
  unlock () {
    this.#isLocked = false;
  }

  //#endregion SET methods

  //#region GET/QUERY methods
  /** @returns {string} */
  getDebugModuleInfo () {
    return this.#currentDebugModuleInfo;
  }

  /** @returns {boolean} */
  transactionIsOpen () {
    // returns true if #currentTransaction is not empty
    return this.#currentTransaction.length !== 0;
  }

  /** @returns {boolean} */
  isLocked () {
    return this.#isLocked;
  }

  /**
   * @param {Object} p
   * @param {string} [p.type] - SimObject type. If missing, retrieve all, if present retrieve only the specified type.
   * @returns {SimObject[]} */
  getAliveBsSimObjectsWithExpiredPrincipalToManage ({ type }) {
    // TODO return a list of SO
    // * alive BS SimObjects
    // * with principal to pay (date of a payment is <= today)
    // * for all Units
    // all SO are cloned before being returned
    //@ts-ignore
    return null;
  }

  /**
   * @param {Object} p
   * @param {string} [p.id] - SimObject Id
   * @returns {SimObject | undefined} */
  getSimObjectById ({ id }) {
    // TODO return SO by id
    // * throw if Id is not string with a value
    // * return undefined if not found
    // SO is cloned before being returned
    //@ts-ignore
    return null;
  }

  /**
   * @param {Object} p
   * @param {string} [p.name] - SimObject Name
   * @param {string} [p.unit] - SimObject Unit
   * @returns {SimObject | undefined} */
  getSimObjectByName ({ name, unit }) {
    // TODO return SO by name and unit
    // * throw if Name/Unit are not string with a value
    // * return undefined if not found
    // SO is cloned before being returned
    //@ts-ignore
    return null;
  }

  //#endregion GET/QUERY methods

  //#region COMMIT methods
  /**
   * Commit the current transaction, if any.
   * @throws {Error} If the transaction is not valid, not squared, etc.
   */
  commit () {
    if (this.#isLocked)
      throw new Error('Ledger is locked');

    if (this.#currentTransaction.length === 0) return;

    // TODO validate trn: errore se non quadra transazione/unit, se il tipo non è un tipo riconosciuto, etc;

    // convert this.#currentTransaction to SimObjectJsonDumpDto, then stringify
    const simObjectJsonDumpDtoArray = this.#currentTransaction.map(simObject => simObjectToJsonDumpDto(simObject));
    this.#appendTrnDump(JSON.stringify(simObjectJsonDumpDtoArray));

    // reset the current transaction
    this.#currentTransaction = [];
  }

  /**
   * BEWARE: this method must be called only by the engine, then must not be exported to modules.
   * Commit the current transaction without any validation
   */
  forceCommitWithoutValidation () {
    if (this.#isLocked)
      throw new Error('Ledger is locked');

    if (this.#currentTransaction.length === 0) return;

    // convert this.#currentTransaction to SimObjectJsonDumpDto, then stringify
    const simObjectJsonDumpDtoArray = this.#currentTransaction.map(simObject => simObjectToJsonDumpDto(simObject));
    this.#appendTrnDump(JSON.stringify(simObjectJsonDumpDtoArray));

    // reset the current transaction
    this.#currentTransaction = [];
  }

  //#endregion COMMIT methods

  //#region EOD methods
  /**
   * End of day activities. Can be called more than one time, and must not go in error.
   * Do some cleanups, squaring, but must not commit any transaction.
   * Must work even if the ledger is locked.
   */
  eod () {
    // TODO nothing to do for now
  }

  //#endregion EOD methods

  //#region SIMOBJECT methods
  /**
   * Add a SimObject to the transaction
   * @param {NewSimObjectDto} newSimObjectDto
   */
  newSimObject (newSimObjectDto) {
    sanitize({ value: newSimObjectDto, sanitization: newSimObjectDto_Schema });
    // validate to check that there are no extraneous properties, that would be ignored by the SimObject constructor, but could be a sign of a typo in the calling code
    validateObj({ obj: newSimObjectDto, validation: newSimObjectDto_Schema, strict:true });

    if (this.#simObjectTypes_enum_map.has(newSimObjectDto.type) === false)
      throw new Error(`SimObject type ${newSimObjectDto.type} is not recognized`);

    const debug_moduleInfo = (this.#debug) ? this.#currentDebugModuleInfo : '';

    const _value = toBigInt(newSimObjectDto.value, this.#decimalPlaces, this.#roundingModeIsRound);
    const _writingValue = _value;  // writingValue is equal to value

    const { principalIndefiniteExpiryDate, principalAmortizationSchedule } = splitPrincipal(
      newSimObjectDto, {
        decimalPlaces: this.#decimalPlaces,
        roundingModeIsRound: this.#roundingModeIsRound
      });

    const _doubleEntrySide = doubleEntrySideFromSimObjectType(newSimObjectDto.type);

    // if the SimObject is IS, then is forced to be Alive = false
    const _alive = (_doubleEntrySide === DoubleEntrySide_enum.INCOMESTATEMENT_CREDIT
      || _doubleEntrySide === DoubleEntrySide_enum.INCOMESTATEMENT_DEBIT)
      ? false : newSimObjectDto.alive;

    const simObject = new SimObject({
      decimalPlaces: this.#decimalPlaces,
      type: newSimObjectDto.type,
      id: this.#getNextId().toString(),
      dateTime: this.#today,
      name: newSimObjectDto.name ?? '',
      description: newSimObjectDto.description ?? '',
      mutableDescription: newSimObjectDto.mutableDescription ?? '',
      metadata__Name: newSimObjectDto.metadata__Name ?? [],
      metadata__Value: newSimObjectDto.metadata__Value ?? [],
      metadata__PercentageWeight: newSimObjectDto.metadata__PercentageWeight ?? [],
      unitId: newSimObjectDto.unitId,
      doubleEntrySide: _doubleEntrySide,
      currency: newSimObjectDto.currency,
      intercompanyInfo__VsUnitId: newSimObjectDto.intercompanyInfo__VsUnitId ?? '',
      value: _value,
      writingValue: _writingValue,
      alive: _alive,
      command__Id: this.#getNextCommandId().toString(),
      command__DebugDescription: (!isNullOrWhiteSpace(newSimObjectDto.command__DebugDescription)) ? (newSimObjectDto.command__DebugDescription ?? '') : debug_moduleInfo,
      commandGroup__Id: this.#getTransactionId().toString(),
      commandGroup__DebugDescription: newSimObjectDto.commandGroup__DebugDescription ?? '',
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: principalIndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: newSimObjectDto.bs_Principal__PrincipalToPay_AmortizationSchedule__Date,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: principalAmortizationSchedule,
      is_Link__SimObjId: newSimObjectDto.is_Link__SimObjId ?? '',
      vsSimObjectName: newSimObjectDto.vsSimObjectName ?? '',
      versionId: 0,
      extras: newSimObjectDto.extras
    });

    this.#addOrUpdateSimObject(simObject);
  }

  /**
   * Add a DEBUG_DEBUG SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugDebugSimObject (newDebugSimObjectDto) {
    this.#newDebugSimObject(SimObjectDebugTypes_enum.DEBUG_DEBUG, newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_INFO SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugInfoSimObject (newDebugSimObjectDto) {
    this.#newDebugSimObject(SimObjectDebugTypes_enum.DEBUG_INFO, newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_WARNING SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugWarningSimObject (newDebugSimObjectDto) {
    this.#newDebugSimObject(SimObjectDebugTypes_enum.DEBUG_WARNING, newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_WARNING SimObject to the transaction if the input string or array of strings is not empty
   * @param {Object} p
   * @param {string} p.title
   * @param {string|string[]} p.message
   */
  newDebugWarningSimObjectFromErrorString ({ title, message }) {
    if (Array.isArray(message) && message.length === 0) return;
    if (isNullOrWhiteSpace(message)) return;

    // create message: if message is an array, stringify it; otherwise, convert it to string
    const _message = (Array.isArray(message)) ? `${title}: ${JSON.stringify(message)}` : `${title}: ${message.toString()}`;
    this.#newDebugSimObject(SimObjectDebugTypes_enum.DEBUG_WARNING, new NewDebugSimObjectDto({ description: _message }));
  }

  /**
   * BEWARE: this method must be called only by the engine, then must not be exported to modules.
   * Add a DEBUG_ERROR SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugErrorSimObject (newDebugSimObjectDto) {
    this.#newDebugSimObject(SimObjectErrorDebugTypes_enum.DEBUG_ERROR, newDebugSimObjectDto);
  }

  //#endregion SIMOBJECT methods

  //#region private methods
  /** Add or update a SimObject in the repository and add it to the current transaction
   * @param {SimObject} simObject
   */
  #addOrUpdateSimObject (simObject) {
    if (this.#isLocked)
      throw new Error('Ledger is locked');

    // add the SimObject to the current transaction
    this.#currentTransaction.push(simObject);

    // if SimObject type is a debug type, return without adding it to the repository
    if (SimObjectDebugTypes_enum_validation.includes(simObject.type)) return;

    // add or update the SimObject in the repository
    this.#simObjectsRepo.set(simObject.id, simObject);

    // TODO registra il SO in un oggetto con una proprietà Map per ogni tutti i SO BS alive.  // IS e altri non possono essere alive.
    // Dopo ogni movimento di SO elimina i BS non più alive.
  }

  /** @returns {number} */
  #getNextId () {
    return ++this.#lastId;
  }

  /** @returns {number} */
  #getNextCommandId () {
    return ++this.#lastCommandId;
  }

  /** Returns the current transaction id (if there is an open transaction) or the next transaction id (if there is no open transaction)
   * @returns {number} */
  #getTransactionId () {
    // if #currentTransaction is empty, increment #lastTransactionId
    if (!this.transactionIsOpen())
      this.#lastTransactionId++;
    return this.#lastTransactionId;
  }

  /**
   * Add a Debug SimObject to the transaction
   @param {string} simObjectDebugType
   @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  #newDebugSimObject (simObjectDebugType, newDebugSimObjectDto) {
    sanitize({ value: newDebugSimObjectDto, sanitization: newDebugSimObjectDto_Schema });
    //skip validation, this method is private and can't be called with wrong types  //validation.validate({ value: simObjectDebugType, validation: SimObjectDebugTypes_enum_validation.concat(SimObjectErrorDebugTypes_enum_validation) });

    const debug_moduleInfo = this.#currentDebugModuleInfo;

    const simObject = new SimObject({
      decimalPlaces: this.#decimalPlaces,
      type: simObjectDebugType,
      id: this.#getNextId().toString(),
      dateTime: this.#today,
      name: '',
      description: newDebugSimObjectDto.description,
      mutableDescription: '',
      metadata__Name: [],
      metadata__Value: [],
      metadata__PercentageWeight: [],
      unitId: '',
      doubleEntrySide: DoubleEntrySide_enum.DEBUG,
      currency: Currency_enum.UNDEFINED,
      intercompanyInfo__VsUnitId: '',
      value: toBigInt(0, this.#decimalPlaces, this.#roundingModeIsRound),
      writingValue: toBigInt(0, this.#decimalPlaces, this.#roundingModeIsRound),
      alive: false,
      command__Id: this.#getNextCommandId().toString(),
      command__DebugDescription: (!isNullOrWhiteSpace(newDebugSimObjectDto.command__DebugDescription)) ? (newDebugSimObjectDto.command__DebugDescription ?? '') : debug_moduleInfo,
      commandGroup__Id: this.#getTransactionId().toString(),
      commandGroup__DebugDescription: newDebugSimObjectDto.commandGroup__DebugDescription ?? '',
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate: toBigInt(0, this.#decimalPlaces, this.#roundingModeIsRound),
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [],
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: [],
      is_Link__SimObjId: '',
      vsSimObjectName: '',
      versionId: 0,
      extras: null
    });

    this.#addOrUpdateSimObject(simObject);
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