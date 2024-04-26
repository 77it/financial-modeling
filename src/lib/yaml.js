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
 * Parse a parseYAML string.
 * After parsing, if the parsed object contains some null key, check if the key name contains a colon;
 * if so, split the key name in key and value and parse the value as YAML.
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
    const parsedObj = yaml.load(value);

    // if parsedObj contains some null key, check if the key name contains a colon;
    // if so, split the key name in key and value and parse the value as YAML
    if (parsedObj !== null && typeof parsedObj === 'object') {
      for (const key in parsedObj) {
        if (parsedObj[key] === null) {
          if (key.includes(':')) {
            // split the string in two parts (also if there are more than one colon)
            const keySplit = key.split(':');
            const keyName = keySplit.shift();  // return the first element and remove it from the array
            const valueName = keySplit.join(':');  // join the remaining elements with the separator
            // if `keyName` is not undefined, add a new key to the object with the parsed value;
            // otherwise, do nothing and skip to the next key
            if (keyName) {
              parsedObj[keyName] = parseYAML(valueName);
              delete parsedObj[key];
            }
          }
        }
      }
    }

    // trim the key names from space, and replace them with not-spaced key names
    if (parsedObj !== null && typeof parsedObj === 'object') {
      for (const key in parsedObj) {
        const trimmedKey = key.trim();
        if (trimmedKey !== key) {
          parsedObj[trimmedKey] = parsedObj[key];
          delete parsedObj[key];
        }
      }
    }

    return parsedObj;

  } catch (e) {
    return undefined;
  }
}
