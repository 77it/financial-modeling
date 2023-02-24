export { ModulesLoader };

import { validateObj } from '../deps.js';
import { modulesLoader_Resolve } from '../engine/modules/modules_loader__resolve.js';

class ModulesLoader {
  /**
   Map to store classes: "URI/moduleName" as string key, {class: *, cdnURI: string} as value.
   Beware: URI (the original module URI) is different from cdnURI (the URI from which the module is loaded)
   * @type {Map<String, {class: *, cdnURI: string}>} */
  #classesRepo;
  #defaultClassName = 'Module';
  /** @type {modulesLoader_Resolve} */
  #modulesLoader_Resolve;

  /**
   * @param {Object} p
   * @param {modulesLoader_Resolve} [p.modulesLoader_Resolve] optional modulesLoader_Resolve function
   */
  constructor (p) {
    this.#classesRepo = new Map();

    // if modulesLoader_Resolve is null/undefined, assign to _modulesLoader_Resolve
    this.#modulesLoader_Resolve = p.modulesLoader_Resolve ?? modulesLoader_Resolve;
  }

  /**
   Add classes from object to the repository.
   If URI/moduleName already exists, it is not added.
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

    const _moduleName = p.moduleName.trim().toLowerCase();

    const repoKey = this.#repoKeyBuilder(p.moduleEngineURI, _moduleName);
    if (this.#classesRepo.get(repoKey) === undefined)
      this.#classesRepo.set(repoKey, { class: p.classObj, cdnURI: '' });
    else
      throw new Error(`moduleEngineURI/moduleName already exists: ${repoKey}`);
  }

  /**
   Load module from URI and add a class with default name {#defaultClassName} to the repository.
   If 'URI/moduleName' already exists, it is not added.
   If URI is "" or . or / or \, is set to ./${moduleName.trim().toLowerCase()}.js
   If URI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
   If is missing the ".js" extension from the URI, the extension is added
   * @param {{moduleName: string, moduleEngineURI: string}} p
   * @throws Will throw an error if moduleEngineURI/moduleName already exists
   */
  async addClassFromURI (p) {
    validateObj({ obj: p, validation: { moduleName: 'string', moduleEngineURI: 'string' } });

    const _moduleName = p.moduleName.trim().toLowerCase();
    console.log(_moduleName);

    const repoKey = this.#repoKeyBuilder(p.moduleEngineURI, _moduleName);

    if (this.#classesRepo.get(repoKey) === undefined) {
      let _URI = p.moduleEngineURI.trim();
      if (['', '.', '/', './', '\\', '.\\'].includes(_URI))  // If moduleEngineURI is missing or . / /. \ \., is set to ./${_moduleName}.js
        _URI = `./${_moduleName}.js`;
      console.log(_URI);

      // DYNAMIC IMPORT (works with Deno and browser)
      let _lastImportError = "";
      for (const _cdnURI of this.#modulesLoader_Resolve(_URI)){
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
   Get {class, cdnURI} from the repository.
   The returned class is not initialized and must be initialized with 'new'.
   URI (the original module URI) is different from cdnURI (the URI from which the module is loaded).
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

    const _moduleName = p.moduleName.trim().toLowerCase();

    const _ret = this.#classesRepo.get(this.#repoKeyBuilder(p.moduleEngineURI, _moduleName));
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
