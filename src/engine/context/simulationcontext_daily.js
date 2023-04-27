export { SimulationContextDaily };

import { NewSimObjectDto } from '../ledger/commands/newsimobjectdto.js';
import { NewDebugSimObjectDto } from '../ledger/commands/newdebugsimobjectdto.js';

class SimulationContextDaily {
  #setSetting;
  #getSetting;
  #getDriver;
  #getTaskLock;
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

  get getDriver () { return this.#getDriver; }

  get getTaskLock () { return this.#getTaskLock; }

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
   * @param {getDriver} p.getDriver
   * @param {getTaskLock} p.getTaskLock
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
    getDriver,
    getTaskLock,
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
    this.#getDriver = getDriver;
    this.#getTaskLock = getTaskLock;
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
 * @param {Object} p
 * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
 * @param {string} [p.unit] - Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * @param {string} p.name - Setting name
 * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method
 * @return {undefined|*} Setting; if not found, returns undefined
 * if `endDate` is not defined, returns the value defined before or at `date`;
 * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.
 */

/**
 * @callback getDriver
 * Get a Driver
 * @param {Object} p
 * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
 * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * @param {string} p.name - Driver name
 * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method
 * @param {Date} [p.endDate] - Optional end date; if missing the search is done only for `date`
 * @param {'sum'|'average'|'min'|'max'} [p.calc] - Optional calculation to be applied to the values found; default is 'sum'
 * @return {undefined|number} Driver; if not found, returns undefined
 * if `endDate` is not defined, returns the value defined before or at `date`;
 * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.
 */

/**
 * @callback getTaskLock
 * Get a TaskLock
 * @param {Object} p
 * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
 * @param {string} p.name - TaskLock name
 * @return {*} TaskLock
 * @throws {Error} if TaskLock is not defined, throws an error
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
 @param {NewDebugSimObjectDto} newDebugSimObjectDto
 */

/**
 * @callback newDebugInfoSimObject
 * Add a DEBUG_INFO SimObject to the transaction
 @param {NewDebugSimObjectDto} newDebugSimObjectDto
 */

/**
 * @callback newDebugWarningSimObject
 * Add a DEBUG_WARNING SimObject to the transaction
 @param {NewDebugSimObjectDto} newDebugSimObjectDto
 */

/**
 * @callback newDebugWarningSimObjectFromErrorString
 * Add a DEBUG_WARNING SimObject to the transaction if the input string or array of strings is not empty
 @param {Object} p
 @param {string} p.title
 @param {string|string[]} p.message
 */
