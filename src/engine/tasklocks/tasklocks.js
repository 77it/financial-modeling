export { TaskLocks };

import { sanitization, validation, isNullOrWhiteSpace } from '../../deps.js';

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
  /** @type {string} */
  #defaultUnit;

  /**
   * @param {Object} p
   * @param {string} p.defaultUnit - The Simulation Unit
   */
  constructor ({ defaultUnit }) {
    this.#taskLocksRepo = new Map();
    this.#currentDebugModuleInfo = '';

    this.#defaultUnit = sanitization.sanitize({ value: defaultUnit, sanitization: sanitization.STRING_TYPE });
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitization.sanitize({ value: debugModuleInfo, sanitization: sanitization.STRING_TYPE });
  }

  /**
   * Set a TaskLock; TaskLocks are immutable.
   * @param {Object} p
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
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
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
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
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
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
   * Get a list of units where the TaskLock is defined
   * @param {Object} p
   * @param {string} p.name - TaskLock name
   * @return {string[]} list of units where the TaskLock is defined
   */
  listUnit ({ name }) {
    const _ret = [];

    // loop all keys of the #taskLocksRepo, deserialize the key, if the name matches add the unit to the return array
    for (const _key of this.#taskLocksRepo.keys()) {
      const _keyObj = JSON.parse(_key);
      if (_keyObj?.name === name)
        _ret.push(_keyObj.unit);
    }

    return _ret;
  }

  /**
   * Check if a TaskLock is defined
   * @param {Object} p
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @return {boolean}
   */
  isDefined ({ unit, name }) {
    return this.#taskLocksRepo.has(this.#taskLocksRepoBuildKey({ unit, name }));
  }

  //#region private methods
  /**
   * @param {Object} p
   * @param {string} [p.unit] - Driver unit, optional; null, undefined or '' means `defaultUnit` from constructor
   * @param {string} p.name - TaskLock name
   * @return {string}
   */
  #taskLocksRepoBuildKey ({ unit, name }) {
    const _p = sanitization.sanitizeObj({
      obj: { unit, name },
      sanitization: { unit: sanitization.STRING_TYPE, name: sanitization.STRING_TYPE },
      validate: true
    });
    if (isNullOrWhiteSpace(_p.unit)) _p.unit = this.#defaultUnit;
    return JSON.stringify({
      unit: _p.unit.trim().toLowerCase(),
      name: _p.name.trim().toLowerCase()
    });
  }

  //#endregion private methods
}
