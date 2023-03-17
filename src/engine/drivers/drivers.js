export { Drivers };

import { DriversRepo } from '../../lib/drivers_repo.js';
import { sanitization, validation } from '../../deps.js';

class Drivers {
  /** @type {DriversRepo} */
  #driversRepo;

  constructor () {
    this.#driversRepo = new DriversRepo();
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
   *
   * @param {{scenario?: string, unit: string, name: string, date?: Date, value: number}[]} p
   * scenario: optional; default is SCENARIO.BASE ('base' by now); scenario can be null, undefined or '' meaning 'base'
   * unit: Driver unit
   * name: Driver name
   * date: optional; if missing will be set to new Date(0)
   * value: Driver value
   */
  set (p) {
    this.#driversRepo.set(p);
  }

  /**
   * Get a Driver
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; default is SCENARIO.BASE ('base' by now); scenario can be null, undefined or '' meaning 'base'
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] - Optional date; if missing, returns first value; if found returns the value closest (but not greater) to the requested date
   * @return {undefined|number} Driver; if not found, returns undefined
   */
  get ({ scenario, unit, name, date }) {
    return this.#driversRepo.get({ scenario, unit, name, date });
  }
}
