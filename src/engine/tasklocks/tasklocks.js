﻿export { TaskLocks };

import { sanitization, validation } from '../../deps.js';
import * as STD_NAMES from '../../modules/_names/standard_names.js';

/*
if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...
 */

class TaskLocks {
  /**
   Map to store TaskLocks:
   keys are strings made of "unit/name" (built with `taskLocksRepoBuildKey` method),
   values are {constant: function_of_any_kind, debugModuleInfo: string}.
   * @type {Map<String, {constant: *, debugModuleInfo: string}>} */
  #taskLocksRepo;
  /** @type {string} */
  #currentDebugModuleInfo;

  constructor () {
    this.#taskLocksRepo = new Map();
    this.#currentDebugModuleInfo = '';
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitization.sanitize({ value: debugModuleInfo, sanitization: sanitization.STRING_TYPE });
  }

  /**
   * Set a TaskLock; TaskLock are immutable.
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * @param {string} p.name - TaskLock name
   * @param {*} p.value - TaskLock value
   * @return {boolean} true if TaskLock is set, false if TaskLock is already defined
   */
  set ({ unit, name, value }) {
    validation.validate({ value: value, validation: validation.FUNCTION_TYPE });
    const _key = this.#taskLocksRepoBuildKey({ unit, name });
    if (this.#taskLocksRepo.has(_key))
      return false;
    this.#taskLocksRepo.set(_key, { constant: value, debugModuleInfo: this.#currentDebugModuleInfo });
    return true;
  }

  /**
   * Get a TaskLock
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * @param {string} p.name - TaskLock name
   * @return {*} TaskLock
   * @throws {Error} if TaskLock is not defined, throws an error
   */
  get ({ unit, name }) {
    const _key = this.#taskLocksRepoBuildKey({ unit, name });
    if (!this.#taskLocksRepo.has(_key))
      throw new Error(`TaskLock '${_key}' is not defined.`);
    return this.#taskLocksRepo.get(_key)?.constant;
  }

  /**
   * Get info on the module that defined a TaskLock
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * @param {string} p.name - TaskLock name
   * @return {*} Info on the module that defined a TaskLock
   * @throws {Error} if TaskLock is not defined, throws an error
   */
  getDebugModuleInfo ({ unit, name }) {
    const _key = this.#taskLocksRepoBuildKey({ unit, name });
    if (!this.#taskLocksRepo.has(_key))
      throw new Error(`TaskLock '${_key}' is not defined.`);
    return this.#taskLocksRepo.get(_key)?.debugModuleInfo;
  }

  /**
   * Check if a TaskLock is defined
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * @param {string} p.name - TaskLock name
   * @return {boolean}
   */
  isDefined ({ unit, name }) {
    return this.#taskLocksRepo.has(this.#taskLocksRepoBuildKey({ unit, name }));
  }

  //#region private methods
  /**
   * @param {Object} p
   * @param {string} [p.unit] - Optional unit; global/simulation unit is STD_NAMES.Simulation.NAME ('$' by now); unit can be null, undefined or '' meaning '$'
   * @param {string} p.name - TaskLock name
   * @return {string}
   */
  #taskLocksRepoBuildKey ({ unit, name }) {
    const _p = sanitization.sanitizeObj({
      obj: { unit, name },
      sanitization: { unit: sanitization.STRING_TYPE, name: sanitization.STRING_TYPE },
      validate: true
    });
    if (_p.unit === '') _p.unit = STD_NAMES.Simulation.NAME;
    return JSON.stringify({
      unit: _p.unit.trim().toLowerCase(),
      name: _p.name.trim().toLowerCase()
    });
  }

  //#endregion private methods
}