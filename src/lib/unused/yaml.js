// from 'json__json5__yaml__parse__benchmark.js'
// `parseJSONrelaxed` is quicker than `parseYAML`
// and JSONrelaxed has none of the parsing issues of YAML:
// YAML introduces ambiguity through multiple syntaxes hidden type coercions and inconsistent parser behavior
// while also exposing security risks like arbitrary object construction and resource exhaustion
// whereas JSON remains minimal explicit predictable and safe for interchange.
// then use `parseJSONrelaxed` instead of this library.
/*
Benchmark run on HP Ryzen 3 5300U connect to the power adapter.

records (n): 2000
iterations : 200
Parser                                   ms  ops/sec     bytes
-----------------------------------  ------  -------  --------
JSON.parse                            990.7      202  168.8 KB
parseJSONrelaxed                     1755.0      114  168.8 KB
parseJSONrelaxed (relaxed payload)   1997.0      100  186.4 KB
parseJSON5strict                     6970.5       29  168.8 KB
parseJSON5relaxed                    7719.9       26  168.8 KB
parseJSON5relaxed (relaxed payload)  8443.8       24  186.4 KB
parseYAML                            2655.8       75  168.8 KB
parseYAML (relaxed payload)          3389.9       59  205.9 KB

Parser                                  ms  ops/sec   bytes
-----------------------------------  -----  -------  ------
JSON.parse                            18.7   10,684  1.7 KB
parseJSONrelaxed                      26.8    7,465  1.7 KB
parseJSONrelaxed (relaxed payload)    25.8    7,762  1.9 KB
parseJSON5strict                     146.7    1,363  1.7 KB
parseJSON5relaxed                     97.6    2,049  1.7 KB
parseJSON5relaxed (relaxed payload)  108.5    1,844  1.9 KB
parseYAML                             35.8    5,584  1.7 KB
parseYAML (relaxed payload)           60.5    3,303  2.1 KB
 */

export { parseYAML, customParseYAML };

import { isNullOrWhiteSpace } from '../string_utils.js';

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
import yaml from '../../../vendor/js-yaml/js-yaml.mjs';
import { DATE_AS_LOCAL__OPT_KEY, DATE_EXTENDED_MATCH__OPT_KEY } from '../../../vendor/js-yaml/js-yaml.mjs';

/**
 * Parse a parseYAML string.
 * Non-standard YAML feature:
 * - if parsed object is null or undefined, returns the input value;
 * - parse string in the format YYYY-MM-DD as local dates instead of UTC; see https://github.com/nodeca/js-yaml/issues/91
 * - match as dates also strings in the format YYYY.MM.DD and YYYY/MM/DD other than the default YYYY-MM-DD
 * - after parsing, if the parsed object contains some null key, check if the key name contains a colon;
 *   if it's so, split the key name in key and value and parse the value as YAML.
 * @param {*} value
 * @returns {undefined | *} string if parsing input string goes in error, otherwise the parsed value; if input is not a string, returns the input value
 */
function customParseYAML (value) {
  try {
    if (value == null)
      return undefined;

    if (typeof value !== 'string')
      return value;

    // parse with null options and setting custom options
    const parsedObj = yaml.load(value, null, { [DATE_AS_LOCAL__OPT_KEY]: true, [DATE_EXTENDED_MATCH__OPT_KEY]: true });

    // if parsedObj is null or undefined, return the input value
    if (parsedObj == null)
      return value;

    // if parsedObj contains some null key, check if the key name contains a colon;
    // if so, split the key name in key and value and parse the value as YAML
    if (typeof parsedObj === 'object') {
      for (const key in parsedObj) {
        if (parsedObj[key] === null) {
          if (key.includes(':')) {
            // split the string in two parts (also if there are more than one colon)
            const keySplit = key.split(':');  // split the string in parts separated by colon (:)
            const keyName = keySplit.shift();  // return the first element and remove it from the array
            const valueName = keySplit.join(':');  // join the remaining elements adding back the colon (:)
            // if `keyName` is `true` (check for TypeScript) && not null/whitespace && if `keyName` is not already a key in the object, add key/value to the object
            // otherwise, do nothing and skip to the next key
            if (keyName && !isNullOrWhiteSpace(keyName) && !Object.keys(parsedObj).includes(keyName)) {
              parsedObj[keyName] = parseYAML(valueName);
              delete parsedObj[key];
            }
          }
        }
      }
    }

    // trim the key names from space, and replace them with not-spaced key names
    if (typeof parsedObj === 'object') {
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
    return value;
  }
}

/**
 * Parse a parseYAML string in a standard way.
 * @param {*} value
 * @returns {undefined | *} undefined if parsing input string goes in error, otherwise the parsed value; if input is not a string, returns the input value (unless is null -> return undefined)
 */
function parseYAML (value) {
  try {
    if (value == null)
      return undefined;

    if (typeof value !== 'string')
      return value;

    return yaml.load(value, null);  // parse with null options

  } catch (e) {
    return undefined;
  }
}
