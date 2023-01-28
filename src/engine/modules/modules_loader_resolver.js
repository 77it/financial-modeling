export { modulesLoaderResolver };

/**
 * Function to get a list of URL from which import a module
 * @param {string} moduleUrl - The url of the module to resolve
 * @return {string[]} List of URL from which import a module
 */
function modulesLoaderResolver (moduleUrl) {
  let _cdnURI = moduleUrl.trim().replace(/\\/g, '/');  // trim & global replace of '\' with '/'

  const _ret = [];  // return array

  if (isGitHub(_cdnURI))  // If moduleEngineURI is a GitHub path is converted to a CDN path (e.g. jsdelivr)
  {
    _ret.push(gitHubURI2jsDelivr(_cdnURI));
    // TODO NOW add more cdn
    /*
    https://raw.githack.com/
    https://statically.io/
    Resolve restituisce come ultimo path anche github raw
    */
  }
  else // If moduleEngineURI is not a GitHub path
    _ret.push(_cdnURI);

  // loop return array: if some element is missing the ".js" extension from the url, add it
  for (let i = 0; i < _ret.length; i++) {
    if (_ret[i].slice(-3).toLowerCase() !== '.js')
      _ret[i] = `${_ret[i]}.js`;
  }

  return _ret;

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
