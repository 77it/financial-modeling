export { TaskLocks };

import * as schema from '../../lib/schema.js';
import { sanitize } from '../../lib/schema_sanitization_utils.js';
import { RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS } from '../../config/engine.js';
import { validate } from '../../lib/schema_validation_utils.js';
import { isNullOrWhiteSpace } from '../../lib/string_utils.js';

/*
if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...
 */

class TaskLocks {
  /**
   Map to store TaskLocks:
   keys are strings made of "unit/name" (built with `taskLocksRepoBuildKey` method),
   values are {taskLock: function_of_any_kind, debugModuleInfo: string}.
   * @type {Map<string, {taskLock: *, debugModuleInfo: string}>} */
  #taskLocksRepo;
  /** @type {string} */
  #currentDebugModuleInfo;
  /** @type {string} */
  #defaultUnit;

  /**
   * @param {Object} p
   * @param {string} p.defaultUnit - The Simulation Unit
   */
  constructor ({ defaultUnit }) {
    this.#taskLocksRepo = new Map();
    this.#currentDebugModuleInfo = '';

    this.#defaultUnit = sanitize({ value: defaultUnit, sanitization: schema.STRING_TYPE });
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitize({ value: debugModuleInfo, sanitization: schema.STRING_TYPE });
  }

  /**
   * Set a TaskLock; TaskLocks are immutable.
   * @param {Object} p
   * @param {string} [p.unit] - TaskLock unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @param {*} p.value - TaskLock value
   * @return {boolean} true if TaskLock is set, false if TaskLock is already defined
   */
  set ({ unit, name, value }) {
    validate({ value: value, validation: schema.FUNCTION_TYPE });
    const _key = this.#taskLocksRepoBuildKey({ unit, name });
    if (this.#taskLocksRepo.has(_key))
      return false;
    this.#taskLocksRepo.set(_key, { taskLock: value, debugModuleInfo: this.#currentDebugModuleInfo });
    return true;
  }

  /**
   * Get a TaskLock
   * @param {Object} p
   * @param {string} [p.unit] - TaskLock unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @return {*} TaskLock
   * @throws {Error} if TaskLock is not defined, throws an error
   */
  get ({ unit, name }) {
    const _key = this.#taskLocksRepoBuildKey({ unit, name });
    if (!this.#taskLocksRepo.has(_key))
      throw new Error(`TaskLock '${_key}' is not defined.`);
    return this.#taskLocksRepo.get(_key)?.taskLock;
  }

  /**
   * Get info on the module that defined a TaskLock
   * @param {Object} p
   * @param {string} [p.unit] - TaskLock unit, optional; null, undefined or '' means `defaultUnit` from constructor
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
   * Get list of all TaskLocks not defined in the default unit
   * @param {Object} p
   * @param {string} p.name - TaskLock name
   * @return {{unit: string, taskLock: *, debugModuleInfo: string}[]} array of unit names, TaskLocks and debugModuleInfo
   */
  getListOfAllTaskLocksNotDefinedInTheDefaultUnit ({ name }) {
    const _ret = [];

    // loop over keys and values of this.#taskLocksRepo
    // deserialize the key, if the name matches and Unit name is not the default unit, return the Lock
    for (const [_key, _value] of this.#taskLocksRepo.entries()) {
      const _keyObj = JSON.parse(_key);  // parse key to {unit: string, name: string}
      if (_keyObj?.name === name && _keyObj?.unit !== this.#defaultUnit)  // if Lock name matches and Unit name is not the default unit
        _ret.push({ unit: _keyObj.unit, taskLock: _value.taskLock, debugModuleInfo: _value?.debugModuleInfo });
    }

    return _ret;
  }

  /**
   * Check if a TaskLock is defined
   * @param {Object} p
   * @param {string} [p.unit] - TaskLock unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @return {boolean}
   */
  isDefined ({ unit, name }) {
    return this.#taskLocksRepo.has(this.#taskLocksRepoBuildKey({ unit, name }));
  }

  //#region private methods
  /**
   * @param {Object} p
   * @param {string} [p.unit] - TaskLock unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @return {string}
   */
  #taskLocksRepoBuildKey ({ unit, name }) {
    const _p = { unit, name };

    if (isNullOrWhiteSpace(_p.unit)) _p.unit = this.#defaultUnit;

    if (!RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS)
      validate({
        value: _p,
        validation: { unit: schema.STRING_TYPE, name: schema.STRING_TYPE }
      });

    //@ts-ignore `unit` and `name` are always strings at this point during debug (are sanitized); should be string during release, otherwise will go in error
    return `{unit: ${_p.unit.trim().toLowerCase()}, name: ${_p.name.trim().toLowerCase()}}`;
  }

  //#endregion private methods
}
