export { Drivers };

import { sanitization, validation } from '../../deps.js';
import * as STD_NAMES from '../../modules/_names/standardnames.js';

// TODO

class Drivers {
  /**
   Map to store Drivers:
   keys are strings made of { scenario, unit, name } (built with `#driversRepoBuildKey` method),
   values are an array of {date: number [1], value: number}  [1] number obtained with `date.getTime()`
   * @type {Map<String, {date: number, value: number}[]>} */
  #driversRepo;
  /** @type {string} */
  #currentDebugModuleInfo;

  constructor () {
    this.#driversRepo = new Map();
    this.#currentDebugModuleInfo = '';
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitization.sanitize({ value: debugModuleInfo, sanitization: sanitization.STRING_TYPE });
  }

  /**
   * Set a Driver
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; default is SCENARIO.BASE ('base' by now); scenario can be null, undefined or '' meaning 'base'
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] Date is optional, if missing will be set to new Date(0)
   * @param {number} p.value - Driver value
   * @return {boolean} true if Driver is set, false if Driver is already defined
   */
  set ({ scenario, unit, name, date, value }) {
    const _p = sanitization.sanitizeObj({
      obj: { scenario, unit, name, date, value },
      sanitization: {
        scenario: sanitization.STRING_TYPE,
        unit: sanitization.STRING_TYPE,
        name: sanitization.STRING_TYPE,
        date: sanitization.DATE_TYPE,  // missing or invalid dates will be set to new Date(0)
        value: sanitization.NUMBER_TYPE
      }
    });
    const _key = this.#driversRepoBuildKey({ scenario, unit, name });
    if (!(this.#driversRepo.has(_key))) {
      this.#driversRepo.set(_key, [{ date: _p.date.getTime(), value: _p.value }]);
    } else {
      const _driver = this.#driversRepo.get(_key);
      // loop driver entries to see if the date is already present; if so, don't add it and return false
      for (const _d of _driver) {
        if (_d.date === _p.date.getTime())
          return false;
      }

      // TODO
      // loop _driver array and insert date and value at the right position between other dates
      throw new Error('not implemented');
    }
    return true;
  }

  /**
   * Get a Driver
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; default is SCENARIO.BASE ('base' by now); scenario can be null, undefined or '' meaning 'base'
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] - Optional date; if missing, returns first value
   * @return {undefined|number} Driver; if not found, returns undefined
   */
  get ({ scenario, unit, name, date }) {
    const _key = this.#driversRepoBuildKey({ scenario, unit, name });
    if (!this.#driversRepo.has(_key))
      return undefined;
    const _driver = this.#driversRepo.get(_key);
    // TODO return the right value, with the date closest to the requested date
  }

  //#region private methods
  /**
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; default is SCENARIO.BASE ('base' by now); scenario can be null, undefined or '' meaning 'base'
   * @param {string} p.unit - Driver unit
   * @param {string} p.name - Driver name
   * @return {string}
   */
  #driversRepoBuildKey ({ scenario, unit, name }) {
    const _p = sanitization.sanitizeObj({
      obj: { scenario, unit, name },
      sanitization: { scenario: sanitization.STRING_TYPE, unit: sanitization.STRING_TYPE, name: sanitization.STRING_TYPE }
    });
    if (_p.scenario === '') _p.scenario = STD_NAMES.SCENARIO.BASE;
    return JSON.stringify({ scenario: _p.scenario, unit: _p.unit, name: _p.name });
  }

  //#endregion private methods
}
