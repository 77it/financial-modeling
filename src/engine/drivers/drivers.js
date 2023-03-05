export { Drivers };

import { ModuleData } from '../modules/module_data.js';

// TODO

class Drivers {
  /** Map to store Drivers: XXX id as string key, {date: date, value: *}[] array as value. Driver with only one element will have date = new Date(0).
   * @type {Map<String, *>} */
  #driversRepo;
  /** @type {null|ModuleData} */
  #currentModuleData;

  constructor () {
    this.#driversRepo = new Map();
    this.#currentModuleData = null;
  }

  /** @param {ModuleData} moduleData */
  setCurrentModuleData (moduleData) {
    this.#currentModuleData = moduleData;
  }

  /**
   * Set a Driver
   * @param {Object} p
   * @param {string} [p.scenario='base'] - Optional scenario
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] - Optional date; if missing will be set to new Date(0)
   * @param {number} p.value - Driver value
   */
  driverSet ({ scenario = 'base', unit, name, date, value }) {
    // TODO not implemented
    throw new Error('not implemented');
  }

  /**
   * Get a Driver
   * @param {Object} p
   * @param {string} [p.scenario='base'] - Optional scenario
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] - Optional date; if missing, returns first value
   * @return {undefined|number} Driver; if not found, returns undefined
   */
  driverGet ({ scenario = 'base', unit, name, date }) {
    // TODO not implemented
    throw new Error('not implemented');
  }

  //#region private methods
  /** @returns {string} */
  #getDebugModuleInfo () {
    return `moduleName: '${this.#currentModuleData?.moduleName}', moduleEngineURI: '${this.#currentModuleData?.moduleEngineURI}', moduleSourceLocation: '${this.#currentModuleData?.moduleSourceLocation}'`;
  }
  //#endregion private methods
}
