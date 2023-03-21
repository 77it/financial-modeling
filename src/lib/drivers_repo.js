﻿export { DriversRepo };

import { sanitization, validation, toDateYYYYMMDD, toStringYYYYMMDD, parseJSON5 } from '../deps.js';

class DriversRepo {
  /**
   Map to store Drivers:
   keys are strings made of { scenario, unit, name } (built with `#driversRepoBuildKey` method),
   values are an array of {date: number [1], value: number}  [1] number obtained with `date.getTime()`
   * @type {Map<String, {dateMilliseconds: number, value: number}[]>} */
  #driversRepo;
  /** @type {string} */
  #currentScenario;
  /** @type {string} */
  #baseScenario;
  /** @type {string} */
  #defaultUnit;
  /** @type {string} */
  #currentDebugModuleInfo;  // unused by now
  /** @type {string} */
  #typeForValueSanitization;
  /** @type {string} */
  #prefix__immutable_without_dates;
  /** @type {string} */
  #prefix__immutable_with_dates;
  /** @type {boolean} */
  #allowMutable;
  /** @type {Date} */
  #today;

  /**
   * @param {Object} p
   * @param {string} p.baseScenario
   * @param {string} p.currentScenario
   * @param {string} p.defaultUnit
   * @param {string} p.typeForValueSanitization
   * @param {string} p.prefix__immutable_without_dates
   * @param {string} p.prefix__immutable_with_dates
   * @param {boolean} p.allowMutable
   */
  constructor ({
    baseScenario,
    currentScenario,
    defaultUnit,
    typeForValueSanitization,
    prefix__immutable_without_dates,
    prefix__immutable_with_dates,
    allowMutable
  }) {
    this.#baseScenario = sanitization.sanitize({ value: baseScenario, sanitization: sanitization.STRING_TYPE });
    this.#currentScenario = sanitization.sanitize({ value: currentScenario, sanitization: sanitization.STRING_TYPE });
    this.#defaultUnit = sanitization.sanitize({ value: defaultUnit, sanitization: sanitization.STRING_TYPE });
    this.#typeForValueSanitization = sanitization.sanitize({ value: typeForValueSanitization, sanitization: sanitization.STRING_TYPE });

    this.#prefix__immutable_without_dates = sanitization.sanitize({ value: prefix__immutable_without_dates, sanitization: sanitization.STRING_TYPE });
    this.#prefix__immutable_with_dates = sanitization.sanitize({ value: prefix__immutable_with_dates, sanitization: sanitization.STRING_TYPE });
    // test that prefix__immutable_with_dates does not start with prefix__immutable_without_dates
    if (this.#prefix__immutable_with_dates.startsWith(this.#prefix__immutable_without_dates)) {
      throw new Error(`prefix__immutable_with_dates (${this.#prefix__immutable_with_dates}) cannot start with prefix__immutable_without_dates (${this.#prefix__immutable_without_dates})`);
    }
    this.#allowMutable = sanitization.sanitize({ value: allowMutable, sanitization: sanitization.BOOLEAN_TYPE });

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
   * @param {{scenario?: string, unit?: string, name: string, date?: Date, value: *}[]} p
   * @returns {string[]} array of errors
   * scenario: Scenario name, optional; null, undefined or '' means `currentScenario` from constructor
   * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * name: Driver name
   * date: optional; if missing will be set to new Date(0)
   * value: Driver value
   */
  set (p) {
    /** @type {string[]} */
    const arrayOfErrors = [];

    // loop all entries, saving in a set the keys of the drivers that are not already present
    const _keysAlreadyDefinedBeforeSet = new Set();
    for (const _item of p) {
      const _key = this.#driversRepoBuildKey({ scenario: _item.scenario, unit: _item.unit, name: _item.name });
      if (this.#driversRepo.has(_key))
        _keysAlreadyDefinedBeforeSet.add(_key);
    }

    // loop all entries, adding only the drivers in the set
    for (const _inputItem of p) {
      // shallow clone _inputItem
      const _inputItemClone = { ..._inputItem };

      // sanitize the input object, only fields `date` and `value`
      sanitization.sanitizeObj({
        obj: _inputItemClone,
        sanitization: {
          date: sanitization.DATE_TYPE,  // missing or invalid dates will be set to new Date(0)
          value: this.#typeForValueSanitization
        }
      });

      // strip the time part from the date (if the date is != Date(0))
      // (check for `_inputItemClone?.date` because typescript can't understand that `sanitizeObj` sanitize invalid dates)
      _inputItemClone.date = (_inputItemClone?.date && _inputItemClone?.date.getTime() !== 0) ? toDateYYYYMMDD(_inputItemClone?.date) : new Date(0);

      const _key = this.#driversRepoBuildKey({ scenario: _inputItemClone.scenario, unit: _inputItemClone.unit, name: _inputItemClone.name });

      // determine if the current item is immutable or not
      const _isImmutableWithoutDates = _inputItemClone.name.trim().startsWith(this.#prefix__immutable_without_dates);
      /* unused flag, by now */
      const _isImmutableWithDates = (!_isImmutableWithoutDates && _inputItemClone.name.startsWith(this.#prefix__immutable_with_dates));
      const _isImmutable = _inputItemClone.name.trim().startsWith(this.#prefix__immutable_without_dates) || _inputItemClone.name.startsWith(this.#prefix__immutable_with_dates);
      const _isMutable = !_isImmutable;

      // if the driver is mutable and this is not allowed, skip loop cycle
      if (_isMutable && !this.#allowMutable) {
        arrayOfErrors.push(`Driver ${_key} is mutable and this is not allowed`);
        continue;
      }

      // if the driver has date different from Date(0) and this is not allowed, skip loop cycle
      if (_isImmutableWithoutDates && _inputItemClone.date?.getTime() !== 0) {
        arrayOfErrors.push(`Driver ${_key} is immutable without dates and the date is not Date(0)`);
        continue;
      }

      // if the driver is immutable and the key is already present in the repo, skip loop cycle
      if (_isImmutable && _keysAlreadyDefinedBeforeSet.has(_key)) {
        arrayOfErrors.push(`Driver ${_key} is immutable and it is already present`);
        continue;
      }

      if (!(this.#driversRepo.has(_key))) {
        this.#driversRepo.set(_key, [{ dateMilliseconds: _inputItemClone.date?.getTime() ?? 0, value: _inputItemClone.value }]);
      } else {
        const _dateMilliseconds = _inputItemClone.date?.getTime() ?? 0;
        const _driver = this.#driversRepo.get(_key);
        if (_driver) {
          let _toAppendFlag = true;
          // loop _driver array:
          // 1) if the date is already present
          //    1.1) if `_isImmutable` don't add it (ignore it) and set _toAppendFlag to false
          //    1.2) if `_isMutable` replace the value and set _toAppendFlag to false
          // 2) if the date is not present insert date and value at the right position between other dates and set _toAppendFlag to false
          // 3) if _toAppendFlag is still true, append date and value at the end of the array
          for (let i = 0; i < _driver.length; i++) {
            if (_driver[i].dateMilliseconds === _dateMilliseconds) {
              if (_isMutable)
                _driver[i].value = _inputItemClone.value;
              else
                arrayOfErrors.push(`Driver ${_key} is immutable and the date ${toStringYYYYMMDD(_inputItemClone.date)} is already present`);
              _toAppendFlag = false;
              break;
            }

            if (_driver[i].dateMilliseconds > _dateMilliseconds) {
              _driver.splice(i, 0, { dateMilliseconds: _dateMilliseconds, value: _inputItemClone.value });
              _toAppendFlag = false;
              break;
            }
          }

          if (_toAppendFlag)
            _driver.push({ dateMilliseconds: _dateMilliseconds, value: _inputItemClone.value });
        }
      }
    }

    return arrayOfErrors;
  }

  /**
   * Get a Driver
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] - Optional date; if missing is the date set with `setToday` method; if found returns the value closest (but not greater) to the requested date
   * @param {boolean} [p.parseAsJSON5] - Optional flag to parse the value as JSON5
   * @return {undefined|*} Driver; if not found, returns undefined
   */
  get ({ scenario, unit, name, date, parseAsJSON5 }) {
    const _key = this.#driversRepoBuildKey({ scenario, unit, name });

    if (!this.#driversRepo.has(_key))
      return undefined;

    const _driver = this.#driversRepo.get(_key);
    if (!_driver)
      return undefined;

    // missing dates will be set to this.#today
    let _date = (date === undefined || date === null) ? this.#today : date;
    // invalid dates will be set to new Date(0)
    _date = sanitization.sanitize({ value: _date, sanitization: sanitization.DATE_TYPE });
    // strip the time part from the date (if the date is != Date(0))
    _date = (_date.getTime() !== 0) ? toDateYYYYMMDD(_date) : _date;

    const _dateMilliseconds = _date.getTime();  // date to search for
    let _ret = undefined;

    // search for the right Driver, saving the date closest (but not greater) to the requested date
    for (const _item of _driver) {
      if (_item.dateMilliseconds <= _dateMilliseconds)
        _ret = _item.value;
    }

    if (parseAsJSON5)
      return parseJSON5(_ret);
    else
      return _ret;
  }

  //#region private methods
  /**
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Driver name
   * @return {string}
   */
  #driversRepoBuildKey ({ scenario, unit, name }) {
    const _p = sanitization.sanitizeObj({
      obj: { scenario, unit, name },
      sanitization: { scenario: sanitization.STRING_TYPE, unit: sanitization.STRING_TYPE, name: sanitization.STRING_TYPE },
      validate: true
    });

    if (_p.scenario === '') _p.scenario = this.#currentScenario;
    if (_p.unit === '') _p.unit = this.#defaultUnit;

    return JSON.stringify({
      scenario: _p.scenario.trim().toLowerCase(),
      unit: _p.unit.trim().toLowerCase(),
      name: _p.name.trim().toLowerCase()
    });
  }

  //#endregion private methods
}
