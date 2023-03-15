export { DriversRepo };

import { sanitization, validation } from '../deps.js';
import * as STD_NAMES from '../modules/_names/standard_names.js';

class DriversRepo {
  /**
   Map to store Drivers:
   keys are strings made of { scenario, unit, name } (built with `#driversRepoBuildKey` method),
   values are an array of {date: number [1], value: number}  [1] number obtained with `date.getTime()`
   * @type {Map<String, {dateMilliseconds: number, value: number}[]>} */
  #driversRepo;
  /** @type {Date} */
  #today;
  /** @type {string} */
  #currentDebugModuleInfo;  // unused by now

  constructor () {
    this.#driversRepo = new Map();
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
    sanitization.sanitizeObj({
      obj: p,
      sanitization: {
        date: sanitization.DATE_TYPE,  // missing or invalid dates will be set to new Date(0)
        value: sanitization.NUMBER_TYPE
      }
    });

    // loop all entries, saving in a set the keys of the drivers that are not already present
    const _keysToAdd = new Set();
    for (const _item of p) {
      const _key = this.#driversRepoBuildKey({ scenario: _item.scenario, unit: _item.unit, name: _item.name });
      if (!(this.#driversRepo.has(_key)))
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
    const _key = this.#driversRepoBuildKey({ scenario, unit, name });

    if (!this.#driversRepo.has(_key))
      return undefined;

    const _driver = this.#driversRepo.get(_key);
    if (!_driver)
      return undefined;

    if (date === undefined || date === null)
      return _driver[0].value;

    const _date = sanitization.sanitize({ value: date, sanitization: sanitization.DATE_TYPE });  // missing or invalid dates will be set to new Date(0)

    const _dateMilliseconds = _date.getTime();  // date to search for
    let _ret = undefined;

    // search for the right Driver, saving the date closest (but not greater) to the requested date
    for (const _item of _driver) {
      if (_item.dateMilliseconds <= _dateMilliseconds)
        _ret = _item.value;
    }

    return _ret;
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
      sanitization: { scenario: sanitization.STRING_TYPE, unit: sanitization.STRING_TYPE, name: sanitization.STRING_TYPE },
      validate: true
    });
    if (_p.scenario === '') _p.scenario = STD_NAMES.Scenario.BASE;
    return JSON.stringify({
      scenario: _p.scenario.trim().toLowerCase(),
      unit: _p.unit.trim().toLowerCase(),
      name: _p.name.trim().toLowerCase()
    });
  }

  //#endregion private methods
}
