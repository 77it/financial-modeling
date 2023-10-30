export { xlookup, moduleDataLookup, searchDateKeys };

import { ModuleData, isNullOrWhiteSpace, sanitize, eq2, get2, parseJsonDate, isValidDate, stripTime } from '../../deps.js';

/**
 * Search in ModuleData a table, then a value in a table, then a value in a column, returning the value of another column in the same row.
 * Search value `lookup_value` in column `lookup_key` in table `tableName` of ModuleData;
 * returns the value of column `return_key` in the same row.
 * Optionally sanitize the result; if no match is found, return undefined, optionally sanitized.
 * @param {ModuleData} moduleData
 * @param {{tableName: string, lookup_value: *, lookup_key: string, return_key: string, return_first_match?: boolean, string_insensitive_match?: boolean, sanitization?: string, sanitizationOptions?: Object }} opt
 * return_first_match default = true.
 * string_insensitive_match default = true; if true, `lookup_key` and `return_key` are get directly and if not found they are matched with all keys after trim & case insensitive;
 *   `lookup_value`, if is a string, is matched with values after trim & case insensitive.
 * sanitization if missing, no sanitization is performed.
 * sanitizationOptions if missing, no sanitizationOptions are passed to sanitization.
 * @returns {*}
 * */
function moduleDataLookup (
  moduleData,
  {
    tableName,
    lookup_value,
    lookup_key,
    return_key,
    return_first_match,
    string_insensitive_match,
    sanitization,
    sanitizationOptions
  }) {
  if (moduleData == null) return undefined;
  if (lookup_value == null) return undefined;
  if (isNullOrWhiteSpace(lookup_key)) return undefined;
  if (isNullOrWhiteSpace(return_key)) return undefined;

  if (return_first_match == null) return_first_match = true;
  if (string_insensitive_match == null) string_insensitive_match = true;

  let _ret = undefined;
  let _found = false;

  for (const _table of moduleData.tables) {
    if (eq2(_table.tableName, tableName)) {
      for (const row of _table.table) {
        // compare lookup_value with row[lookup_key] (trim & case-insensitive with eq() and get2())
        let _match = false;
        if (string_insensitive_match)
          _match = eq2(lookup_value, get2(row, lookup_key));
        else
          _match = lookup_value === row[lookup_key];

        if (_match) {
          // get from row[return_key] (trim & case-insensitive with get2())
          if (return_first_match) {
            _ret = string_insensitive_match ? get2(row, return_key) : row[return_key];
            _found = true;
            break;  // exit loop
          } else {
            _ret = string_insensitive_match ? get2(row, return_key) : row[return_key];
          }
        }
      }
    }
    if (return_first_match && _found) break;  // exit loop
  }

  if (sanitization != null)
    return sanitize({
      value: _ret,
      sanitization: sanitization,
      options: sanitizationOptions
    });

  return _ret;
}

// inspired to https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
/**
 * Search a value in a column, return the value of another column in the same row. Sanitize the result if needed.
 * @param {{lookup_value: *, lookup_array: *[], return_array: *[], return_first_match?: boolean, string_insensitive_match?: boolean, sanitization?: string, sanitizationOptions?: Object }} p
 * return_first_match default = true;
 * string_insensitive_match default = true; `lookup_value`, if is a string, is matched with values in `lookup_array` after trim & case insensitive.
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions if missing, no sanitizationOptions are passed to sanitization.
 * @returns {*}
 * */
function xlookup (
  {
    lookup_value,
    lookup_array,
    return_array,
    return_first_match,
    string_insensitive_match,
    sanitizationOptions,
    sanitization
  }) {
  if (lookup_value == null) return undefined;
  if (!Array.isArray(lookup_array)) return undefined;
  if (!Array.isArray(return_array)) return undefined;
  if (lookup_array.length !== return_array.length) return undefined;

  if (return_first_match == null) return_first_match = true;
  if (string_insensitive_match == null) string_insensitive_match = true;

  let _ret = undefined;

  // loop lookup_array
  for (let i = 0; i < lookup_array.length; i++) {
    // compare lookup_value with lookup_array[i] (case-insensitive or not)
    let _match = false;
    if (string_insensitive_match)
      _match = eq2(lookup_value, lookup_array[i]);
    else
      _match = lookup_value === lookup_array[i];

    if (_match) {
      if (return_first_match) {
        _ret = return_array[i];
        break;  // exit loop
      }
      _ret = return_array[i];
    }
  }

  if (sanitization != null)
    return sanitize({
      value: _ret,
      sanitization: sanitization,
      options: sanitizationOptions
    });

  return _ret;
}

/** Search in an object keys starting with a specific prefix (case-insensitive) that can be parsed as a Date.
 * If an object key is not parsable as a Date, it is ignored.
 * Return an array of objects with key and date (stripping the time part).
 * @param {Object} p
 * @param {*} p.obj
 * @param {string} p.prefix
 * @return {{key:string, date:Date}[]}
 */
function searchDateKeys ({ obj, prefix }) {
  try {
    // search data column headers in _table.table[0]
    /** @type {{key:string, date:Date}[]} */
    const _ret = [];

    if (obj == null || typeof obj !== 'object')
      return _ret;

    if (typeof prefix !== 'string' || isNullOrWhiteSpace(prefix))
      return _ret;

    const _prefix_lowercase = prefix.toLowerCase();

    for (const key of Object.keys(obj)) {
      if (key.toLowerCase().startsWith(_prefix_lowercase)) {
        const _parsedDate = parseJsonDate(key.slice(prefix.length), { asUTC: false });
        if (isValidDate(_parsedDate))
          _ret.push({ key: key, date: stripTime(_parsedDate) });
      }
    }

    return _ret;
  } catch (e) {
    return [];
  }
}
