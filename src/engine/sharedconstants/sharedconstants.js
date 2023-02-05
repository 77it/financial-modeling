export { SharedConstants };

// TODO
/*
if needed see implementation of js lock  https://www.talkinghightech.com/en/initializing-js-lock/, but being immutable probably isn't needed...
sharedConstants are immutable: when defined/set can't be redefined.
 */

class SharedConstants {
  /** Map to store SharedConstants: XXX id as string key, * as value.
   * @type {Map<String, *>} */
  #sharedConstantsRepo;

  constructor () {
    this.#sharedConstantsRepo = new Map();
  }

  /**
   * Set a SharedConstant
   * @param {Object} p
   * @param {string} [p.namespace='$'] - Optional namespace; global/simulation namespace is "$"; namespace can be null, undefined or '' meaning $
   * @param {string} p.name - SharedConstant name
   * @param {*} p.value - SharedConstant value
   */
  sharedConstantSet ({ namespace = '$', name, value }) {
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
