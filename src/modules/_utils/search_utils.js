export { xlookup, moduleDataLookup, searchDateKeys };

import { ModuleData, isNullOrWhiteSpace, sanitize, eq2, get2, parseJsonToLocalDate, isValidDate, stripTimeToLocalDate } from '../../deps.js';

/**
 * Search table `tableName` in ModuleData, then value `lookup_value` in column `lookup_column`,
 * then returns the value of column `return_column` in the same row.
 * Optionally sanitize the result; if no match is found, return undefined, optionally sanitized.
 * If `string_insensitive_match` is true: `tableName` and `lookup_value` (if string) are matched in a case insensitive & trim way,
 * `lookup_column` and `return_column` are get directly and if not found they are matched with all keys in a case insensitive & trim way.
 * @param {ModuleData} moduleData
 * @param {{tableName: string, lookup_value: *, lookup_column: string, return_column: string, return_first_match?: boolean, string_insensitive_match?: boolean, sanitization?: string, sanitizationOptions?: Object }} opt
 * return_first_match default = true;
 * string_insensitive_match default = true;
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions is optional.
 * @returns {*}
 * */
function moduleDataLookup (
  moduleData,
  {
    tableName,
    lookup_value,
    lookup_column,
    return_column,
    return_first_match,
    string_insensitive_match,
    sanitization,
    sanitizationOptions
  }) {
  if (moduleData == null) return undefined;
  if (lookup_value == null) return undefined;
  if (isNullOrWhiteSpace(lookup_column)) return undefined;
  if (isNullOrWhiteSpace(return_column)) return undefined;

  if (return_first_match == null) return_first_match = true;
  if (string_insensitive_match == null) string_insensitive_match = true;

  let _ret = undefined;
  let _found = false;

  for (const _table of moduleData.tables) {
    if (string_insensitive_match ? eq2(_table.tableName, tableName) : _table.tableName === tableName) {
      for (const row of _table.table) {
        // get `lookup_column` from `row[lookup_column]` (key are compared with trim & case-insensitive with get2())
        // then compare `lookup_value` with get value (values are compared with trim & case-insensitive with eq2())
        let _match = false;
        if (string_insensitive_match)
          _match = eq2(lookup_value, get2(row, lookup_column));
        else
          _match = lookup_value === row[lookup_column];

        if (_match) {
          // get from row[return_column] (trim & case-insensitive with get2())
          if (return_first_match) {
            _ret = string_insensitive_match ? get2(row, return_column) : row[return_column];
            _found = true;
            break;  // exit loop
          } else {
            _ret = string_insensitive_match ? get2(row, return_column) : row[return_column];
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
 * Search value `lookup_value` in `lookup_array`, then return the value of `return_array` in the same row.
 * Sanitize the result if needed.
 * If `string_insensitive_match` is true: `lookup_value` (if string) is matched in a case insensitive & trim way,
 * @param {{lookup_value: *, lookup_array: *[], return_array: *[], return_first_match?: boolean, string_insensitive_match?: boolean, sanitization?: string, sanitizationOptions?: Object }} p
 * return_first_match default = true;
 * string_insensitive_match default = true;
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions is optional.
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

/** Search in an object or Map keys starting with a specific prefix (case-insensitive) that can be parsed as a Date.
 * If an object key is not parsable as a Date, it is ignored.
 * Return a new object with parseable keys and parsed dates as value (stripping the time part).
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

    // build a key array, if obj is a map or an object
    const _keys = obj instanceof Map ? Array.from(obj.keys()) : Object.keys(obj);

    if (isNullOrWhiteSpace(prefix)) {  // if prefix isNullOrWhiteSpace, search all keys
      for (const key of _keys) {
        const _parsedDate = parseJsonToLocalDate(key);
        if (isValidDate(_parsedDate))
          _ret.push({ key: key, date: stripTimeToLocalDate(_parsedDate) });
      }
    } else if (typeof prefix !== 'string') {
      // do nothing
    } else {
      const _prefix_lowercase = prefix.toLowerCase();

      for (const key of _keys) {
        if (key.toLowerCase().startsWith(_prefix_lowercase)) {
          const _parsedDate = parseJsonToLocalDate(key.slice(prefix.length));
          if (isValidDate(_parsedDate))
            _ret.push({ key: key, date: stripTimeToLocalDate(_parsedDate) });
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
