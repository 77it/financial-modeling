export { Ledger };

import * as schema from '../../lib/schema.js';
import { sanitize } from '../../lib/schema_sanitization_utils.js';
import { RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS } from '../../config/engine.js';
import { validate } from '../../lib/schema_validation_utils.js';
import { isNullOrWhiteSpace } from '../../lib/string_utils.js';
import { ROUNDING_MODES } from '../../lib/decimal.js';

import { SimObject } from '../simobject/simobject.js';
import { simObjectToDto } from '../simobject/utils/simobject_to_dto.js';
import { simObjectToJsonDumpDto } from '../simobject/utils/simobject_to_json_dump_dto.js';
import { splitAndSortFinancialSchedule } from '../simobject/utils/split_and_sort_financialschedule.js';
import { toBigInt } from '../simobject/utils/to_bigint.js';
import { doubleEntrySideFromSimObjectType } from '../simobject/enums/doubleentryside_from_simobject_type.js';
import { SimObjectTypes_enum } from '../simobject/enums/simobject_types_enum.js';
import { SimObjectTypes_WithPrincipal_set } from '../simobject/enums/simobject_types_withprincipal_enum.js';
import { SimObjectDebugTypes_enum } from '../simobject/enums/simobject_debugtypes_enum.js';
import { SimObjectErrorDebugTypes_enum } from '../simobject/enums/simobject_errordebugtypes_enum.js';
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

alignAmortizationScheduleOfLinkedVsSimObjectName(): allinea i piani dei SimObject collegati (indefinite e principal) non scaricando il valore del SimObject (lo fa `AmortizationScheduler`) ma solo allineando il piano di ammortamento (se il loro saldo è identico, altrimenti i piani non vengono allineati)
Vedi nota di implementazione su OneNote

 */

// SimObjects storage and edits, #queue
/*
Don't provide way to store a queue of future movements, because a SimObject can be changed by other modules.

Store, as a property of the SimObject, an object with custom properties, as the payment plans, the interest, etc.
 */

class Ledger {
  /** @type {appendTrnDump} */
  #appendTrnDumpCallback;
  /** Map to store SimObjects: SimObject id as string key, SimObject as value.
   * @type {Map<string, SimObject>} */
  #simObjectsRepo;
  /** Map to store SimObjectTypes_enum object
   * @type {Map<string, string>} */
  #simObjectTypes_enum_map;
  /** Map to store SimObjectDebugTypes_enum object
   * @type {Map<string, string>} */
  #SimObjectDebugTypes_enum_map;
  /** @type {SimObject[]} */
  #currentTransaction;
  /** @type {Date} */
  #today;
  /** @type {number} */
  #lastSequentialId;
  /** @type {number} */
  #lastId;
  /** @type {number} */
  #lastCommandId;
  /** @type {number} */
  #lastTransactionId;
  /** @type {boolean} */
  #debugFlag;
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
   * @param {ROUNDING_MODES} p.roundingModeIsRound Rounding mode to use when storing numbers in the ledger
   */
  constructor ({ appendTrnDump, decimalPlaces, roundingModeIsRound }) {
    const _p = sanitize({
      value: { decimalPlaces, roundingModeIsRound },
      sanitization: { decimalPlaces: schema.NUMBER_TYPE, roundingModeIsRound: schema.BOOLEAN_TYPE }
    });

    // check if decimalPlaces is an integer, otherwise raise exception
    if (!Number.isInteger(_p.decimalPlaces))
      throw new Error(`decimalPlaces must be an integer, got ${_p.decimalPlaces}`);

    this.#appendTrnDumpCallback = appendTrnDump;
    this.#simObjectsRepo = new Map();
    this.#simObjectTypes_enum_map = new Map(Object.entries(SimObjectTypes_enum));
    this.#SimObjectDebugTypes_enum_map = new Map(Object.entries(SimObjectDebugTypes_enum));
    this.#currentTransaction = [];
    this.#lastSequentialId = 0;
    this.#lastId = 0;
    this.#lastCommandId = 0;
    this.#lastTransactionId = 0;
    this.#today = new Date(0);
    this.#debugFlag = false;
    this.#currentDebugModuleInfo = '';
    this.#decimalPlaces = _p.decimalPlaces;
    XXX this.#roundingModeIsRound = _p.roundingModeIsRound;
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
    this.#debugFlag = true;
  }

  /** @param {Date} today */
  setToday (today) {
    validate({ value: today, validation: schema.DATE_TYPE });
    // throw if today is before than the last set today
    if (today.getTime() < this.#today.getTime())
      throw new Error(`Today's date (${today.toISOString()}) must not be earlier than the last set today (${this.#today.toISOString()})`);
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
  /** @returns {number} */
  getNextSequentialId () {
    return ++this.#lastSequentialId;
  }

  /** @returns {string} */
  getNextSequentialIdString () {
    return this.getNextSequentialId().toString();
  }

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
    // TODO return a list of SimObjects
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
    // TODO return SimObjects by id
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

  /**
   * Get the list of all SimObjects for all Units moved the previous day
   *
   * This can be one of the ledger methods used as accounting query methods
   * @returns {SimObject[]} */
  getSimObjectsMovedYesterday () {
    // TODO return a list of SimObjects
    // * all SO moved yesterday
    // * for all Units
    // all SO are cloned before being returned
    //@ts-ignore
    return null;
  }

  //#endregion GET/QUERY methods

  //#region COMMIT methods
  /**
   * Commit the current transaction, if any.
   * Commit means pushing the transaction to the ledger dump, then reset the current transaction.
   * @throws {Error} If the transaction is not valid, not squared, etc.
   */
  commit () {
    if (this.#currentTransaction.length === 0) return;

    // TODO validate trn: errore se non quadra transazione/unit, se il tipo non è un tipo riconosciuto, etc;

    this.#commit();
  }

  /**
   * BEWARE: this method must be called only by the engine, then must not be exported to modules.
   * Commit the current transaction without any validation.
   * Commit means pushing the transaction to the ledger dump, then reset the current transaction.
   */
  ONLY_FOR_ENGINE_USAGE_forceCommitWithoutValidation () {
    this.#commit();
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
  appendSimObject (newSimObjectDto) {
    if (!RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS) {
      // validate to check that there are no extraneous properties, that would be ignored by the SimObject constructor, but could be a sign of a typo in the calling code
      validate({ value: newSimObjectDto, validation: newSimObjectDto_Schema, strict: true });
    }

    if (this.#simObjectTypes_enum_map.has(newSimObjectDto.type) === false)
      throw new Error(`SimObject type ${newSimObjectDto.type} is not recognized`);

    // TODO implement and call `alignAmortizationScheduleOfLinkedVsSimObjectName()`

    const debug_moduleInfo = (this.#debugFlag) ? this.#currentDebugModuleInfo : '';

    const _value = toBigInt(newSimObjectDto.value, this.#decimalPlaces, this.#roundingModeIsRound);
    const _writingValue = _value;  // writingValue is equal to value

    // If the SimObject should have principal or has some financial schedule values
    // use `splitAndSortFinancialSchedule` to split a principal value in indefinite and amortization schedule values
    // distributing it proportionally across the amortization schedule if needed.
    // If the `financialSchedule__amountWithoutScheduledDate` is not equal to `_value` and `financialSchedule__scheduledAmounts` is empty an error is raised.
    const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = (() => {
      if (newSimObjectDto.financialSchedule__amountWithoutScheduledDate !== 0 ||
          newSimObjectDto.financialSchedule__scheduledAmounts.length !== 0 ||
          SimObjectTypes_WithPrincipal_set.has(newSimObjectDto.type)) {
        return splitAndSortFinancialSchedule(newSimObjectDto, {
          decimalPlaces: this.#decimalPlaces,
          roundingModeIsRound: this.#roundingModeIsRound
        })
      } else {
        // if the SimObject shouldn't have principal or has no financial schedule values
        return {
          financialSchedule__amountWithoutScheduledDate: toBigInt(0, this.#decimalPlaces, this.#roundingModeIsRound),
          financialSchedule__scheduledAmounts: [],
          financialSchedule__scheduledDates: []
        };
      }
    })();

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
      command__DebugDescription: newSimObjectDto.command__DebugDescription ?? debug_moduleInfo,
      commandGroup__Id: this.#getTransactionId().toString(),
      commandGroup__DebugDescription: newSimObjectDto.commandGroup__DebugDescription ?? '',
      financialSchedule__amountWithoutScheduledDate: financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledDates: financialSchedule__scheduledDates,
      financialSchedule__scheduledAmounts: financialSchedule__scheduledAmounts,
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
  appendDebugDebugSimObject (newDebugSimObjectDto) {
    this.#appendDebugSimObject(SimObjectDebugTypes_enum.DEBUG_DEBUG, newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_INFO SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  appendDebugInfoSimObject (newDebugSimObjectDto) {
    this.#appendDebugSimObject(SimObjectDebugTypes_enum.DEBUG_INFO, newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_WARNING SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  appendDebugWarningSimObject (newDebugSimObjectDto) {
    this.#appendDebugSimObject(SimObjectDebugTypes_enum.DEBUG_WARNING, newDebugSimObjectDto);
  }

  /**
   * BEWARE: this method must be called only by the engine, then must not be exported to modules.
   * Add a DEBUG_ERROR SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  ONLY_FOR_ENGINE_USAGE_appendDebugErrorSimObject (newDebugSimObjectDto) {
    this.#appendDebugSimObject(SimObjectErrorDebugTypes_enum.DEBUG_ERROR, newDebugSimObjectDto);
  }

  //#endregion SIMOBJECT methods

  //#region private methods
  /**
   * Commit the current transaction without any validation.
   * Commit means pushing the transaction to the ledger dump, then reset the current transaction.
   */
  #commit () {
    if (this.#currentTransaction.length === 0) return;

    // convert every element of this.#currentTransaction to SimObjectJsonDumpDto, then stringify the array
    const simObjectJsonDumpDtoArray = this.#currentTransaction.map(simObject => simObjectToJsonDumpDto(simObject));
    this.#appendTrnDumpCallback(JSON.stringify(simObjectJsonDumpDtoArray));

    // TODO switch on #SimObjectDebugTypes_enum_map to call the right callbacks to append the debug info

    // reset the current transaction
    this.#currentTransaction = [];
  }

  /** Add or update a SimObject in the repository and add it to the current transaction
   * @param {SimObject} simObject
   */
  #addOrUpdateSimObject (simObject) {
    if (this.#isLocked)
      throw new Error('Ledger is locked');

    // add the SimObject to the current transaction
    this.#currentTransaction.push(simObject);

    // if SimObject type is a debug type, return without adding it to the repository
    // check that kay simObject.type is included in SimObjectDebugTypes_enum
    if (this.#SimObjectDebugTypes_enum_map.has(simObject.type))
      return;

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
  #appendDebugSimObject (simObjectDebugType, newDebugSimObjectDto) {
    if (!RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS) {
      // validate to check that there are no extraneous properties, that would be ignored by the SimObject constructor, but could be a sign of a typo in the calling code
      validate({ value: newDebugSimObjectDto, validation: newDebugSimObjectDto_Schema, strict: true });

      //skip validation of `simObjectDebugType`, this method is private and can't be called with wrong types  //validation.validate({ value: simObjectDebugType, validation: SimObjectDebugTypes_enum_validation.concat(SimObjectErrorDebugTypes_enum_validation) });
    }

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
      command__DebugDescription: newDebugSimObjectDto.command__DebugDescription ?? debug_moduleInfo,
      commandGroup__Id: this.#getTransactionId().toString(),
      commandGroup__DebugDescription: newDebugSimObjectDto.commandGroup__DebugDescription ?? '',
      financialSchedule__amountWithoutScheduledDate: toBigInt(0, this.#decimalPlaces, this.#roundingModeIsRound),
      financialSchedule__scheduledDates: [],
      financialSchedule__scheduledAmounts: [],
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