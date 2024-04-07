export { parseYAML };

// see github   https://github.com/nodeca/js-yaml
// online demo   https://nodeca.github.io/js-yaml/
// npm   https://www.npmjs.com/package/js-yaml
// specs   https://yaml.org/spec/1.2.2/
import yaml from '../../vendor/js-yaml/js-yaml.mjs';

/**
 * Parse a parseYAML string
 * @param {*} value
 * @returns {undefined | *} undefined if not valid, otherwise the parsed value
 */
function parseYAML (value) {
  try {
    if (value == null)
      return undefined;

    //@ts-ignore
    return yaml.load(value);
  } catch (e) {
    return undefined;
  }
}
