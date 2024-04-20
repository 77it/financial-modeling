export { parseYAML };

// YAML specs
// https://yaml.org/spec/1.2.2/
//
// YAML differences between version 1.1 and 1.2
// https://eemeli.org/yaml/#version-differences

// nodeca/js-yaml library
//
// github   https://github.com/nodeca/js-yaml   (6.2K stars, MIT license, last commit Aug 27, 2022)
// online demo   https://nodeca.github.io/js-yaml/
// npm   https://www.npmjs.com/package/js-yaml
import yaml from '../../vendor/js-yaml/js-yaml.mjs';

/**
 * Parse a parseYAML string
 * @param {*} value
 * @returns {undefined | *} undefined if parsing input string goes in error, otherwise the parsed value; if input is not a string, returns the input value
 */
function parseYAML (value) {
  try {
    if (value == null)
      return undefined;

    if (typeof value !== 'string')
      return value;

    //@ts-ignore
    return yaml.load(value);
  } catch (e) {
    return undefined;
  }
}
