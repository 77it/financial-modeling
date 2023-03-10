export { Settings };

import { sanitization, validation } from '../../deps.js';
import * as STD_NAMES from '../../modules/_names/standard_names.js';
import * as SETTINGS_NAMES from './settings_names.js';

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
   * unit: optional; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * name: Setting name
   * date: optional; if missing will be set to new Date(0)
   * value: Setting value
   */
  set (p) {
    sanitization.sanitizeObj({
      obj: p,
      sanitization: {
        date: sanitization.DATE_TYPE,  // missing or invalid dates will be set to new Date(0)
        value: sanitization.ANY_TYPE
      }
    });

    // loop all entries, saving in a set the keys of the drivers that are not already present
    const _keysToAdd = new Set();
    for (const _item of p) {
      const _key = this.#settingsRepoBuildKey({ unit: _item.unit, name: _item.name });
      if (!(this.#settingsRepo.has(_key)))
        _keysToAdd.add(_key);
    }

    // loop all entries, adding only the drivers in the set
    for (const _inputItem of p) {
      const _key = this.#driversRepoBuildKey({ scenario: _inputItem.scenario, unit: _inputItem.unit, name: _inputItem.name });

      if (_keysToAdd.has(_key)) {
        if (!(this.#driversRepo.has(_key))) {
          this.#driversRepo.set(_key, [{ dateMilliseconds: _inputItem.date?.getTime() ?? 0, value: _inputItem.value }]);
        } else {
          const _dateMilliseconds = _inputItem.date?.getTime() ?? 0;
          const _driver = this.#driversRepo.get(_key);
          if (_driver)
          {
            let _toAppendFlag = true;
            // loop _driver array:
            // 1) if the date is already present don't add it (ignore it) and set _toAppendFlag to false
            // 2) if the date is not present insert date and value at the right position between other dates and set _toAppendFlag to false
            // 3) if _toAppendFlag is still true, append date and value at the end of the array
            for (let i = 0; i < _driver.length; i++) {
              if (_driver[i].dateMilliseconds === _dateMilliseconds){
                _toAppendFlag = false;
                break;
              }

              if (_driver[i].dateMilliseconds > _dateMilliseconds){
                _driver.splice(i, 0, { dateMilliseconds: _dateMilliseconds, value: _inputItem.value });
                _toAppendFlag = false;
                break;
              }
            }
            if (_toAppendFlag)
              _driver.push({ dateMilliseconds: _dateMilliseconds, value: _inputItem.value });
          }
        }
      }
    }
  }

  // TODO UPDATE
  /**
   * Get a Setting
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * @param {string} p.name - Setting name
   * @param {Date} [p.date] - Optional date; if missing, returns first value; if found returns the value closest (but not greater) to the requested date
   * @return {undefined|*} Setting; if not found, returns undefined
   */
  get ({ scenario, unit, name, date }) {
    const _key = this.#driversRepoBuildKey({ scenario, unit, name });

    if (!this.#driversRepo.has(_key))
      return undefined;

    const _driver = this.#driversRepo.get(_key);
    if (!_driver)
      return undefined;

    if ((date === undefined || date === null))
      return _driver[0].value;

    const _date = sanitization.sanitize({ value: date, sanitization: sanitization.DATE_TYPE });  // missing or invalid dates will be set to new Date(0)

    const _dateMilliseconds = _date.getTime();  // date to search for
    let _ret = undefined;

    // search for the right Setting, saving the date closest (but not greater) to the requested date
    for (const _item of _driver) {
      if (_item.dateMilliseconds <= _dateMilliseconds)
        _ret = _item.value;
    }

    return _ret;
  }

  //#region private methods
  /**
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * @param {string} p.name - Driver name
   * @return {string}
   */
  #settingsRepoBuildKey ({ unit, name }) {
    const _p = sanitization.sanitizeObj({
      obj: { unit, name },
      sanitization: { unit: sanitization.STRING_TYPE, name: sanitization.STRING_TYPE },
      validate: true
    });
    if (_p.name === '') _p.name = STD_NAMES.Simulation.NAME;
    return JSON.stringify({
      unit: _p.unit.trim().toLowerCase(),
      name: _p.name.trim().toLowerCase()
    });
  }

  //#endregion private methods
}
