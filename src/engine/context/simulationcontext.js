export { SimulationContext };

import { NewSimObjectDto } from '../ledger/commands/newsimobjectdto.js';
import { NewDebugSimObjectDto } from '../ledger/commands/newdebugsimobjectdto.js';

class SimulationContext {
  #setSetting;
  #getSetting;
  #setDriver;
  #getDriver;
  #setTaskLock;
  #getTaskLock;
  #isDefinedLock;
  #transactionIsOpen;
  #ledgerIsLocked;
  #commit;
  #newSimObject;
  #newDebugDebugSimObject;
  #newDebugInfoSimObject;
  #newDebugWarningSimObject;
  #newDebugWarningSimObjectFromErrorString;

  //#region getters
  get setSetting () { return this.#setSetting; }

  get getSetting () { return this.#getSetting; }

  get setDriver() { return this.#setDriver; }

  get getDriver () { return this.#getDriver; }

  get setTaskLock() { return this.#setTaskLock; }

  get getTaskLock () { return this.#getTaskLock; }

  get isDefinedLock() { return this.#isDefinedLock; }

  get transactionIsOpen () { return this.#transactionIsOpen; }

  get ledgerIsLocked () { return this.#ledgerIsLocked; }

  get commit () { return this.#commit; }

  get newSimObject () { return this.#newSimObject; }

  get newDebugDebugSimObject () { return this.#newDebugDebugSimObject; }

  get newDebugInfoSimObject () { return this.#newDebugInfoSimObject; }

  get newDebugWarningSimObject () { return this.#newDebugWarningSimObject; }

  get newDebugWarningSimObjectFromErrorString () { return this.#newDebugWarningSimObjectFromErrorString; }

  //#endregion getters

  /**
   * @param {Object} p
   * @param {setSetting} p.setSetting
   * @param {getSetting} p.getSetting
   * @param {setDriver} p.setDriver
   * @param {getDriver} p.getDriver
   * @param {setTaskLock} p.setTaskLock
   * @param {getTaskLock} p.getTaskLock
   * @param {isDefinedLock} p.isDefinedLock
   * @param {transactionIsOpen} p.transactionIsOpen
   * @param {ledgerIsLocked} p.ledgerIsLocked
   * @param {commit} p.commit
   * @param {newSimObject} p.newSimObject
   * @param {newDebugDebugSimObject} p.newDebugDebugSimObject
   * @param {newDebugInfoSimObject} p.newDebugInfoSimObject
   * @param {newDebugWarningSimObject} p.newDebugWarningSimObject
   * @param {newDebugWarningSimObjectFromErrorString} p.newDebugWarningSimObjectFromErrorString
   */
  constructor ({
    setSetting,
    getSetting,
    setDriver,
    getDriver,
    setTaskLock,
    getTaskLock,
    isDefinedLock,
    transactionIsOpen,
    ledgerIsLocked,
    commit,
    newSimObject,
    newDebugDebugSimObject,
    newDebugInfoSimObject,
    newDebugWarningSimObject,
    newDebugWarningSimObjectFromErrorString
  }) {
    this.#setSetting = setSetting;
    this.#getSetting = getSetting;
    this.#setDriver = setDriver;
    this.#getDriver = getDriver;
    this.#setTaskLock = setTaskLock;
    this.#getTaskLock = getTaskLock;
    this.#isDefinedLock = isDefinedLock;
    this.#transactionIsOpen = transactionIsOpen;
    this.#ledgerIsLocked = ledgerIsLocked;
    this.#commit = commit;
    this.#newSimObject = newSimObject;
    this.#newDebugDebugSimObject = newDebugDebugSimObject;
    this.#newDebugInfoSimObject = newDebugInfoSimObject;
    this.#newDebugWarningSimObject = newDebugWarningSimObject;
    this.#newDebugWarningSimObjectFromErrorString = newDebugWarningSimObjectFromErrorString;
  }
}

/**
 * @callback setSetting
 * Set Settings from an array of scenarios, units, names, dates and value.
 * Settings can be immutable and mutable.
 * If a date is already present, the second one will be ignored.
 * @param {{scenario?: string, unit?: string, name: string, date?: Date, value: *}[]} p
 * scenario: optional; null, undefined or '' means `currentScenario` from constructor
 * unit: Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: Setting name
 * date: optional; if missing will be set to new Date(0)
 * value: Setting value
 */

/**
 * @callback getSetting
 * Get a Setting
 * @param {{scenario?: string, unit?: string, name: string, date?: Date}} p
 * scenario: Optional scenario; null, undefined or '' means `currentScenario` from constructor
 * unit: Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: Setting name
 * date: Optional date; if missing is set with the value of `setToday` method
 * @return {undefined|*} Setting; if not found, returns undefined
 * if `endDate` is not defined, returns the value defined before or at `date`;
 * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.
 */

/**
 * @callback setDriver
 * Set Drivers from an array of scenarios, units, names, dates and value.
 * Drivers are immutable.
 * If a date is already present, the second one will be ignored.
 * @param {{scenario?: string, unit?: string, name: string, date?: Date, value: *}[]} p
 * scenario: optional; null, undefined or '' means `currentScenario` from constructor
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: Driver name
 * date: optional; if missing will be set to new Date(0)
 * value: Driver value, will be sanitized to number
 */

/**
 * @callback getDriver
 * Get a Driver
 * @param {{scenario?: string, unit?: string, name: string, date?: Date, endDate?: Date, calc?: 'sum'|'average'|'min'|'max'}} p
 * scenario: Optional scenario; null, undefined or '' means `currentScenario` from constructor
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: Driver name
 * date: Optional date; if missing is set with the value of `setToday` method
 * endDate: Optional end date; if missing the search is done only for `date`
 * calc: Optional calculation to be applied to the values found; default is 'sum'
 * @return {undefined|number} Driver; if not found, returns undefined
 * if `endDate` is not defined, returns the value defined before or at `date`;
 * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.
 */

/**
 * @callback setTaskLock
 * Set a TaskLock; TaskLocks are immutable.
 * @param {{unit?: string, name: string, value: *}} p
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: TaskLock name
 * value: TaskLock value
 * @return {boolean} true if TaskLock is set, false if TaskLock is already defined
 */

/**
 * @callback getTaskLock
 * Get a TaskLock
 * @param {{unit?: string, name: string}} p
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: TaskLock name
 * @return {*} TaskLock
 * @throws {Error} if TaskLock is not defined, throws an error
 */

/**
 * @callback isDefinedLock
 * Check if a TaskLock is defined
 * @param {{unit?: string, name: string}} p
 * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * name: TaskLock name
 * @return {boolean}
 */

/**
 * @callback transactionIsOpen
 * @returns {boolean}
 */

/**
 * @callback ledgerIsLocked
 * @returns {boolean}
 */

/**
 * @callback commit
 * Commit the current transaction, if any.
 * @throws {Error} If the transaction is not valid, not squared, etc.
 */

/**
 * @callback newSimObject
 * Add a SimObject to the transaction
 * @param {NewSimObjectDto} newSimObjectDto
 */

/**
 * @callback newDebugDebugSimObject
 * Add a DEBUG_DEBUG SimObject to the transaction
 * @param {NewDebugSimObjectDto} newDebugSimObjectDto
 */

/**
 * @callback newDebugInfoSimObject
 * Add a DEBUG_INFO SimObject to the transaction
 * @param {NewDebugSimObjectDto} newDebugSimObjectDto
 */

/**
 * @callback newDebugWarningSimObject
 * Add a DEBUG_WARNING SimObject to the transaction
 * @param {NewDebugSimObjectDto} newDebugSimObjectDto
 */

/**
 * @callback newDebugWarningSimObjectFromErrorString
 * Add a DEBUG_WARNING SimObject to the transaction if the input string or array of strings is not empty
 * @param {{title: string, message: string|string[]}} p
 */
