export { Settings };

import { DriversRepo } from '../../lib/drivers_repo.js';

class Settings {
  /** @type {DriversRepo} */
  #driversRepo;
  /** @type {Date} */
  #today;

  /**
   * Class to store and retrieve Settings
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
      allowMutable: true,
      freezeValues: true  // is true because we can add value of any type, that can be also mutable, then we freeze them
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
   * Set Settings from an array of scenarios, units, names, dates and value.<p>
   * Settings can be immutable without dates, immutable with dates and mutable.<p>
   * If a date is already present, the second Setting will be ignored.<p>
   * If a date is present in an immutable setting without dates, the date will be ignored.<p>
   * Values of immutable settings are frozen.<p>
   *
   * @param {{scenario?: string[], unit?: string[], name: string, date?: Date, value: *}[]} p
   * scenario: optional; array of strings (to set more than one scenario); '' means `currentScenario` from constructor<p>
   * unit: Setting unit, optional; array of strings (to set more than one unit); '' means `defaultUnit` from constructor<p>
   * name: Setting name<p>
   * date: optional; if missing will be set to new Date(0)<p>
   * value: Setting value<p>
   * @returns {string[]} array of errors
   * @throws {Error} If a date is already present and the driver is immutable, trying to overwrite it throws
   */
  set (p) {
    // loop input array: add to every item property `throwOnImmutableDriverChange` = true
    p.forEach(item => {
      //@ts-ignore add to every item property `throwOnImmutableDriverChange` = true
      item.throwOnImmutableDriverChange = true;
    });

    // loop `scenario` array; inside the scenario loop, loop `unit` array; add entries with the scenario and unit entries to the new array `p2`
    /** @type {{scenario?: string, unit?: string, name: string, date?: Date, value: *}[]} */
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
          });
        }
      }
    }

    return this.#driversRepo.set(p2);
  }

  /**
   * Get a Setting
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Setting name
   * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method; can't return a date > than today.
   * @param {boolean} [p.throwIfNotDefined] - Optional flag to throw. See @throws for description of this option.
   * @return {*} returns the Setting value;<p>
   * if `endDate` is not defined, returns the value defined before or at `date`;<p>
   * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.<p>
   * Read from Unit, then from Default Unit (if Unit != Default), then from Base Scenario (if Scenario != Base) and same Unit,<p>
   * finally from Base Scenario and Default Unit (if Unit != Default and if Scenario != Base).<p>
   * Returned data is not cloned because Settings are stored with `freezeValues` option = true then the values are deep-frozen.<p>
   * @throws {Error} If `throwIfNotDefined` is true, throws if the Driver to get is not defined. If `search` is true, throws only if the search fails.<p>
   */
  get ({ scenario, unit, name, date, throwIfNotDefined = true }) {
    if (date && date.getTime() > this.#today.getTime()) {
      throw new Error(`Date ${date.toISOString()} is greater than today ${this.#today.toISOString()}`);
    }

    return this.#driversRepo.get({ scenario, unit, name, date, search: true, throwIfNotDefined });
  }

  /**
   * Check if a Setting is defined
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Setting name
   * @return {boolean}
   */
  isDefined ({ scenario, unit, name }) {
    return this.#driversRepo.isDefined({ scenario, unit, name });
  }
}
