export { Settings };

import { sanitization, validation } from '../../deps.js';

// TODO run tests

class Settings {
  /**
   Map to store Settings:
   keys are strings made of { unit, name } (built with `#settingsRepoBuildKey` method),
   values are an array of {date: number [1], value: *}  [1] number obtained with `date.getTime()`
   * @type {Map<String, {dateMilliseconds: number, value: *}[]>} */
  #settingsRepo;
  /** @type {Date} */
  #today;
  /** @type {string} */
  #currentDebugModuleInfo;  // unused by now

  constructor () {
    this.#settingsRepo = new Map();
    this.#currentDebugModuleInfo = '';
    this.#today = new Date(0);
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitization.sanitize({ value: debugModuleInfo, sanitization: sanitization.STRING_TYPE });
  }

  /** @param {Date} today */
  setToday (today) {
    validation.validate({ value: today, validation: validation.DATE_TYPE });
    this.#today = today;
  }

  // TODO UPDATE
  /**
   * Set Settings from an array of units, names, dates and values.
   * Settings are immutable.
   * If a date is already present, the second one will be ignored.
   *
   * @param {{unit?: string, name: string, date?: Date, value: number}[]} p
   * unit: optional
   * name: Setting name
   * date: optional; if missing will be set to new Date(0)
   * value: Setting value
   */
  set (p) {
  }

  // TODO UPDATE
  /**
   * Get a Setting
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit
   * @param {string} p.name - Setting name
   * @param {Date} [p.date] - Optional date; if missing, returns first value; if found returns the value closest (but not greater) to the requested date
   * @return {undefined|*} Setting; if not found, returns undefined
   */
  get ({ unit, name, date }) {
    return 99;
  }
}
