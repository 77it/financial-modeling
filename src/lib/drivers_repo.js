export { DriversRepo };

import * as schema from './schema.js';
import { sanitize, sanitizeObj } from './schema_sanitization_utils.js';
import { validate } from './schema_validation_utils.js';
import { stripTimeToLocalDate, localDateToStringYYYYMMDD } from './date_utils.js';
import { parseJSON5 } from './json5.js';
import { isNullOrWhiteSpace } from './string_utils.js';
import { deepFreeze } from './obj_utils.js';

// This is a base class used to build Settings and Drivers repositories
class DriversRepo {
  /**
   Map to store Drivers:
   keys are strings made of { scenario, unit, name } (built with `#driversRepoBuildKey` method),
   values are an array of {date: number [1], value: number} ordered by date
   [1] number obtained with `date.getTime()`
   * @type {Map<string, {dateMilliseconds: number, value: number}[]>} */
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
  #sanitizationType;
  /** @type {string} */
  #prefix__immutable_without_dates;
  /** @type {string} */
  #prefix__immutable_with_dates;
  /** @type {boolean} */
  #allowMutable;
  /** @type {boolean} */
  #freezeValues;
  /** @type {Date} */
  #today;

  /**
   * @param {Object} p
   * @param {string} p.baseScenario
   * @param {string} p.currentScenario
   * @param {string} p.defaultUnit
   * @param {string} p.sanitizationType
   * @param {string} p.prefix__immutable_without_dates
   * @param {string} p.prefix__immutable_with_dates
   * @param {boolean} p.allowMutable
   * @param {boolean} p.freezeValues  Option to freeze values; we don't use StructuredClone because it doesn't work well with Classes instances
   */
  constructor ({
    baseScenario,
    currentScenario,
    defaultUnit,
    sanitizationType,
    prefix__immutable_without_dates,
    prefix__immutable_with_dates,
    allowMutable,
    freezeValues
  }) {
    this.#baseScenario = sanitize({ value: baseScenario, sanitization: schema.STRING_TYPE, validate: true });
    this.#currentScenario = sanitize({ value: currentScenario, sanitization: schema.STRING_TYPE, validate: true });
    this.#defaultUnit = sanitize({ value: defaultUnit, sanitization: schema.STRING_TYPE, validate: true });
    this.#sanitizationType = sanitize({ value: sanitizationType, sanitization: schema.STRING_TYPE, validate: true });

    this.#prefix__immutable_without_dates = sanitize({ value: prefix__immutable_without_dates, sanitization: schema.STRING_TYPE, validate: true });
    this.#prefix__immutable_with_dates = sanitize({ value: prefix__immutable_with_dates, sanitization: schema.STRING_TYPE, validate: true });
    // test that prefix__immutable_with_dates does not start with prefix__immutable_without_dates
    if (this.#prefix__immutable_with_dates.startsWith(this.#prefix__immutable_without_dates)) {
      throw new Error(`prefix__immutable_with_dates (${this.#prefix__immutable_with_dates}) cannot start with prefix__immutable_without_dates (${this.#prefix__immutable_without_dates})`);
    }
    this.#allowMutable = sanitize({ value: allowMutable, sanitization: schema.BOOLEAN_TYPE, validate: true });
    this.#freezeValues = sanitize({ value: freezeValues, sanitization: schema.BOOLEAN_TYPE, validate: true });

    this.#driversRepo = new Map();
    this.#currentDebugModuleInfo = '';
    this.#today = new Date(0);
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitize({ value: debugModuleInfo, sanitization: schema.STRING_TYPE });
  }

  /** @param {Date} today */
  setToday (today) {
    validate({ value: today, validation: schema.DATE_TYPE });
    this.#today = today;
  }

  /**
   * Set Drivers from an array of scenarios, units, names, dates and value.<p>
   * Drivers can be immutable without dates, immutable with dates and mutable.<p>
   * If a date is already present, the second one will be ignored.<p>
   * If a date is present in an immutable driver without dates, the date will be ignored.<p>
   *
   * @param {{scenario?: string, unit?: string, name: string, date?: Date, value: *}[]} p
   * scenario: Scenario name, optional; null, undefined or '' means `currentScenario` from constructor<p>
   * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor<p>
   * name: Driver name<p>
   * date: optional; if missing will be set to new Date(0)<p>
   * value: Driver value<p>
   * @returns {string[]} array of errors
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
      // shallow clone _inputItem, to build a new object and be able to add properties to it without changing the original object (doesn't clone the properties of the object, only creates a new object with the same properties)
      const _inputItemClone = { ..._inputItem };

      // sanitize the input object, only fields `date` and `value`
      sanitizeObj({
        obj: _inputItemClone,
        sanitization: {
          date: schema.DATE_TYPE,  // missing or invalid dates will be set to new Date(0)
          value: this.#sanitizationType
        }
      });

      // if date is not present, set it to new Date(0); if date is present, strip the time part from the date (if the date is != Date(0))
      // (check for `_inputItemClone?.date` because typescript can't understand that `sanitizeObj` sanitize invalid dates)
      _inputItemClone.date = (_inputItemClone?.date && _inputItemClone?.date.getTime() !== 0) ? stripTimeToLocalDate(_inputItemClone?.date) : new Date(0);

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

      // if the driver is immutable and the key is already present in the repo, skip loop cycle
      if (_isImmutable && _keysAlreadyDefinedBeforeSet.has(_key)) {
        arrayOfErrors.push(`Driver ${_key} is immutable and it is already present`);
        continue;
      }

      // if the driver has date different from Date(0) and the driver is immutable without dates, reset the date to Date(0)
      if (_isImmutableWithoutDates && _inputItemClone.date?.getTime() !== 0) {
        _inputItemClone.date = new Date(0);
      }

      // if the flag `freezeValues` is true, deep freeze the value
      if (this.#freezeValues) {
        deepFreeze(_inputItemClone.value);
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
                arrayOfErrors.push(`Driver ${_key} is immutable and the date ${localDateToStringYYYYMMDD(_inputItemClone.date)} is already present`);
              _toAppendFlag = false;
              break;
            } else if (_driver[i].dateMilliseconds > _dateMilliseconds) {
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
   * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method
   * @param {Date} [p.endDate] - Optional end date; if missing the search is done only for `date`
   * @param {boolean} [p.parseAsJSON5=false] - Optional flag to parse the value as JSON5
   * @param {string|string[]|Object} [p.sanitizationType] - Optional type for value sanitization (can be string, array of string, object)
   * @param {boolean} [p.search=false] - Optional flag to search for recursive search of the driver:
   * read from Unit, then from Default Unit (if Unit != Default), then from Base Scenario (if Scenario != Base) and same Unit,
   * finally from Base Scenario and Default Unit (if Unit != Default and if Scenario != Base)
   * @return {undefined|*|*[]} Driver; if not found, returns undefined;
   * if `endDate` is not defined, returns the value defined before or at `date`;
   * if `endDate` is defined, returns an array of values defined between `date` and `endDate`.
   * Returned data is not cloned, but with `freezeValues` option = true the values are deep frozen.
   */
  get ({ scenario, unit, name, date, endDate, parseAsJSON5 = false, sanitizationType, search = false }) {
    let _key = this.#driversRepoBuildKey({ scenario, unit, name });
    if (!this.#driversRepo.has(_key)) {
      if (!search)
        return undefined;
      else {
        const _baseScenario = this.#baseScenario;
        const _defaultUnit = this.#defaultUnit;
        let _foundFlag = false;
        // search from Default Unit (if Unit != Default)
        if (unit !== _defaultUnit) {
          _key = this.#driversRepoBuildKey({ scenario, unit: _defaultUnit, name });
          if (this.#driversRepo.has(_key))
            _foundFlag = true;
        }

        // search from Base Scenario (if Scenario != Base) and same Unit
        if (!_foundFlag && scenario !== _baseScenario) {
          _key = this.#driversRepoBuildKey({ scenario: _baseScenario, unit, name });
          if (this.#driversRepo.has(_key))
            _foundFlag = true;
        }

        // search from Base Scenario and Default Unit (if Unit != Default and if Scenario != Base)
        if (!_foundFlag && scenario !== _baseScenario && unit !== _defaultUnit) {
          _key = this.#driversRepoBuildKey({ scenario: _baseScenario, unit: _defaultUnit, name });
          if (this.#driversRepo.has(_key))
            _foundFlag = true;
        }

        if (!_foundFlag)
          return undefined;
      }
    }

    const _driver = this.#driversRepo.get(_key);
    if (!_driver)
      return undefined;

    // missing dates will be set to this.#today
    let _date = (date === undefined || date === null) ? this.#today : date;
    // invalid date will be set to new Date(0)
    _date = sanitize({ value: _date, sanitization: schema.DATE_TYPE });
    // strip the time part from the date (if the date is != Date(0))
    _date = (_date.getTime() !== 0) ? stripTimeToLocalDate(_date) : _date;

    // if `endDate` is not defined, returns the value defined before or at `date`
    if (endDate === undefined || endDate === null) {
      const _dateMilliseconds = _date.getTime();  // date to search for
      let _ret = undefined;

      // search for the right Driver, saving the date closest (but not greater) to the requested date
      for (const _item of _driver) {
        // data is ordered by date, so if the date is greater than the requested date, break
        if (_item.dateMilliseconds > _dateMilliseconds)
          break;
        _ret = _item.value;
      }

      // parse as JSON5 if requested
      const _parsedValue = (parseAsJSON5) ? parseJSON5(_ret) : _ret;

      // sanitize the value if requested
      if (isNullOrWhiteSpace(sanitizationType))
        return _parsedValue;
      else if (typeof sanitizationType === 'string' || Array.isArray(sanitizationType) || typeof sanitizationType === 'function')
        return sanitize({ value: _parsedValue, sanitization: sanitizationType });
      else if (typeof sanitizationType === 'object')
        return sanitizeObj({ obj: _parsedValue, sanitization: sanitizationType });
    }
    // if `endDate` is defined, returns an array of values defined between `date` and `endDate`
    else {
      // invalid date will be set to new Date(0)
      let _endDate = sanitize({ value: endDate, sanitization: schema.DATE_TYPE });
      // strip the time part from the date (if the date is != Date(0))
      _endDate = (_endDate.getTime() !== 0) ? stripTimeToLocalDate(_endDate) : _endDate;
      // if `endDate` is lower than `date`, invert the two dates
      if (_endDate.getTime() < _date.getTime())
        [_date, _endDate] = [_endDate, _date];

      const _dateMilliseconds = _date.getTime();  // date to search for
      const _endDateMilliseconds = _endDate.getTime();  // date to search for
      let _retArray = [];

      // save all drivers between `_dateMilliseconds` and `_endDateMilliseconds`
      for (const _item of _driver) {
        if (_item.dateMilliseconds >= _dateMilliseconds && _item.dateMilliseconds <= _endDateMilliseconds)
          _retArray.push(_item.value);
      }

      // parse all elements contained in the _retArray as JSON5 if requested
      if (parseAsJSON5)
        _retArray = _retArray.map(_item => parseJSON5(_item));

      // sanitize the value if requested
      if (isNullOrWhiteSpace(sanitizationType))
        return _retArray;
      else if (typeof sanitizationType === 'string' || Array.isArray(sanitizationType) || typeof sanitizationType === 'function')
        return _retArray.map(_item => sanitize({ value: _item, sanitization: sanitizationType }));
      else if (typeof sanitizationType === 'object')
        return _retArray.map(_item => sanitizeObj({ obj: _item, sanitization: sanitizationType }));
    }
  }

  /**
   * Check if a Driver is defined
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Driver name
   * @return {boolean}
   */
  isDefined ({ scenario, unit, name }) {
    return this.#driversRepo.has(this.#driversRepoBuildKey({ scenario, unit, name }));
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
    const _p = sanitizeObj({
      obj: { scenario, unit, name },
      sanitization: { scenario: schema.STRING_TYPE, unit: schema.STRING_TYPE, name: schema.STRING_TYPE },
      validate: true
    });

    if (isNullOrWhiteSpace(_p.scenario)) _p.scenario = this.#currentScenario;
    if (isNullOrWhiteSpace(_p.unit)) _p.unit = this.#defaultUnit;

    return JSON.stringify({
      scenario: _p.scenario.trim().toLowerCase(),
      unit: _p.unit.trim().toLowerCase(),
      name: _p.name.trim().toLowerCase()
    });
  }

  //#endregion private methods
}
