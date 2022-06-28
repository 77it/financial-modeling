export class ModulesLoader {
  /** contains id (URI/className) as key and a {class: *, cdnURI: string} as value
   * @type {Map<String, {class: *, cdnURI: string}>} */
  #classesRepo;
  #defaultClassName = 'Module';

  constructor () {
    this.#classesRepo = new Map();
  }

  /**
   * Add classes from object to the repository.
   * If URI/moduleName already exists, it is not added.
   * @param {{moduleName: string, URI: string, classObj: *}} p
   * @return {{success: boolean, error?: Object}} true if added, false if already exists
   */
  addClassFromObject ({ moduleName, URI, classObj }) {
    if (this.#classesRepo.get(this.#repoKeyBuilder(URI, moduleName)) === undefined) {
      this.#classesRepo.set(this.#repoKeyBuilder(URI, moduleName), {class: classObj, cdnURI: ""});
      return { success: true };
    }
    return { success: false, error: new Error('already exists') };
  }

  /**
   * Load module from URI and add a class with default name to the repository.
   * If URI/moduleName already exists, it is not added.
   * If URI is missing, is set to ./${moduleName}.js
   * If URI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
   * If is missing the ".js" extension from the file, is added
   * @param {{moduleName: string, URI: string}} p
   * @return {Promise<{success: boolean, error?: Object}>} true if added, false if already exists
   */
  async addClassFromURI ({ moduleName, URI }) {
    if (this.#classesRepo.get(this.#repoKeyBuilder(URI, moduleName)) === undefined) {
      try {
        let _cdnURI = URI;
        if (_cdnURI.trim() === '')  // If URI is missing, is set to ./${moduleName}.js
          _cdnURI = `./${moduleName}.js`;
        else if (isGitHub(_cdnURI))  // If URI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
          _cdnURI = gitHubURI2jsDelivr(_cdnURI);

        if (_cdnURI.slice(-3).toLowerCase() !== '.js')  // If is missing the ".js" extension from the file, is added
          _cdnURI = `${_cdnURI}.js`;

        // DYNAMIC IMPORT (works with deno and browser)
        const _module = (await import(_cdnURI));
        this.#classesRepo.set(this.#repoKeyBuilder(URI, moduleName), {class: _module[this.#defaultClassName], cdnURI: _cdnURI});
      } catch (error) {
        return { success: false, error: error };
      }
      return { success: true };
    }
    return { success: false, error: new Error('already exists') };

    /**
     * @param {string} URI
     * @return {boolean}
     */
    function isGitHub (URI) {
      // regex from https://github.com/jsdelivr/www.jsdelivr.com/blob/b61fc52e3e828ce0579e510be1c480c7610ef076/src/views/pages/github.html
      let pattern = /^https?:\/\/(?:github|raw\.githubusercontent)\.com\/([^/]+)\/([^/]+)(?:\/blob)?\/([^/]+)\/(.*)$/i;
      let match = pattern.exec(URI);
      if (match)
        return true;
      return false;
    }

    /**
     * @param {string} URI
     * @return {string}
     */
    function gitHubURI2jsDelivr (URI) {
      // regex from https://github.com/jsdelivr/www.jsdelivr.com/blob/b61fc52e3e828ce0579e510be1c480c7610ef076/src/views/pages/github.html
      let pattern = /^https?:\/\/(?:github|raw\.githubusercontent)\.com\/([^/]+)\/([^/]+)(?:\/blob)?\/([^/]+)\/(.*)$/i;
      let match = pattern.exec(URI);

      if (match) {
        let [, user, repo, version, file] = match;

        // tag/commit prefix
        return buildJsDelivrURI({ user: user, repo: repo, version: version, path: file });
      }

      throw Error();

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
  }

  /**
   Get class from the repository.
   * @param {{moduleName: string, URI: string}} p
   * @return {undefined | {class: *, cdnURI: string}}
   * */
  get ({ moduleName, URI }) {
    const _ret = this.#classesRepo.get(this.#repoKeyBuilder(URI, moduleName));
    if (_ret === undefined)
      return undefined;
    if (_ret.class == null || _ret.cdnURI == null)
      throw new Error("internal error, some property == null or undefined");
    return {..._ret};  // return a shallow copy
  }

  /**
   * @param {string} URI
   * @param {string} moduleName
   * @return {string}
   */
  #repoKeyBuilder (URI, moduleName) {
    return `${URI}/${moduleName}`;
  }
}
