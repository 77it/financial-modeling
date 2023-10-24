export { ModulesLoader };

import { schema, validateObj, sanitizeObj } from '../deps.js';
import { modulesLoader_Resolve } from '../engine/modules/modules_loader__resolve.js';

const DEFAULT_CLASSNAME = 'Module';

class ModulesLoader {
  /**
   Map to store classes:
   keys are strings made of "moduleEngineURI/moduleName" (built with `classesRepoBuildKey` method),
   values are {class: *, cdnURI: string}.
   Beware: URI (the original module URI) is different from cdnURI (the URI from which the module is loaded)
   * @type {Map<string, {class: *, cdnURI: string}>} */
  #classesRepo;
  /** @type {modulesLoader_Resolve} */
  #modulesLoader_Resolve;

  /**
   * @param {Object} p
   * @param {modulesLoader_Resolve} [p.modulesLoader_Resolve] optional modulesLoader_Resolve function
   */
  constructor (p) {
    this.#classesRepo = new Map();

    // if modulesLoader_Resolve is null/undefined, assign to _modulesLoader_Resolve
    this.#modulesLoader_Resolve = p?.modulesLoader_Resolve ?? modulesLoader_Resolve;
  }

  /**
   Add classes from object to the repository.
   If URI/moduleName already exists, it is not added.
   * @param {{moduleName: string, moduleEngineURI: string, classObj: *}} p
   * @throws {Error} Will throw an error if moduleEngineURI/moduleName already exists, because it is not allowed to overwrite a module with a different object.
   */
  addClassFromObject (p) {
    const _validation = {
      moduleName: schema.STRING_TYPE,
      moduleEngineURI: schema.STRING_TYPE,
      classObj: schema.ANY_TYPE
    };
    validateObj({ obj: p, validation: _validation });

    const _moduleName = p.moduleName.trim().toLowerCase();

    const repoKey = this.#classesRepoBuildKey({ moduleEngineURI: p.moduleEngineURI, moduleName: _moduleName });
    if (!(this.#classesRepo.has(repoKey)))
      this.#classesRepo.set(repoKey, { class: p.classObj, cdnURI: '' });
    else
      throw new Error(`moduleEngineURI/moduleName already exists: ${repoKey}`);
  }

  /**
   Load module from URI and add a class with default name {DEFAULT_CLASSNAME} to the repository.
   If URI is "" or . or / or \, is set to ./${moduleName.trim().toLowerCase()}.js
   If URI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
   If URI is missing the ".js" extension, the extension is added
   * @param {{moduleName: string, moduleEngineURI: string}} p
   * @throws {Error} Will throw an error if URI/moduleName already exists, because we don't know if the module from the URI is the same as the one already loaded (could be loaded from a local object with `addClassFromObject`).
   * @throws {Error} Will throw an error if loading module fails.
   */
  async addClassFromURI (p) {
    validateObj({
      obj: p,
      validation: { moduleName: schema.STRING_TYPE, moduleEngineURI: schema.STRING_TYPE }
    });

    const _moduleName = p.moduleName.trim().toLowerCase();

    const repoKey = this.#classesRepoBuildKey({ moduleEngineURI: p.moduleEngineURI, moduleName: _moduleName });

    if (!(this.#classesRepo.has(repoKey))) {
      let _URI = p.moduleEngineURI.trim();
      if (['', '.', '/', './', '\\', '.\\'].includes(_URI))  // If moduleEngineURI is missing or . / /. \ \., is set to ./${_moduleName}.js
        _URI = `./${_moduleName}.js`;

      // DYNAMIC IMPORT (works with Deno and browser)
      let _lastImportError = '';
      for (const _cdnURI of this.#modulesLoader_Resolve(_URI)) {
        try {
          const _module = await import(_cdnURI);
          if (_module != null && _module[DEFAULT_CLASSNAME] != null) {
            this.#classesRepo.set(repoKey, { class: _module[DEFAULT_CLASSNAME], cdnURI: _cdnURI });
            return;
          }
        } catch (error) {
          _lastImportError = error.stack?.toString() ?? error.toString();  // save the last error and go on with the loop trying the next cdnURI
        }
      }
      throw new Error(`error loading module ${_URI}, error: ${_lastImportError}`);
    } else
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
    const _validation = {
      moduleName: schema.STRING_TYPE,
      moduleEngineURI: schema.STRING_TYPE
    };
    validateObj({ obj: p, validation: _validation });

    const _moduleName = p.moduleName.trim().toLowerCase();

    const _ret = this.#classesRepo.get(this.#classesRepoBuildKey({ moduleEngineURI: p.moduleEngineURI, moduleName: _moduleName }));
    if (_ret === undefined)
      return undefined;
    if (_ret.class == null || _ret.cdnURI == null)
      throw new Error('internal error, some property of the object loaded from the repo == null or undefined');
    return { ..._ret };  // return a shallow copy
  }

  /**
   * @param {Object} p
   * @param {string} p.moduleEngineURI
   * @param {string} p.moduleName
   * @return {string}
   */
  #classesRepoBuildKey ({ moduleEngineURI, moduleName }) {
    const _p = sanitizeObj({
      obj: { moduleEngineURI, moduleName },
      sanitization: { moduleEngineURI: schema.STRING_TYPE, moduleName: schema.STRING_TYPE },
      validate: true
    });
    return JSON.stringify({moduleEngineURI: _p.moduleEngineURI, moduleName: _p.moduleName});
  }
}
