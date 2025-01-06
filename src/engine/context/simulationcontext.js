export { SimulationContext };

// Classes imported for type checking only
import { Drivers } from '../drivers/drivers.js';
import { Settings } from '../settings/settings.js';
import { TaskLocks } from '../tasklocks/tasklocks.js';
import { Ledger } from '../ledger/ledger.js';
import { NewSimObjectDto } from '../ledger/commands/newsimobjectdto.js';
import { NewDebugSimObjectDto } from '../ledger/commands/newdebugsimobjectdto.js';

class SimulationContext {
  /** @type {Drivers} */
  #drivers;
  /** @type {Settings} */
  #settings;
  /** @type {TaskLocks} */
  #taskLocks;
  /** @type {Ledger} */
  #ledger;

  /**
   * @param {Object} p
   * @param {Drivers} p.drivers
   * @param {Settings} p.settings
   * @param {TaskLocks} p.taskLocks
   * @param {Ledger} p.ledger
   */
  constructor ({
    drivers,
    settings,
    taskLocks,
    ledger
  }) {
    this.#drivers = drivers;
    this.#settings = settings;
    this.#taskLocks = taskLocks;
    this.#ledger = ledger;
  }

  /**
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
  setSetting (p) {
    this.#settings.set(p);
  }

  /**
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
  getSetting ({ scenario, unit, name, date }) {
    return this.#settings.get({ scenario, unit, name, date });
  }

  /**
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
  setDriver (p) {
    this.#drivers.set(p);
  }

  /**
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
  getDriver ({ scenario, unit, name, date, endDate, calc }) {
    return this.#drivers.get({ scenario, unit, name, date, endDate, calc });
  }

  /**
   * Set a TaskLock; TaskLocks are immutable.
   * If TaskLock is a callback function that must preserve its own `this` context, must be defined as an arrow function. see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
   * @param {Object} p
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @param {*} p.value - TaskLock value
   * @return {boolean} true if TaskLock is set, false if TaskLock is already defined
   */
  setTaskLock ({ unit, name, value }) {
    return this.#taskLocks.set({ unit, name, value });
  }

  /**
   * Get a TaskLock
   * @param {Object} p
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @return {*} TaskLock
   * @throws {Error} if TaskLock is not defined, throws an error
   */
  getTaskLock ({ unit, name }) {
    return this.#taskLocks.get({ unit, name });
  }

  /**
   * Check if a TaskLock is defined
   * @param {Object} p
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @return {boolean}
   */
  isDefinedLock ({ unit, name }) {
    return this.#taskLocks.isDefined({ unit, name });
  }

  /** @returns {boolean} */
  transactionIsOpen () {
    return this.#ledger.transactionIsOpen();
  }

  /** @returns {boolean} */
  ledgerIsLocked () {
    return this.#ledger.isLocked();
  }

  /**
   * Commit the current transaction, if any.
   * @throws {Error} If the transaction is not valid, not squared, etc.
   */
  commit () {
    this.#ledger.commit();
  }

  /**
   * Add a SimObject to the transaction
   * @param {NewSimObjectDto} newSimObjectDto
   */
  newSimObject (newSimObjectDto) {
    this.#ledger.newSimObject(newSimObjectDto);
  }

  /**
   * Add a DEBUG_DEBUG SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugDebugSimObject (newDebugSimObjectDto) {
    this.#ledger.newDebugDebugSimObject(newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_INFO SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugInfoSimObject (newDebugSimObjectDto) {
    this.#ledger.newDebugInfoSimObject(newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_WARNING SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  newDebugWarningSimObject (newDebugSimObjectDto) {
    this.#ledger.newDebugWarningSimObject(newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_WARNING SimObject to the transaction if the input string or array of strings is not empty
   * @param {Object} p
   * @param {string} p.title
   * @param {string|string[]} p.message
   */
  newDebugWarningSimObjectFromErrorString ({ title, message }) {
    this.#ledger.newDebugWarningSimObjectFromErrorString({ title, message });
  }
}
