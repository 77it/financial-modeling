export { SimulationContext, DRIVERS_GET_CALC };

// Classes imported for type checking only
import { Drivers, GET_CALC as DRIVERS_GET_CALC } from '../drivers/drivers.js';
import { Settings } from '../settings/settings.js';
import { TaskLocks } from '../tasklocks/tasklocks.js';
import { Ledger } from '../ledger/ledger.js';
import { NewSimObjectDto } from '../ledger/commands/newsimobjectdto.js';
import { NewDebugSimObjectDto } from '../ledger/commands/newdebugsimobjectdto.js';
import { isNullOrWhiteSpace } from '../../lib/string_utils.js';
import { Decimal } from '../../../vendor/decimal/decimal.js';

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
   * Set today everywhere (Ledger, Drivers, Settings, etc)
   * @param {Date} today
   */
  setToday (today) {
    this.#ledger.setToday(today);
    this.#drivers.setToday(today);
    this.#settings.setToday(today);
  }

  /**
   * Set Settings from an array of scenarios, units, names, dates and value.<p>
   * Settings can be immutable and mutable.<p>
   * If a date is already present, the second one will be ignored.
   * @param {{scenario?: string[], unit?: string[], name: string, date?: Date, value: *}[]} p
   * scenario: optional; array of strings (to set more than one scenario); '' means `currentScenario` from constructor<p>
   * unit: Setting unit, optional; array of strings (to set more than one unit); '' means `defaultUnit` from constructor<p>
   * name: Setting name<p>
   * date: optional; if missing will be set to new Date(0)<p>
   * value: Setting value<p>
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
   * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method; can't return a date > than today.
   * @param {boolean} [p.throwIfNotDefined] - Optional flag to throw. See @throws for description of this option.
   * @return {*} Setting; if not found, throws<p>
   * if `endDate` is not defined, returns the value defined before or at `date`;<p>
   * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.<p>
   * Read from Unit, then from Default Unit (if Unit != Default), then from Base Scenario (if Scenario != Base) and same Unit,<p>
   * finally from Base Scenario and Default Unit (if Unit != Default and if Scenario != Base).<p>
   * Returned data is not cloned because Settings are stored with `freezeValues` option = true then the values are deep-frozen.<p>
   * @throws {Error} If `throwIfNotDefined` is true, throws if the Driver to get is not defined. If `search` is true, throws only if the search fails.
   */
  getSetting ({ scenario, unit, name, date, throwIfNotDefined = true }) {
    return this.#settings.get({ scenario, unit, name, date, throwIfNotDefined });
  }

  /**
   * Check if a Setting is defined
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Setting name
   * @return {boolean}
   */
  isDefinedSetting ({ scenario, unit, name }) {
    return this.#settings.isDefined({ scenario, unit, name });
  }

  /**
   * Set Drivers from an array of scenarios, units, names, dates and value.<p>
   * Drivers are immutable.<p>
   * If a date is already present, the second one will be ignored.<p>
   * @param {{scenario?: string[], unit?: string[], name: string, date?: Date, value: *}[]} p
   * scenario: optional; array of strings (to set more than one scenario); '' means `currentScenario` from constructor<p>
   * unit: Setting unit, optional; array of strings (to set more than one unit); '' means `defaultUnit` from constructor<p>
   * name: Driver name<p>
   * date: optional; if missing will be set to new Date(0)<p>
   * value: Driver value, will be sanitized to number<p>
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
   * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method; can't return a date > than today.
   * @param {Date} [p.endDate] - Optional end date; if missing the search is done only for `date`
   * @param {DRIVERS_GET_CALC} [p.calc] - Optional calculation to be applied to the values found; default is 'sum'
   * @return {Decimal} Driver; if not found, throws<p>
   * if `endDate` is not defined, returns the value defined before or at `date`;<p>
   * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.<p>
   * @throws {Error} Throws if the Driver to get is not defined. If `search` is true, throws only if the search fails.<p>
   */
  getDriver ({ scenario, unit, name, date, endDate, calc }) {
    return this.#drivers.get({ scenario, unit, name, date, endDate, calc });
  }

  /**
   * Set a TaskLock; TaskLocks are immutable.<p>
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
  append (newSimObjectDto) {
    this.#ledger.appendSimObject(newSimObjectDto);
  }

  /**
   * Add a DEBUG_DEBUG SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  debug (newDebugSimObjectDto) {
    this.#ledger.appendDebugDebugSimObject(newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_INFO SimObject to the transaction
   * @param {NewDebugSimObjectDto} newDebugSimObjectDto
   */
  info (newDebugSimObjectDto) {
    this.#ledger.appendDebugInfoSimObject(newDebugSimObjectDto);
  }

  /**
   * Add a DEBUG_WARNING to the transaction from SimObject, string or string array
   * @param {NewDebugSimObjectDto | string | string[]} message
   */
  warning (message) {
    if (message instanceof NewDebugSimObjectDto){
      this.#ledger.appendDebugWarningSimObject(message);
      return;
    }

    // converts a string to itself (without quotes), an empty array to "", an array to comma separated string
    const _message = message.toString();

    if (isNullOrWhiteSpace(_message)) return;
    this.#ledger.appendDebugWarningSimObject(new NewDebugSimObjectDto({ description: _message }));
  }
}
