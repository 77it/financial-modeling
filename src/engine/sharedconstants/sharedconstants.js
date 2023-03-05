export { SharedConstants };

import { validateObj } from '../../deps.js';
import { ModuleData } from '../modules/module_data.js';

// TODO
/*
if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...
sharedConstants are immutable: when defined/set can't be redefined.
 */

class SharedConstants {
  /** Map to store SharedConstants: XXX id as string key, * as value.
   * @type {Map<String, *>} */
  #sharedConstantsRepo;
  /** @type {null|ModuleData} */
  #currentModuleData;

  constructor () {
    this.#sharedConstantsRepo = new Map();
    this.#currentModuleData = null;
  }

  /** @param {ModuleData} moduleData */
  setCurrentModuleData (moduleData) {
    this.#currentModuleData = moduleData;
  }

  /**
   * Set a SharedConstant
   * @param {Object} p
   * @param {string} [p.namespace='$'] - Optional namespace; global/simulation namespace is "$"; namespace can be null, undefined or '' meaning $
   * @param {string} p.name - SharedConstant name
   * @param {*} p.value - SharedConstant value
   */
  sharedConstantSet ({ namespace = '$', name, value }) {
    validateObj({ obj: { namespace, name, value }, validation: { namespace: 'string', name: 'string', value: 'function' } });
    // TODO not implemented
    throw new Error('not implemented');
  }

  /**
   * Get a SharedConstant
   * @param {Object} p
   * @param {string} [p.namespace='$'] - Optional namespace; global/simulation namespace is "$"; namespace can be null, undefined or '' meaning $
   * @param {string} p.name - SharedConstant name
   * @return {*} SharedConstant
   */
  sharedConstantGet ({ namespace = '$', name }) {
    // TODO not implemented
    throw new Error('not implemented');
  }
}
