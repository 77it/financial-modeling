export { searchDateKeys };

import { isNullOrWhiteSpace, parseJsonToLocalDate, isValidDate, stripTimeToLocalDate } from '../../deps.js';

/** Search in an object or Map, keys starting with a specific prefix (case-insensitive) that can be parsed as a Date.
 * If an object key is not parsable as a Date, it is ignored.
 * Return a new object with parseable keys and parsed dates as value (stripping the time part).
 * @param {Object} p
 * @param {*} p.obj
 * @param {string[]} p.prefix
 * @return {{key:string, date:Date}[]}
 */
function searchDateKeys ({ obj, prefix }) {
  try {
    /** @type {{key:string, date:Date}[]} */
    const _ret = [];

    if (obj == null || typeof obj !== 'object')
      return _ret;

    // build a key array, if obj is a map or an object
    const _keys = obj instanceof Map ? Array.from(obj.keys()) : Object.keys(obj);

    // loop prefix elements
    for (let i = 0; i < prefix.length; i++) {
      if (isNullOrWhiteSpace(prefix[i])) {  // if prefix[i] isNullOrWhiteSpace, search all keys
        for (const key of _keys) {
          const _parsedDate = parseJsonToLocalDate(key);
          if (isValidDate(_parsedDate))
            _ret.push({ key: key, date: stripTimeToLocalDate(_parsedDate) });
        }
      } else if (typeof prefix[i] !== 'string') {
        // do nothing
      } else {
        const _prefix_lowercase = prefix[i].toLowerCase();

        for (const key of _keys) {
          if (key.toLowerCase().startsWith(_prefix_lowercase)) {
            const _parsedDate = parseJsonToLocalDate(key.slice(prefix[i].length));
            if (isValidDate(_parsedDate))
              _ret.push({ key: key, date: stripTimeToLocalDate(_parsedDate) });
          }
        }
      }
    }

    // sort _ret array of objects by date key
    _ret.sort((a, b) => a.date.getTime() - b.date.getTime());

    return _ret;
  } catch (e) {
    return [];
  }
}
