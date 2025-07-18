﻿export { DriversRepo };

import * as schema from './schema.js';
import { sanitize } from './schema_sanitization_utils.js';
import { RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS } from '../config/engine.js';
import { validate } from './schema_validation_utils.js';
import { stripTimeToLocalDate, localDateToStringYYYYMMDD, addDaysToLocalDate } from './date_utils.js';
import { isNullOrWhiteSpace } from './string_utils.js';
import { deepFreeze, binarySearch_position_atOrBefore } from './obj_utils.js';

// This is a base class used to build Settings and Drivers repositories
class DriversRepo {
  //#region data structures
  /**
   Map to store Drivers and Settings:
   keys are strings made of { scenario, unit, name } (built with `#driversRepoBuildKey` method),
   values are an array of {date: number [1], value: *} ordered by date
   [1] number obtained with `date.getTime()`
   * @type {Map<string, {dateMilliseconds: number, value: *}[]>} */
  #driversRepo;

  /** Set to store the list of obsolete drivers (the one that have to be generated again).
   Regeneration set again values in the data structures `#firstDates`, `#lastDates`, `#driverDatesBeforeOrExact`, `#driverDatesAfterOrExact`
   * @type {Set<string>} */
  #obsoleteIds;

  /**
   Map to store Drivers and Drivers dates positions in the drivers array got from `#driversRepo`;
   Map <index = DriverID [0]> of Map <index = date (milliseconds) from firstDate to lastDate [1] [2], value = position in array of values of `#driversRepo`>
   [0] built with `#driversRepoBuildKey` method
   [1] for each dates in this map, the saved position in the array points to a date that is before or equal to the date in the key;
   [2] number obtained with `date.getTime()`
   * @type {Map<string, Map<number, number>>} */
  #driverDatesBeforeOrExact;

  /**
   Map to store Drivers and Drivers dates positions in the drivers array got from `#driversRepo`;
   Map <index = DriverID [0]> of Map <index = date (milliseconds) from firstDate to lastDate [1] [2], value = position in array of values of `#driversRepo`>
   [0] built with `#driversRepoBuildKey` method
   [1] for each dates in this map, the saved position in the array points to a date that is after or equal to the date in the key;
   [2] number obtained with `date.getTime()`
   * @type {Map<string, Map<number, number>>} */
  #driverDatesAfterOrExact;

  /**
   Map to store milliseconds of dates with time not stripped, to get them stripped
   keys are dates milliseconds not stripped, values are milliseconds stripped
   [1] number obtained with `date.getTime()`
   * @type {Map<number, number>} */
  #datesMillisecondsCache;
  //#endregion data structures

  /** @type {string} */
  #currentScenario;
  /** @type {string} */
  #baseScenario;
  /** @type {string} */
  #defaultUnit;
  /** @type {string} */
  #currentDebugModuleInfo;  // unused by now
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
   * @param {string} p.prefix__immutable_without_dates
   * @param {string} p.prefix__immutable_with_dates
   * @param {boolean} p.allowMutable
   * @param {boolean} p.freezeValues  Option to freeze values; we don't use StructuredClone because it doesn't work well with Classes instances
   */
  constructor ({
    baseScenario,
    currentScenario,
    defaultUnit,
    prefix__immutable_without_dates,
    prefix__immutable_with_dates,
    allowMutable,
    freezeValues
  }) {
    this.#baseScenario = sanitize({ value: baseScenario, sanitization: schema.STRING_TYPE, validate: true });
    if (isNullOrWhiteSpace(this.#baseScenario))
      throw new Error('baseScenario cannot be null, undefined or empty');
    this.#currentScenario = sanitize({ value: currentScenario, sanitization: schema.STRING_TYPE, validate: true });
    if (isNullOrWhiteSpace(this.#currentScenario))
      throw new Error('currentScenario cannot be null, undefined or empty');
    this.#defaultUnit = sanitize({ value: defaultUnit, sanitization: schema.STRING_TYPE, validate: true });
    if (isNullOrWhiteSpace(this.#defaultUnit))
      throw new Error('defaultUnit cannot be null, undefined or empty');

    this.#prefix__immutable_without_dates = sanitize({ value: prefix__immutable_without_dates, sanitization: schema.STRING_TYPE, validate: true });
    if (isNullOrWhiteSpace(this.#prefix__immutable_without_dates))
      throw new Error('prefix__immutable_without_dates cannot be null, undefined or empty');
    this.#prefix__immutable_with_dates = sanitize({ value: prefix__immutable_with_dates, sanitization: schema.STRING_TYPE, validate: true });
    if (isNullOrWhiteSpace(this.#prefix__immutable_with_dates))
      throw new Error('prefix__immutable_with_dates cannot be null, undefined or empty');
    // test that prefix__immutable_with_dates does not start with prefix__immutable_without_dates
    if (this.#prefix__immutable_with_dates.startsWith(this.#prefix__immutable_without_dates)) {
      throw new Error(`prefix__immutable_with_dates (${this.#prefix__immutable_with_dates}) cannot start with prefix__immutable_without_dates (${this.#prefix__immutable_without_dates})`);
    }
    this.#allowMutable = sanitize({ value: allowMutable, sanitization: schema.BOOLEAN_TYPE, validate: true });
    this.#freezeValues = sanitize({ value: freezeValues, sanitization: schema.BOOLEAN_TYPE, validate: true });

    this.#driversRepo = new Map();
    this.#obsoleteIds = new Set();
    this.#driverDatesBeforeOrExact = new Map();
    this.#driverDatesAfterOrExact = new Map();
    this.#datesMillisecondsCache = new Map();

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
   * If a date is already present and the driver is immutable (with or without dates), trying to overwrite:
   * - throw an error if `throwOnImmutableDriverChange` is true.<p>
   * - will be ignored otherwise.<p>
   *
   * @param {{scenario?: string, unit?: string, name: string, date?: Date, throwOnImmutableDriverChange?: boolean, value: *}[]} p
   * scenario: Scenario name, optional; null, undefined or '' means `currentScenario` from constructor<p>
   * unit: Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor<p>
   * name: Driver name<p>
   * date: optional; if missing will be set to new Date(0)<p>
   * throwOnImmutableDriverChange: optional, default false; if true, if a date is already present and the driver is immutable, trying to overwrite it throws;
   * value: Driver value<p>
   * @returns {string[]} array of errors
   * @throws {Error} If `throwOnImmutableDriverChange` is true and a date is already present and the driver is immutable, trying to overwrite it throws;
   */
  set (p) {
    /** @type {string[]} */
    const arrayOfErrors = [];

    // loop all entries, saving in a set the keys of the drivers that are already present.
    // this is needed because we won't add drivers already present in the repo before the call to this method;
    // during the method run we add drivers while looping the input array, then if an immutable driver is present in more than
    // one row at some point we'll find it as present, if we will query `this.#driversRepo` at every loop of the input array;
    // instead, using `_keysAlreadyDefinedBeforeSet` we are sure to not add the immutable drivers that were present, as stated,
    // before the call to this method.
    const _keysAlreadyDefinedBeforeSet = new Set();
    for (const _item of p) {
      const _key = this.#driversRepoBuildKey({ scenario: _item.scenario, unit: _item.unit, name: _item.name });
      if (this.#driversRepo.has(_key))
        _keysAlreadyDefinedBeforeSet.add(_key);  // this data structure is needed because we add drivers looping the input array; see above for detailed explanation
    }

    // loop all entries, adding the drivers in the set and updating the others, if not immutable
    for (const _inputItem of p) {
      // shallow clone _inputItem, to build a new object and be able to add properties to it without changing the original object (doesn't clone the properties of the object, only creates a new object with the same properties)
      const _inputItemClone = { ..._inputItem };

      // sanitize the input object; doesn't sanitize `value` because can be anything the user wants
      sanitize({
        value: _inputItemClone,
        sanitization: {
          date: schema.DATE_TYPE,  // missing or invalid dates will be set to new Date(0)
          name: schema.STRING_TYPE,
          scenario: schema.STRING_TYPE + schema.OPTIONAL,
          unit: schema.STRING_TYPE + schema.OPTIONAL
        }
      });

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

      // if the driver is immutable and the key is already present in the repo:
      // - throw an error if `throwOnImmutableDriverChange` is true.
      // - will be ignored otherwise.
      if (_isImmutable && _keysAlreadyDefinedBeforeSet.has(_key)) {
        if (_inputItem.throwOnImmutableDriverChange) {
          throw new Error(`Driver ${_key} is immutable and it is already present`);
        } else {
          arrayOfErrors.push(`Driver ${_key} is immutable and it is already present`);
          continue;
        }
      }

      // set date milliseconds:
      // * if `_isImmutableWithoutDates` is true, set milliseconds to 0
      // * else strip the time part from the date, then get the milliseconds
      // (check for `_inputItemClone?.date` because typescript can't understand that `sanitize` sanitize invalid dates)
      const _inputDateMillisecond = (() => {
        if (_inputItemClone?.date) {
          if (_isImmutableWithoutDates) { return 0; } else { return stripTimeToLocalDate(_inputItemClone?.date).getTime(); }
        } else { return 0; }
      })();

      // if the flag `freezeValues` is true, deep freeze the value
      if (this.#freezeValues) {
        deepFreeze(_inputItemClone.value);
      }

      // if the driver is missing, add it to the repo
      if (!(this.#driversRepo.has(_key))) {
        this.#driversRepo.set(_key, [{ dateMilliseconds: _inputDateMillisecond, value: _inputItemClone.value }]);
        this.#obsoleteIds.add(_key);
      }
      // if the driver is present, update it or not if it's immutable
      else {
        const _driver = this.#driversRepo.get(_key);
        if (_driver) {
          let _toAppendFlag = true;
          // loop _driver array:
          // 1) if the date is already present
          //    1.0) set _toAppendFlag to false
          //    1.1) if `_isImmutable` don't add it (throw an error if `throwOnImmutableDriverChange` is true, or ignore it appending an error)
          //    1.2) if `_isMutable` replace the value
          // 2) if the date is not present insert date and value at the right position between other dates and set _toAppendFlag to false
          // 3) if _toAppendFlag is still true, append date and value at the end of the array
          for (let i = 0; i < _driver.length; i++) {
            if (_driver[i].dateMilliseconds === _inputDateMillisecond) {
              if (_isMutable) {
                _driver[i].value = _inputItemClone.value;  // 1.2) replace the value
                this.#obsoleteIds.add(_key);
              } else {
                // 1.1) don't add it (throw an error if `throwOnImmutableDriverChange` is true, or ignore it appending an error)
                if (_inputItem.throwOnImmutableDriverChange) {
                  throw new Error(`Driver ${_key} is immutable and the date ${localDateToStringYYYYMMDD(new Date(_inputDateMillisecond))} is already present`);
                } else {
                  arrayOfErrors.push(`Driver ${_key} is immutable and the date ${localDateToStringYYYYMMDD(new Date(_inputDateMillisecond))} is already present`);
                }
              }
              _toAppendFlag = false;
              break;
            } else if (_driver[i].dateMilliseconds > _inputDateMillisecond) {
              // 2) insert date and value at the right position between other dates
              _driver.splice(i, 0, { dateMilliseconds: _inputDateMillisecond, value: _inputItemClone.value });
              this.#obsoleteIds.add(_key);
              _toAppendFlag = false;
              break;
            }
          }

          if (_toAppendFlag) {
            // 3) append date and value at the end of the array
            _driver.push({ dateMilliseconds: _inputDateMillisecond, value: _inputItemClone.value });
            this.#obsoleteIds.add(_key);
          }
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
   * @param {boolean} [p.search=false] - Optional flag to search for recursive search of the driver:
   * read from Unit, then from Default Unit (if Unit != Default), then from Base Scenario (if Scenario != Base) and same Unit,
   * finally from Base Scenario and Default Unit (if Unit != Default and if Scenario != Base)
   * @param {boolean} [p.throwIfNotDefined=false] Optional flag to throw. See below `throws` for description of this option.
   * @param {boolean} [p.searchExactDate=false] Optional flag to search for an exact date when get a single date (without `endDate`).
   * @return {undefined|*|*[]} Driver; if not found, returns undefined;
   * if `endDate` is not defined and `searchExactDate` is false, returns the value defined before or at `date`;
   * if `endDate` is not defined and `searchExactDate` is true, returns the value defined exactly at `date`;
   * if `endDate` is defined, returns an array of values defined between `date` and `endDate`.
   * Returned data is not cloned, but with `freezeValues` option = true in the constructor the values are deep-frozen before saving them.
   * @throws {Error} If `throwIfNotDefined` is true, throws if the Driver to get is not defined. If `search` is true, throws only if the search fails.
   */
  get ({ scenario, unit, name, date, endDate, search = false, throwIfNotDefined = false, searchExactDate = false }) {
    let _key = this.#driversRepoBuildKey({ scenario, unit, name });

    if (!this.#driversRepo.has(_key)) {
      if (!search)
        return undefined_Or_throwIfNotDefined();
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
          return undefined_Or_throwIfNotDefined();
      }
    }

    this.#updateIndexesOfObsoleteDrivers(_key);  // update index of obsolete drivers, if needed

    const _driver = this.#driversRepo.get(_key);
    // shouldn't be null at this point, but we do this test to prevent error "TS2345 [ERROR]: Argument of type [...] is not assignable to parameter of type [...]'
    if (_driver == null) return undefined;

    // sanitize input date to milliseconds:<p>
    // * missing dates will be set to this.#today;<p>
    // * strip the time part from the date (if the date is != Date(0))<p>
    const _dateMs = (() => {
      const _date = (date === undefined || date === null) ? this.#today : date;
      return this.#stripTimeToDateAndConvertToMillisecondsWithCache({date: _date});
    })();

    // compute `_firstDate` and `_lastDate` milliseconds and position
    const _firstDateMs = _driver[0].dateMilliseconds;
    const _firstDatePos = 0;
    const _lastDateMs = _driver[_driver.length - 1].dateMilliseconds;
    const _lastDatePos = _driver.length - 1;

    // if `endDate` is not defined:
    // - if `searchExactDate` is true, returns the value defined exactly at `date` if it exists, otherwise returns undefined
    // - if `searchExactDate` is false, returns the value defined before or at `date`
    if (endDate == null) {
      let _ret = undefined;

      let _positionOfDateInDriverArray = undefined;

      // 1) if `_dateMs` is before the first date in which the driver is defined, leave the return position to undefined
      // 2) if `_dateMs` is after the last date in which the driver is defined, set the return position to the last date
      if (_dateMs < _firstDateMs) {
        // 1) leave the return position to undefined
      } else if (_dateMs > _lastDateMs) {
        // 2) set the return position to the last date
        _positionOfDateInDriverArray = _lastDatePos;
      } else {
        // get `_dateMs` from `#driverDatesBeforeOrExact`, undefined if not found
        //@ts-ignore `this.#driverDatesBeforeOrExact.get(_key)` is never null
        _positionOfDateInDriverArray = this.#driverDatesBeforeOrExact.get(_key).get(_dateMs);
      }

      // if the date is found:
      // if `searchExactDate` is true, check if the found date is exactly the same as `_dateMs`, if so return the value;
      // if `searchExactDate` is false, return the value of the date found
      if (_positionOfDateInDriverArray !== undefined) {
        if (searchExactDate) {
          const _foundDateMs = _driver[_positionOfDateInDriverArray].dateMilliseconds;
          if (_foundDateMs === _dateMs) {
            _ret = _driver[_positionOfDateInDriverArray].value;
          }
        } else {
          _ret = _driver[_positionOfDateInDriverArray].value;
        }
      }

      // return value
      return _ret;
    }
    // if `endDate` is defined, returns an array of values defined between `date` and `endDate`
    else {
      // start & end date milliseconds.<p>
      // end milliseconds:<p>
      // * strip the time part from the date (if the date is != Date(0))<p>
      // if end milliseconds is lower than `_dateMs`, invert the two dates and returns them
      /** @type {{start: number, end: number}} */
      const _milliseconds = (() => {
        const _endDateMs = this.#stripTimeToDateAndConvertToMillisecondsWithCache({date: endDate});

        if (_endDateMs < _dateMs)
          return { start: _endDateMs, end: _dateMs };
        else
          return { start: _dateMs, end: _endDateMs };
      })();

      let _retArray = [];

      // if `.start` and `.end` are both before the first date of the driver, return an empty array
      if (_milliseconds.start < _firstDateMs && _milliseconds.end < _firstDateMs)
        return [];

      // if `.start` and `.end` are both after the last date of the driver, return an empty array
      if (_milliseconds.start > _lastDateMs && _milliseconds.end > _lastDateMs)
        return [];

      // set `_firstDateToReturnPos`: position from `#driverDatesAfterOrExact` or the first date position if it's before it
      const _firstDateToReturnPos = (() => {
        //@ts-ignore `this.#driverDatesAfterOrExact.get(_key)` is never null
        const _positionOfDateInDriverArray = this.#driverDatesAfterOrExact.get(_key).get(_milliseconds.start);
        if (_positionOfDateInDriverArray !== undefined)
          return _positionOfDateInDriverArray;
        else
          return _firstDatePos;
      })();

      // set `_lastDateToReturnPos`: position from `#driverDatesBeforeOrExact` or the last date position if it's after it
      const _lastDateToReturnPos = (() => {
        //@ts-ignore `this.#driverDatesBeforeOrExact.get(_key)` is never null
        const _positionOfDateInDriverArray = this.#driverDatesBeforeOrExact.get(_key).get(_milliseconds.end);
        if (_positionOfDateInDriverArray !== undefined)
          return _positionOfDateInDriverArray;
        else
          return _lastDatePos;
      })();

      // loop from first to last position to return
      for (let i = _firstDateToReturnPos; i <= _lastDateToReturnPos; i++) {
        _retArray.push(_driver[i].value);
      }

      // return array
      return _retArray;
    }

    //#region local functions
    /**
     * @return {undefined} If `throwIfNotDefined` is false returns undefined
     * @throws {Error} If `throwIfNotDefined` is true throws
     */
    function undefined_Or_throwIfNotDefined () {
      if (throwIfNotDefined)
        throw new Error(`get() of ${JSON.stringify({ scenario, unit, name })} failed, not defined`);
      else
        return undefined;
    }

    //#endregion local functions
  }

  /**
   * Get a Driver
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Driver name
   * @param {Date} [p.date] - Optional date; if missing is set with the value of `setToday` method
   * @param {Date} [p.endDate] - Optional end date; if missing the search is done only for `date`
   * @param {boolean} [p.search=false] - Optional flag to search for recursive search of the driver:
   * read from Unit, then from Default Unit (if Unit != Default), then from Base Scenario (if Scenario != Base) and same Unit,
   * finally from Base Scenario and Default Unit (if Unit != Default and if Scenario != Base)
   * @param {boolean} [p.throwIfNotDefined=false] Optional flag to throw. See @throws for description of this option.
   * @return {undefined|*|*[]} Driver; if not found, returns undefined;
   * if `endDate` is not defined, returns the value defined before or at `date`;
   * if `endDate` is defined, returns an array of values defined between `date` and `endDate`.
   * Returned data is not cloned, but with `freezeValues` option = true in the constructor the values are deep-frozen before saving them.
   * @throws {Error} If `throwIfNotDefined` is true, throws if the Driver to get is not defined. If `search` is true, throws only if the search fails.
   */
  SUPERDEDED_get_without_indexing ({ scenario, unit, name, date, endDate, search = false, throwIfNotDefined = false }) {
    let _key = this.#driversRepoBuildKey({ scenario, unit, name });

    if (!this.#driversRepo.has(_key)) {
      if (!search)
        return undefined_Or_throwIfNotDefined();
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
          return undefined_Or_throwIfNotDefined();
      }
    }

    const _driver = this.#driversRepo.get(_key);
    // shouldn't be null at this point, but we do this test to prevent error "TS2345 [ERROR]: Argument of type [...] is not assignable to parameter of type [...]'
    if (_driver == null) return undefined;

    // sanitize input date to milliseconds:<p>
    // * missing dates will be set to this.#today;<p>
    // * invalid date will be set to new Date(0);<p>
    // * strip the time part from the date (if the date is != Date(0))<p>
    const _dateMilliseconds = (() => {
      let _date = (date === undefined || date === null) ? this.#today : date;
      _date = sanitize({ value: _date, sanitization: schema.DATE_TYPE });
      _date = stripTimeToLocalDate(_date);
      return _date.getTime();
    })();

    // if `endDate` is not defined, returns the value defined before or at `date`
    if (endDate == null) {
      let _ret = undefined;

      // binary search of `_dateMilliseconds` in `_driver` array; -1 if not found
      const foundPositionOf__dateMilliseconds_in__driver_array =
        this.#binarySearch_position_atOrBefore_dateMilliseconds(_driver, _dateMilliseconds);

      // if the date is found, set the return value
      if (foundPositionOf__dateMilliseconds_in__driver_array !== -1) {
        _ret = _driver[foundPositionOf__dateMilliseconds_in__driver_array].value;
      }

      // return value
      return _ret;
    }
    // if `endDate` is defined, returns an array of values defined between `date` and `endDate`
    else {
      // compute `_firstDate` and `_lastDate` milliseconds
      const _firstDateMs = _driver[0].dateMilliseconds;
      const _lastDateMs = _driver[_driver.length - 1].dateMilliseconds;

      // start & end date milliseconds.<p>
      // end milliseconds:<p>
      // * invalid date will be set to new Date(0);<p>
      // * strip the time part from the date (if the date is != Date(0))<p>
      // if end milliseconds is lower than `_dateMilliseconds`, invert the two dates and returns them
      /** @type {{start: number, end: number}} */
      const _milliseconds = (() => {
        const _endDate = sanitize({ value: endDate, sanitization: schema.DATE_TYPE });
        const _endDateMs = stripTimeToLocalDate(_endDate).getTime();
        if (_endDateMs < _dateMilliseconds)
          return { start: _endDateMs, end: _dateMilliseconds };
        else
          return { start: _dateMilliseconds, end: _endDateMs };
      })();

      let _retArray = [];

      // if `.start` and `.end` are both before the first date of the driver, return an empty array
      if (_milliseconds.start < _firstDateMs && _milliseconds.end < _firstDateMs)
        return [];

      // if `.start` and `.end` are both after the last date of the driver, return an empty array
      if (_milliseconds.start > _lastDateMs && _milliseconds.end > _lastDateMs)
        return [];

      // binary search of `_milliseconds.end` in `_driver` array; -1 if not found
      let foundPositionOf__endDate_in__driver_array =
        this.#binarySearch_position_atOrBefore_dateMilliseconds(_driver, _milliseconds.end);

      // if the end date is not found, set to the end of the array
      if (foundPositionOf__endDate_in__driver_array === -1)
        foundPositionOf__endDate_in__driver_array = _driver.length;

      // loop from `foundPositionOf__endDate_in__driver_array` to the start of the array
      // and save all drivers between `_milliseconds.start` and `_milliseconds.end`
      for (let i = foundPositionOf__endDate_in__driver_array; i >= 0; i--) {
        if (_driver[i].dateMilliseconds < _milliseconds.start)
          break;
        _retArray.push(_driver[i].value);
      }
      _retArray.reverse();  // invert the values of `_retArray`, because we looped from the end to the start of the array

      // return array
      return _retArray;
    }

    //#region local functions
    /**
     * @return {undefined} If `throwIfNotDefined` is false returns undefined
     * @throws {Error} If `throwIfNotDefined` is true throws
     */
    function undefined_Or_throwIfNotDefined () {
      if (throwIfNotDefined)
        throw new Error(`get() of ${JSON.stringify({ scenario, unit, name })} failed`);
      else
        return undefined;
    }

    //#endregion local functions
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
   * Strips the time part from a date and converts it to milliseconds.<p>
   * Uses a cache to avoid recalculating the same date multiple times.<p>
   * @param {Object} p
   * @param {Date} p.date - Date to sanitize
   * @return {number} Milliseconds of date stripped to local date
   * @throws {Error} If `date` is not of Date type, will fail trying to execute `getTime()` method on the date
   */
  #stripTimeToDateAndConvertToMillisecondsWithCache ({ date }) {
    const _milliseconds = date.getTime();
    // get milliseconds from cache if present, otherwise strip time to local date and save in cache
    let _timeStrippedMillisecondsFromCache = this.#datesMillisecondsCache.get(_milliseconds);
    if (_timeStrippedMillisecondsFromCache == null) {
      _timeStrippedMillisecondsFromCache = stripTimeToLocalDate(date).getTime();
      this.#datesMillisecondsCache.set(_milliseconds, _timeStrippedMillisecondsFromCache);
    }
    return _timeStrippedMillisecondsFromCache;
  }

  /**
   * @param {Object} p
   * @param {string} [p.scenario] - Optional scenario; null, undefined or '' means `currentScenario` from constructor
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - Driver name
   * @return {string}
   */
  #driversRepoBuildKey ({ scenario, unit, name }) {
    const _p = { scenario, unit, name };

    if (isNullOrWhiteSpace(_p.scenario)) _p.scenario = this.#currentScenario;
    if (isNullOrWhiteSpace(_p.unit)) _p.unit = this.#defaultUnit;
    if (isNullOrWhiteSpace(_p.name)) throw new Error(`name is required, but it is not defined in ${JSON.stringify(_p)}`);

    if (!RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS)
      validate({
        value: _p,
        validation: { scenario: schema.STRING_TYPE, unit: schema.STRING_TYPE, name: schema.STRING_TYPE }
      });

    //@ts-ignore `scenario`, `unit` and `name` must be strings, otherwise will go in error, that is the expected behaviour
    return `{scenario: ${_p.scenario.trim().toLowerCase()}, unit: ${_p.unit.trim().toLowerCase()}, name: ${_p.name.trim().toLowerCase()}}`;
  }

  /**
   * Perform a binary search to find the position at or before the target dateMilliseconds.
   * @param {Array<{dateMilliseconds: number, value: *}>} driverArray - The array to search.
   * @param {number} target - The target dateMilliseconds to search for.
   * @returns {number} The position at or before the target dateMilliseconds, or -1 if not found.
   */
  #binarySearch_position_atOrBefore_dateMilliseconds (driverArray, target) {
    return binarySearch_position_atOrBefore({
      array: driverArray,
      target: target,
      dateArray: false,
      keyName: 'dateMilliseconds'
    });
  }

  /**
   * Update the indexes of obsolete drivers
   * @param {string} key - The key of the driver to update if obsolete
   * @returns {void}
   */
  #updateIndexesOfObsoleteDrivers (key) {
    if (this.#obsoleteIds.has(key)) {
      this.#obsoleteIds.delete(key);  // remove the key from the set of obsolete drivers

      const _driver = this.#driversRepo.get(key);  // get the driver from the repo

      // shouldn't be null at this point, but we do this test to prevent error "TS2345 [ERROR]: Argument of type [...] is not assignable to parameter of type [...]'
      if (_driver == null)
        throw new Error(`Logical error: Driver with key ${key} of which indexes should be updated is not present in the repo`);

      // set `#firstDates` and `#lastDates`
      const _firstDate = _driver[0].dateMilliseconds;
      const _lastDate = _driver[_driver.length - 1].dateMilliseconds;

      // create a map with all driver milliseconds as key and the position in the data array as value
      /** @type {Map<number, number>} */
      const _map1_driver_keyMilliseconds_valuePositionInDriverArray = new Map();
      for (let i = 0; i < _driver.length; i++) {
        _map1_driver_keyMilliseconds_valuePositionInDriverArray.set(_driver[i].dateMilliseconds, i);
      }

      // create two empty maps that will store the dates index of `#driverDatesBeforeOrExact` and `#driverDatesAfterOrExact`
      /** @type {Map<number, number>} */
      const _map2a_driverDatesBeforeOrExact_keyMilliseconds_valuePositionInDriverArray = new Map();
      /** @type {Map<number, number>} */
      const _map2b_driverDatesAfterOrExact_keyMilliseconds_valuePositionInDriverArray = new Map();

      // loop from `_firstDate` to `_lastDate`, incrementing by one day
      let _currentDateDate = new Date(_firstDate);
      const _lastDateDate = new Date(_lastDate);
      let _previousFoundPosition = -1;
      while (true) {
        //#region if `_currentDateDate` is found in milliseconds map, set the found position in `#driverDatesBeforeOrExact` and `#driverDatesAfterOrExact`
        const _currentDateMilliseconds = _currentDateDate.getTime();
        const _positionInDriverArray = _map1_driver_keyMilliseconds_valuePositionInDriverArray.get(_currentDateMilliseconds);
        if (_positionInDriverArray != null) {
          // store for later reuse the `_positionInDriverArray` in `_previousFoundPosition`
          _previousFoundPosition = _positionInDriverArray;
          // set the found position in `#driverDatesBeforeOrExact` and `#driverDatesAfterOrExact`
          _map2a_driverDatesBeforeOrExact_keyMilliseconds_valuePositionInDriverArray.set(_currentDateMilliseconds, _positionInDriverArray);
          _map2b_driverDatesAfterOrExact_keyMilliseconds_valuePositionInDriverArray.set(_currentDateMilliseconds, _positionInDriverArray);
          //#endregion if `_currentDateDate` is found in milliseconds map [...]
        } else {
          //#region if `_currentDateDate` is NOT found in milliseconds map
          // set the previous found position in `#driverDatesBeforeOrExact`:
          // because dates are ordered, every defined date is in `_map1`, then if we didn't find the current date we are searching
          // it means that the position of the date before or exact is the previously found position
          _map2a_driverDatesBeforeOrExact_keyMilliseconds_valuePositionInDriverArray.set(_currentDateMilliseconds, _previousFoundPosition);
          // set the previous found position + 1 in `#driverDatesAfterOrExact`
          // because dates are ordered, every defined date is in `_map1`, then if we didn't find the current date we are searching
          // it means that the position of the date after or exact is the next date (that is the previously found position + 1)
          _map2b_driverDatesAfterOrExact_keyMilliseconds_valuePositionInDriverArray.set(_currentDateMilliseconds, _previousFoundPosition + 1);
          //#endregion if `_currentDateDate` is NOT found in milliseconds map
        }

        // increment `_currentDateDate` by one day
        _currentDateDate = stripTimeToLocalDate(addDaysToLocalDate(_currentDateDate, 1));

        // if `_currentDateDate` is greater than `_lastDateDate`, break the loop
        if (_currentDateDate.getTime() > _lastDateDate.getTime()) {
          break;
        }
      }

      // save the maps in `#driverDatesBeforeOrExact` and `#driverDatesAfterOrExact`
      this.#driverDatesBeforeOrExact.set(key, _map2a_driverDatesBeforeOrExact_keyMilliseconds_valuePositionInDriverArray);
      this.#driverDatesAfterOrExact.set(key, _map2b_driverDatesAfterOrExact_keyMilliseconds_valuePositionInDriverArray);
    }
  }

  //#endregion private methods
}
