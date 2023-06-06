export { Settings };

import { DriversRepo } from '../../lib/drivers_repo.js';
import * as sanitization from '../../lib/sanitization_utils.js';

class Settings {
  /** @type {DriversRepo} */
  #driversRepo;

  /**
   * Class to store and retrieve Simulation Settings
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
      sanitizationType: sanitization.ANY_TYPE,
      prefix__immutable_without_dates,
      prefix__immutable_with_dates,
      allowMutable: true
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
  set (p) {
    this.#driversRepo.set(p);
  }

  /**
   * Get a Setting
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Setting unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Setting name
   * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method
   * @return {undefined|*} Setting; if not found, returns undefined;
   * if `endDate` is not defined, returns the value defined before or at `date`;
   * if `endDate` is defined, returns a value applying the `calc` function to the values defined between `date` and `endDate`.
   * Read from Unit, then from Default Unit (if Unit != Default), then from Base Scenario (if Scenario != Base) and same Unit,
   * finally from Base Scenario and Default Unit (if Unit != Default and if if Scenario != Base)
   */
  get ({ scenario, unit, name, date }) {
      return this.#driversRepo.get({ scenario, unit, name, date, search: true });
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
