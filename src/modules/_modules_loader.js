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
  #modulesLoaderResolver;

  /**
   * @param {{modulesLoaderResolver: modulesLoaderResolver}} p
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
   * @return {{success: boolean, error?: string}} true if added, false if already exists
   */
  addClassFromObject (p) {
    const validation = {
      moduleName: 'string',
      moduleEngineURI: 'string',
      classObj: 'any'
    };
    validateObj({ obj: p, validation: validation });

    const keyModule = ModulesLoader.#repoKeyBuilder(p.moduleEngineURI, p.moduleName);
    if (this.#classesRepo.get(keyModule) === undefined) {
      this.#classesRepo.set(keyModule, { class: p.classObj, cdnURI: '' });
      return { success: true };
    }
    return { success: false, error: `module ${keyModule} already exists` };
  }

  /**
   * Load module from URI and add a class with default name {#defaultClassName} to the repository.
   * If 'URI/moduleName' already exists, it is not added.
   * If URI is "" or . or / or \, is set to ./${moduleName}.js
   * If URI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
   * If is missing the ".js" extension from the URI, the extension is added
   * @param {{moduleName: string, moduleEngineURI: string}} p
   * @return {Promise<{success: boolean, error?: string}>} true if added, false if already exists
   */
  async addClassFromURI (p) {
    const validation = {
      moduleName: 'string',
      moduleEngineURI: 'string'
    };
    validateObj({ obj: p, validation: validation });

    const keyModule = ModulesLoader.#repoKeyBuilder(p.moduleEngineURI, p.moduleName);

    if (this.#classesRepo.get(keyModule) === undefined) {
      try {
        let _cdnURI = p.moduleEngineURI.trim().replace(/\\/g, '/');  // trim & global replace of '\' with '/'
        if (_cdnURI === '' || _cdnURI === '.' || _cdnURI === '/' || _cdnURI === './')  // If moduleEngineURI is missing or . or /, is set to ./${p.moduleName}.js
          _cdnURI = `./${p.moduleName}.js`;
        else if (isGitHub(_cdnURI))  // If moduleEngineURI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
          _cdnURI = gitHubURI2jsDelivr(_cdnURI);

        if (_cdnURI.slice(-3).toLowerCase() !== '.js')  // If it is missing the ".js" extension from the file, is added
          _cdnURI = `${_cdnURI}.js`;

        // DYNAMIC IMPORT (works with deno and browser)
        const _module = (await import(_cdnURI));
        this.#classesRepo.set(keyModule, { class: _module[this.#defaultClassName], cdnURI: _cdnURI });
      } catch (error) {
        return { success: false, error: error.stack?.toString() ?? error.toString() };
      }
      return { success: true };
    }
    return { success: false, error: `module ${keyModule} already exists` };

    //#region local functions
    /**
     * @param {string} moduleEngineURI
     * @return {boolean}
     */
    function isGitHub (moduleEngineURI) {
      // regex from https://github.com/jsdelivr/www.jsdelivr.com/blob/b61fc52e3e828ce0579e510be1c480c7610ef076/src/views/pages/github.html
      let pattern = /^https?:\/\/(?:github|raw\.githubusercontent)\.com\/([^/]+)\/([^/]+)(?:\/blob)?\/([^/]+)\/(.*)$/i;
      let match = pattern.exec(moduleEngineURI);
      return Boolean(match);
    }

    /**
     * @param {string} moduleEngineURI
     * @return {string}
     */
    function gitHubURI2jsDelivr (moduleEngineURI) {
      // regex from https://github.com/jsdelivr/www.jsdelivr.com/blob/b61fc52e3e828ce0579e510be1c480c7610ef076/src/views/pages/github.html
      let pattern = /^https?:\/\/(?:github|raw\.githubusercontent)\.com\/([^/]+)\/([^/]+)(?:\/blob)?\/([^/]+)\/(.*)$/i;
      let match = pattern.exec(moduleEngineURI);

      if (match) {
        let [, user, repo, version, file] = match;

        // tag/commit prefix
        return buildJsDelivrURI({ user: user, repo: repo, version: version, path: file });
      }

      throw new Error(`can't convert GitHub URL ${moduleEngineURI} to JsDelivr URL`);

      /**
       * @param {{user: string, repo: string, version: string, path: string }} p
       * @return {string}
       */
      function buildJsDelivrURI ({ user, repo, version, path }) {
        if (version === 'latest') {
          return `https://cdn.jsdelivr.net/gh/${user}/${repo}/${path}`;
        }

        return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${version}/${path}`;
      }
    }

    //#endregion local functions
  }

  /**
   Get a class from the repository. The returned class is not initialized and must be initialized with 'new'.
   If 'URI/moduleName' is non-existent, returns undefined.
   * @param {{moduleName: string, moduleEngineURI: string}} p
   * @return {undefined | {class: *, cdnURI: string}}
   * */
  get (p) {
    const validation = {
      moduleName: 'string',
      moduleEngineURI: 'string'
    };
    validateObj({ obj: p, validation: validation });

    const _ret = this.#classesRepo.get(ModulesLoader.#repoKeyBuilder(p.moduleEngineURI, p.moduleName));
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
  static #repoKeyBuilder (moduleEngineURI, moduleName) {
    return `${moduleEngineURI}/${moduleName}`;
  }
}
