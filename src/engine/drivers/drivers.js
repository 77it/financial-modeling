﻿export { Drivers };

import { DriversRepo } from '../../lib/drivers_repo.js';
import { sanitization } from '../../deps.js';

class Drivers {
  /** @type {DriversRepo} */
  #driversRepo;

  /**
   * @param {Object} p
   * @param {string} p.baseScenario
   * @param {string} p.currentScenario
   * @param {string} p.defaultUnit
   * @param {string} p.prefix__immutable_without_dates
   * @param {string} p.prefix__immutable_with_dates
   */
  constructor ({ baseScenario, currentScenario, defaultUnit, prefix__immutable_without_dates, prefix__immutable_with_dates }) {
    this.#driversRepo = new DriversRepo({
      baseScenario,
      currentScenario,
      defaultUnit,
      sanitizationType: sanitization.NUMBER_TYPE,
      prefix__immutable_without_dates,
      prefix__immutable_with_dates,
      allowMutable: false
    });
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#driversRepo.setDebugModuleInfo(debugModuleInfo);
  }

  /** @param {Date} today */
  setToday (today) {
    this.#driversRepo.setToday(today);
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
  set (p) {
    this.#driversRepo.set(p);
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
  get ({ scenario, unit, name, date, endDate, calc }) {
    // if `endDate` is not defined, returns the value defined before or at `date`
    if (endDate == null)
      return this.#driversRepo.get({ scenario, unit, name, date });
    // if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`
    else {
      /** @type {number[]} */
      const _retArray = this.#driversRepo.get({ scenario, unit, name, date, endDate });
      // switch on `calc`
      switch (calc) {
        case 'sum':
          return _retArray.reduce((partialSum, a) => partialSum + a, 0);  // see https://stackoverflow.com/a/16751601
        case 'average':
          return _retArray.reduce((a, b) => a + b, 0) / _retArray.length;
        case 'min':
          return Math.min(..._retArray);  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min
        case 'max':
          return Math.max(..._retArray);  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max
        default:  // apply `sum` as default
          return _retArray.reduce((a, b) => a + b, 0);
      }
    }
  }
}
