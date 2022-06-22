export class ModulesRunner {
  /** contains id (URI/className) as key and a class as value
   * @type {*} */
  #classesRepo;
  #defaultClassName = 'Module';

  constructor () {
    this.#classesRepo = {};
  }

  /**
   * Add classes from object to the repository.
   * If URI/moduleName already exists, it is not added.
   * @param {Object} p
   * @param {string} p.moduleName
   * @param {string} p.URI
   * @param {*} p.classObj
   * @return {boolean} true if added, false if already exists
   */
  addClassFromObject ({ moduleName, URI, classObj }) {
    if (this.#classesRepo[ModulesRunner.#repoKeyBuilder(URI, moduleName)] === undefined) {
      this.#classesRepo[ModulesRunner.#repoKeyBuilder(URI, moduleName)] = classObj;
      return true;
    }
    return false;
  }

  /**
   * Load module from URI and add a class with default name to the repository.
   * If URI/moduleName already exists, it is not added.
   * @param {Object} p
   * @param {string} p.moduleName
   * @param {string} p.URI
   * @return {Promise<boolean>} true if added, false if already exists
   */
  async addClassFromURI ({ moduleName, URI }) {
    if (this.#classesRepo[ModulesRunner.#repoKeyBuilder(URI, moduleName)] === undefined) {
      // DYNAMIC IMPORT (works with deno and browser)
      const _module = (await import(URI));
      this.#classesRepo[ModulesRunner.#repoKeyBuilder(URI, moduleName)] = _module[this.#defaultClassName];
      return true;
    }
    return false;
  }

  /**
   * Load modules from URI and add classes with default name to the repository.
   * If URI/moduleName already exists, it is not added.
   * @param {Object[]} p
   * @param {string} p[].moduleName
   * @param {string} p[].URI
   * @return {Promise<boolean>} true if added at least one time, false if already exists
   */
  async addClassesFromURI (p) {
    let _result = false;
    for (const _p of p) {
      if (this.#classesRepo[ModulesRunner.#repoKeyBuilder(_p.URI, _p.moduleName)] === undefined) {
        // DYNAMIC IMPORT (works with deno and browser)
        const _module = (await import(_p.URI));
        this.#classesRepo[ModulesRunner.#repoKeyBuilder(_p.URI, _p.moduleName)] = _module[this.#defaultClassName];
        _result = true;
      }
    }
    return _result;
  }

  /**
   Get class from the repository.
   * @param {Object} p
   * @param {string} p.moduleName
   * @param {string} p.URI
   * @return {*}
   */
  getClass ({ moduleName, URI }) {
    return this.#classesRepo[ModulesRunner.#repoKeyBuilder(URI, moduleName)];
  }

  /**
   * @param {string} URI
   * @param {string} moduleName
   * @return {string}
   */
  static #repoKeyBuilder (URI, moduleName) {
    return `${URI}/${moduleName}`;
  }
}
