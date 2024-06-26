// BEWARE: to serve GitHub files you can activate also GitHub Pages, to serve files in this way:
// https://77it.github.io/financial-modeling/src/lib/result.js
//
// JS file served by GitHub Pages are accepted by Deno, Node.js and browsers.

export { modulesLoader_Resolve };

/**
 * Function to resolve a module URI to a list of CDN URI from which import the module; if the URI is not a GitHub path, the URI is returned as is
 * CDN supported: jsdelivr, githack, statically.io, GitHub raw
 * @param {string} moduleUrl - The url of the module to resolve
 * @return {string[]} List of URL from which import a module
 */
function modulesLoader_Resolve (moduleUrl) {
  let _cdnURI = moduleUrl.trim().replace(/\\/g, '/');  // trim & global replace of '\' with '/'

  const _ret = [];  // return array

  const splitGitHubURIParts = splitGitHubURI(_cdnURI);
  if (splitGitHubURIParts)  // If _cdnURI is a GitHub path, is converted to a series of CDN path (e.g. jsdelivr)
  {
    _ret.push(buildJsDelivrURI(splitGitHubURIParts));
    _ret.push(buildGithackURI(splitGitHubURIParts));
    _ret.push(buildStaticallyIoURI(splitGitHubURIParts));
    //_ret.push(DONT_USE__WRONG_MIME_TYPE__buildGitHubRawURI(splitGitHubURIParts));
  } else // If moduleEngineURI is not a GitHub path, return the original URI
    _ret.push(_cdnURI);

  // loop return array: if some element is missing an extension from the url, add it
  for (let i = 0; i < _ret.length; i++) {
    const ext = _ret[i].slice(-3).toLowerCase();
    if (ext !== '.js' && ext !== '.mjs' && ext !== '.cjs' && ext !== '.ts')
      _ret[i] = `${_ret[i]}.js`;
  }

  // MAYBE_TODO: in the future we can eventually:
  // * shuffle the array to balance the load on the various CDN
  // * add more CDN to the list
  // * duplicate the CDN entries to try the CDN more than once

  return _ret;

  //#region local functions
  /**
   * Split a GitHub URI in its components; returns null if URI is not a GitHub URI
   * @param {string} URI
   * @return {{user: string, repo: string, version: string, path: string } | null}
   */
  function splitGitHubURI (URI) {
    // regex from https://github.com/jsdelivr/www.jsdelivr.com/blob/b61fc52e3e828ce0579e510be1c480c7610ef076/src/views/pages/github.html
    let pattern = /^https?:\/\/(?:github|raw\.githubusercontent)\.com\/([^/]+)\/([^/]+)(?:\/blob)?\/([^/]+)\/(.*)$/i;
    let match = pattern.exec(URI);

    if (match) {
      let [, user, repo, version, path] = match;
      return { user, repo, version, path };
    }

    return null;
  }

  /**
   * Build a jsdelivr URI   https://www.jsdelivr.com/
   * @param {{user: string, repo: string, version: string, path: string }} p
   * @return {string}
   */
  function buildJsDelivrURI ({ user, repo, version, path }) {
    if (version === 'latest') {
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}/${path}`;
    }

    return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${version}/${path}`;
  }

  /**
   * Build a githack URI   https://raw.githack.com/
   * @param {{user: string, repo: string, version: string, path: string }} p
   * @return {string}
   */
  function buildGithackURI ({ user, repo, version, path }) {
    return `https://rawcdn.githack.com/${user}/${repo}/${version}/${path}`;
  }

  /**
   * Build a statically.io URI   https://statically.io/
   * @param {{user: string, repo: string, version: string, path: string }} p
   * @return {string}
   */
  function buildStaticallyIoURI ({ user, repo, version, path }) {
    return `https://cdn.statically.io/gh/${user}/${repo}/${version}/${path}`;
  }

  /**
   * Don't use this functions, because raw.githubusercontent.com doesn't serve the correct MIME type for JavaScript files
   * serving them as text/plain instead of text/javascript.
   *
   * Use the other CDNs instead or serve the file with GitHub Pages.
   *
   * For more information see https://stackoverflow.com/a/52921967/5288052
   * & https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#aside_%E2%80%94_.mjs_versus_.js
   * & https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#troubleshooting
   *
   * Build a GitHub raw URI
   * @param {{user: string, repo: string, version: string, path: string }} p
   * @return {string}
   */
  function DONT_USE__WRONG_MIME_TYPE__buildGitHubRawURI ({ user, repo, version, path }) {
    return `https://raw.githubusercontent.com/${user}/${repo}/${version}/${path}`;
  }
  //#endregion local functions
}
