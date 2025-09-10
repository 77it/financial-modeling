export { Drivers, GET_CALC };

import { DriversRepo } from '../../lib/drivers_repo.js';
import { DRIVER_PREFIXES__ZERO_IF_NOT_SET } from '../../config/globals.js';
import { sanitize } from '../../lib/schema_sanitization_utils.js';
import * as schema from '../../lib/schema.js';
import { Decimal } from '../../../vendor/decimaljs/decimal.js';
import { getFmlOrValueToDecimal } from '../fml/fml_utils.js';

/**
 * @enum {string}
 * @readonly
 */
const GET_CALC = {
  SUM: 'sum',
  AVERAGE: 'average',
  MIN: 'min',
  MAX: 'max'
};
Object.freeze(GET_CALC);

class Drivers {
  /** @type {DriversRepo} */
  #driversRepo;
  /** @type {Date} */
  #today;

  /**
   * Class to store and retrieve Drivers
   * @param {Object} p
   * @param {string} p.baseScenario
   * @param {string} p.currentScenario
   * @param {string} p.defaultUnit - The Simulation Unit
   * @param {string} p.prefix__immutable_without_dates
   * @param {string} p.prefix__immutable_with_dates
   */
  constructor ({ baseScenario, currentScenario, defaultUnit, prefix__immutable_without_dates, prefix__immutable_with_dates }) {
    this.#driversRepo = new DriversRepo({
      baseScenario,
      currentScenario,
      defaultUnit,
      prefix__immutable_without_dates,
      prefix__immutable_with_dates,
      allowMutable: false,
      freezeValues: false  // is false because we add only number and formula values, that are immutable by default
    });
    this.#today = new Date(0);
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#driversRepo.setDebugModuleInfo(debugModuleInfo);
  }

  /** @param {Date} today */
  setToday (today) {
    this.#driversRepo.setToday(today);
    this.#today = today;  // we don't need to validate it because is already validated in #driversRepo.setToday()
  }

  /**
   * Set Drivers from an array of scenarios, units, names, dates and value.<p>
   * Drivers can be immutable without dates, immutable with dates.<p>
   * If a date is already present, the second Driver will be ignored.<p>
   * If a date is present in an immutable driver without dates, the date will be ignored.<p>
   *
   * @param {{scenario?: string[], unit?: string[], name: string, date?: Date, value: *}[]} p
   * scenario: optional; array of strings (to set more than one scenario); '' means `currentScenario` from constructor<p>
   * unit: Setting unit, optional; array of strings (to set more than one unit); '' means `defaultUnit` from constructor<p>
   * name: Driver name<p>
   * date: optional; if missing will be set to new Date(0)<p>
   * value: Driver value; will not be sanitized to Decimal (nor number); the conversion to Decimal will be done during get, to not save too much Decimal objects in memory<p>
   * @returns {string[]} array of errors
   * @throws {Error} If a date is already present and the driver is immutable, trying to overwrite it throws
   */
  set (p) {
    /*
    // loop input array: sanitize input to number & add to every item property `throwOnImmutableDriverChange` = true
    p.forEach(item => {
      item.value = sanitize({ value: item.value, sanitization: schema.NUMBER_TYPE});
    });
    */

    // build a new array `p2` from `p`, expanding `scenario` and `unit` arrays:
    // if `scenario` is not an array or is an empty array, set it to `[undefined]`
    // if `unit` is not an array or is an empty array, set it to `[undefined]`
    // then for each entry in `p, loop `scenario` and `unit` arrays and add to `p2` an entry for each combination of `scenario` and `unit`
    // also add property `throwOnImmutableDriverChange` = true to each entry
    /** @type {{scenario?: string, unit?: string, name: string, date?: Date, value: *, throwOnImmutableDriverChange: boolean}[]} */
    const p2 = [];
    for (const item of p) {
      // set `scenarios` and `units` to `[undefined]` if they are not already arrays or if they are empty arrays
      const scenarios = (Array.isArray(item.scenario) && item.scenario.length > 0) ? item.scenario : [undefined];
      const units = (Array.isArray(item.unit) && item.unit.length > 0) ? item.unit : [undefined];

      for (const scenario of scenarios) {
        for (const unit of units) {
          p2.push({
            ...item,
            scenario,
            unit,
            throwOnImmutableDriverChange: true
          });
        }
      }
    }

    // set all drivers in `p2`
    return this.#driversRepo.set(p2);
  }

  /**
   * Get a Driver
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method; can't return a date > than today.
   * @param {Date} [p.endDate] - Optional end date; if missing the search is done only for `date`
   * @param {GET_CALC} [p.calc] - Optional calculation to be applied to the values found; default is 'sum'
   * @return {Decimal} returns the Driver value sanitized to Decimal;<p>
   * if `endDate` is not defined, returns the value defined before or at `date`;<p>
   * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.<p>
   * Read from Unit, then from Default Unit (if Unit != Default), then from Base Scenario (if Scenario != Base) and same Unit,<p>
   * finally from Base Scenario and Default Unit (if Unit != Default and if Scenario != Base).<p>
   * Returned data is not cloned because Drivers are numbers then immutable by default.<p>
   * @throws {Error} Throws if the Driver to get is not defined or if is queried a date > Today. If `search` is true, throws only if the search fails.<p>
   */
  get ({ scenario, unit, name, date, endDate, calc }) {
    if (date && date.getTime() > this.#today.getTime()) {
      throw new Error(`Date ${date.toISOString()} is greater than today ${this.#today.toISOString()}`);
    }
    if (endDate && endDate.getTime() > this.#today.getTime()) {
      throw new Error(`EndDate ${endDate.toISOString()} is greater than today ${this.#today.toISOString()}`);
    }

    // if `endDate` is not defined:
    // - if the driver name starts with a string contained in `DRIVER_PREFIXES__ZERO_IF_NOT_SET`, returns the value defined exactly at `date` if it exists
    // - otherwise, returns the value defined before or at `date`

    if (endDate == null) {
      let _searchExactDate = false;

      const prefixes = DRIVER_PREFIXES__ZERO_IF_NOT_SET.get();  // we don't check if `prefixes` is defined calling `.isSet()`, because it is always defined during globals initialization
      // check if the name starts with one of the prefixes
      for (let i = 0; i < prefixes.length; i++) {
        const prefix = prefixes[i];
        // Use substring instead of startsWith for speed reasons
        if (name.substring(0, prefix.length) === prefix) {
          _searchExactDate = true;
          break;
        }
      }

      const _ret = this.#driversRepo.get({ scenario, unit, name, date, search: true, throwIfNotDefined: true, searchExactDate: _searchExactDate });
      return getFmlOrValueToDecimal(_ret);
    }
    // if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`
    else {
      /** @type {*[]} */
      const _retArray = this.#driversRepo.get({ scenario, unit, name, date, endDate, search: true, throwIfNotDefined: true });
      // no values found, return 0
      if (_retArray == null || _retArray.length === 0)
        return new Decimal(0);
      // Normalize _retArray to Decimal
      const _decimalRetArray = _retArray.map(v => getFmlOrValueToDecimal(v));
      // switch on `calc`
      switch (calc) {
        case GET_CALC.AVERAGE: {
          const __sum = _decimalRetArray.reduce((a, b) => a.plus(b), new Decimal(0));
          return __sum.div(_decimalRetArray.length);
        }
        case GET_CALC.MIN:
          return _decimalRetArray.reduce((a, b) => (a.lt(b) ? a : b));
        case GET_CALC.MAX:
          return _decimalRetArray.reduce((a, b) => (a.gt(b) ? a : b));
        default:  // apply `sum` as default
          return _decimalRetArray.reduce((a, b) => a.plus(b), new Decimal(0));
      }
    }
  }

  /**
   * Check if a Driver is defined
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Driver name
   * @return {boolean}
   */
  isDefined ({ scenario, unit, name }) {
    return this.#driversRepo.isDefined({ scenario, unit, name });
  }
}
