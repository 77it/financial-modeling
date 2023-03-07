export { SharedConstants };

import { sanitization, validation } from '../../deps.js';
import { SIMULATION } from '../../modules/_names/standardnames.js';

/*
if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...
sharedConstants are immutable: when defined/set can't be redefined.
 */

class SharedConstants {
  /**
   Map to store SharedConstants:
   keys are strings made of "namespace/name" (built with `sharedConstantsRepoBuildKey` method),
   values are {constant: function_of_any_kind, debugModuleInfo: string}.
   * @type {Map<String, {constant: *, debugModuleInfo: string}>} */
  #sharedConstantsRepo;
  /** @type {string} */
  #currentDebugModuleInfo;

  constructor () {
    this.#sharedConstantsRepo = new Map();
    this.#currentDebugModuleInfo = '';
  }

  /** @param {string} debugModuleInfo */
  setDebugModuleInfo (debugModuleInfo) {
    this.#currentDebugModuleInfo = sanitization.sanitize({ value: debugModuleInfo, sanitization: sanitization.STRING_TYPE });
  }

  /**
   * Set a SharedConstant; a SharedConstant can be set only once
   * @param {Object} p
   * @param {string} [p.namespace] - Optional namespace; global/simulation namespace is SIMULATION.NAME ('$' by now); namespace can be null, undefined or '' meaning '$'
   * @param {string} p.name - SharedConstant name
   * @param {*} p.value - SharedConstant value
   * @return {boolean} true if SharedConstant is set, false if SharedConstant is already defined
   */
  set ({ namespace, name, value }) {
    validation.validateObj({
      obj: { namespace, name, value },
      validation: { namespace: validation.STRING_TYPE, name: validation.STRING_TYPE, value: validation.FUNCTION_TYPE }
    });
    const _key = this.#sharedConstantsRepoBuildKey({ namespace, name });
    if (this.#sharedConstantsRepo.has(_key))
      return false;
    this.#sharedConstantsRepo.set(_key, { constant: value, debugModuleInfo: this.#currentDebugModuleInfo });
    return true;
  }

  /**
   * Get a SharedConstant
   * @param {Object} p
   * @param {string} [p.namespace] - Optional namespace; global/simulation namespace is SIMULATION.NAME ('$' by now); namespace can be null, undefined or '' meaning '$'
   * @param {string} p.name - SharedConstant name
   * @return {*} SharedConstant
   * @throws {Error} if SharedConstant is not defined, throws an error
   */
  get ({ namespace, name }) {
    const _key = this.#sharedConstantsRepoBuildKey({ namespace, name });
    if (!this.#sharedConstantsRepo.has(_key))
      throw new Error(`SharedConstant '${_key}' is not defined.`);
    return this.#sharedConstantsRepo.get(_key)?.constant;
  }

  /**
   * Get info on the module that defined a SharedConstant
   * @param {Object} p
   * @param {string} [p.namespace] - Optional namespace; global/simulation namespace is SIMULATION.NAME ('$' by now); namespace can be null, undefined or '' meaning '$'
   * @param {string} p.name - SharedConstant name
   * @return {*} Info on the module that defined a SharedConstant
   * @throws {Error} if SharedConstant is not defined, throws an error
   */
  getDebugModuleInfo ({ namespace, name }) {
    const _key = this.#sharedConstantsRepoBuildKey({ namespace, name });
    if (!this.#sharedConstantsRepo.has(_key))
      throw new Error(`SharedConstant '${_key}' is not defined.`);
    return this.#sharedConstantsRepo.get(_key)?.debugModuleInfo;
  }

  /**
   * Check if a SharedConstant is defined
   * @param {Object} p
   * @param {string} [p.namespace] - Optional namespace; global/simulation namespace is SIMULATION.NAME ('$' by now); namespace can be null, undefined or '' meaning '$'
   * @param {string} p.name - SharedConstant name
   * @return {boolean}
   */
  isDefined ({ namespace, name }) {
    return this.#sharedConstantsRepo.has(this.#sharedConstantsRepoBuildKey({ namespace, name }));
  }

  //#region private methods
  /**
   * @param {Object} p
   * @param {string} [p.namespace] - Optional namespace; global/simulation namespace is SIMULATION.NAME ('$' by now); namespace can be null, undefined or '' meaning '$'
   * @param {string} p.name - SharedConstant name
   * @return {string}
   */
  #sharedConstantsRepoBuildKey ({ namespace, name }) {
    const _p = sanitization.sanitizeObj({
      obj: { namespace, name },
      sanitization: { namespace: sanitization.STRING_TYPE, name: sanitization.STRING_TYPE }
    });
    if (_p.namespace === '') _p.namespace = SIMULATION.NAME;
    return JSON.stringify({
      namespace: _p.namespace.trim().toLowerCase(),
      name: _p.name.trim().toLowerCase()
    });
  }

  //#endregion private methods
}
