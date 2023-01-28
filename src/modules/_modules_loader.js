export { ModulesLoader };

import { validateObj } from '../deps.js';
import { modulesLoaderResolver } from '../engine/modules/modules_loader_resolver.js';

/**
 * @callback modulesLoaderResolver
 * @param {string} module - The module to resolve
 * @return {string[]} List of URL from which import a module
 */

class ModulesLoader {
  /** Map containing id (URI/moduleName) as key and a {class: *, cdnURI: string} as value
   * @type {Map<String, {class: *, cdnURI: string}>} */
  #classesRepo;
  #defaultClassName = 'Module';
  /** @type {modulesLoaderResolver} */
  #modulesLoaderResolver;

  /**
   @param {Object} p
   @param {modulesLoaderResolver} [p.modulesLoaderResolver] optional modulesLoaderResolver function
   */
  constructor (p) {
    this.#classesRepo = new Map();

    // if modulesLoaderResolver is null/undefined, assign to _modulesLoaderResolver
    this.#modulesLoaderResolver = p.modulesLoaderResolver ?? modulesLoaderResolver;
  }

  /**
   * Add classes from object to the repository.
   * If URI/moduleName already exists, it is not added.
   * @param {{moduleName: string, moduleEngineURI: string, classObj: *}} p
   * @throws Will throw an error if moduleEngineURI/moduleName already exists
   */
  addClassFromObject (p) {
    const validation = {
      moduleName: 'string',
      moduleEngineURI: 'string',
      classObj: 'any'
    };
    validateObj({ obj: p, validation: validation });

    const repoKey = this.#repoKeyBuilder(p.moduleEngineURI, p.moduleName);
    if (this.#classesRepo.get(repoKey) === undefined)
      this.#classesRepo.set(repoKey, { class: p.classObj, cdnURI: '' });
    else
      throw new Error(`moduleEngineURI/moduleName already exists: ${repoKey}`);
  }

  /**
   * Load module from URI and add a class with default name {#defaultClassName} to the repository.
   * If 'URI/moduleName' already exists, it is not added.
   * If URI is "" or . or / or \, is set to ./${moduleName}.js
   * If URI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
   * If is missing the ".js" extension from the URI, the extension is added
   * @param {{moduleName: string, moduleEngineURI: string}} p
   * @throws Will throw an error if moduleEngineURI/moduleName already exists
   */
  async addClassFromURI (p) {
    validateObj({ obj: p, validation: { moduleName: 'string', moduleEngineURI: 'string' } });

    const repoKey = this.#repoKeyBuilder(p.moduleEngineURI, p.moduleName);

    if (this.#classesRepo.get(repoKey) === undefined) {
      let _URI = p.moduleEngineURI.trim();
      if (['', '.', '/', './', '\\', '.\\'].includes(_URI))  // If moduleEngineURI is missing or . / /. \ \., is set to ./${p.moduleName}.js
        _URI = `./${p.moduleName}.js`;

      // DYNAMIC IMPORT (works with Deno and browser)
      let _lastImportError = "";
      for (const _cdnURI of this.#modulesLoaderResolver(_URI)){
        try {
          const _module = (await import(_cdnURI));
          if (_module != null && _module[this.#defaultClassName] != null)
          {
            this.#classesRepo.set(repoKey, { class: _module[this.#defaultClassName], cdnURI: _cdnURI });
            return;
          }
        } catch (error) {
          _lastImportError = error.stack?.toString() ?? error.toString();  // save the last error and go on with the loop trying the next cdnURI
        }
      }
      throw new Error(`error loading module ${_URI}, error: ${_lastImportError}`);
    }
    else
      throw new Error(`moduleEngineURI/moduleName already exists: ${repoKey}`);
  }

  /**
   Get a class from the repository. The returned class is not initialized and must be initialized with 'new'.
   If 'URI/moduleName' is non-existent, returns undefined.
   * @param {{moduleName: string, moduleEngineURI: string}} p
   * @return {undefined | {class: *, cdnURI: string}}
   */
  get (p) {
    const validation = {
      moduleName: 'string',
      moduleEngineURI: 'string'
    };
    validateObj({ obj: p, validation: validation });

    const _ret = this.#classesRepo.get(this.#repoKeyBuilder(p.moduleEngineURI, p.moduleName));
    if (_ret === undefined)
      return undefined;
    if (_ret.class == null || _ret.cdnURI == null)
      throw new Error('internal error, some property of the object loaded from the repo == null or undefined');
    return { ..._ret };  // return a shallow copy
  }

  /**
   * @param {string} moduleEngineURI
   * @param {string} moduleName
   * @return {string}
   */
  #repoKeyBuilder (moduleEngineURI, moduleName) {
    return `${moduleEngineURI}/${moduleName}`;
  }
}
