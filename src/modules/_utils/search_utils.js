export { xlookup, moduleDataLookup };

import { ModuleData, isNullOrWhiteSpace, toStringLowerCaseTrimCompare, sanitization as sanitizationUtils, caseInsensitiveCompare } from '../../deps.js';

/**
 * Search in ModuleData a table, then a value in a table, searching in each row for lookup_key and return_key. Sanitize the result if needed.
 * @param {ModuleData} moduleData
 * @param {{tableName: string, lookup_value: *, lookup_key: string, return_key: string, return_first_match?: boolean, string_insensitive_match?: boolean, sanitization?: string, sanitizationOptions?: Object }} opt
 * return_first_match default = true;
 * string_insensitive_match default = true; if true, convert lookup_value and lookup_array to string, to lowercase and trim before comparing.
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions if missing, no sanitizationOptions are passed to sanitization.
 * @returns {*}
 * */
function moduleDataLookup (moduleData, { tableName, lookup_value, lookup_key, return_key, return_first_match, string_insensitive_match, sanitization, sanitizationOptions }) {
  if (moduleData == null) return undefined;
  if (lookup_value == null) return undefined;
  if (isNullOrWhiteSpace(lookup_key)) return undefined;
  if (isNullOrWhiteSpace(return_key)) return undefined;

  if (return_first_match == null) return_first_match = true;
  if (string_insensitive_match == null) string_insensitive_match = true;

  let _ret = undefined;
  let _found = false;

  for (const _table of moduleData.tables) {
    if (caseInsensitiveCompare(_table.tableName, tableName)) {
      for (const row of _table.table) {
        // compare lookup_value with row[lookup_key] (case-insensitive or not)
        let _match = false;
        if (string_insensitive_match)
          _match = toStringLowerCaseTrimCompare(lookup_value, row[lookup_key]);
        else
          _match = lookup_value === row[lookup_key];

        if (_match) {
          if (return_first_match) {
            _ret = row[return_key];
            _found = true;
            break;  // exit loop
          }
          _ret = row[return_key];
        }
      }
    }
    if (return_first_match &&_found) break;  // exit loop
  }

  if (sanitization != null)
    return sanitizationUtils.sanitize({
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
 * string_insensitive_match default = true; if true, convert lookup_value and lookup_array to string, to lowercase and trim before comparing.
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions if missing, no sanitizationOptions are passed to sanitization.
 * @returns {*}
 * */
function xlookup ({ lookup_value, lookup_array, return_array, return_first_match, string_insensitive_match, sanitizationOptions, sanitization }) {
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
      _match = toStringLowerCaseTrimCompare(lookup_value, lookup_array[i]);
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
    return sanitizationUtils.sanitize({
      value: _ret,
      sanitization: sanitization,
      options: sanitizationOptions
    });

  return _ret;
}
