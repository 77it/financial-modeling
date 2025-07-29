export { moduleDataLookup };

import { ModuleData, isNullOrWhiteSpace, sanitize, schema, eq2, get2 } from '../../deps.js';

/**
 * Search table `tableName` in ModuleData, then value `lookup_value` in column `lookup_column`,
 * then returns the value of column `return_column` in the same row.
 *
 * Optionally sanitize the result; if no match is found, return undefined, optionally sanitized.
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions is optional.
 *
 * If `string_insensitive_match` is true: `tableName` and `lookup_value` (if string) are matched in a case insensitive & trim way.
 * string_insensitive_match default = true.
 *
 * `lookup_column` and `return_column` are get directly and if not found they are matched with all keys in a case insensitive & trim way.
 *
 * `return_first_match` if true, return the first match, otherwise the last match.
 * return_first_match default = true.
 *
 * @param {ModuleData} moduleData
 * @param {{tableName: string, lookup_value: *, lookup_column: string, return_column: string, return_first_match?: boolean, string_insensitive_match?: boolean, sanitization?: *, sanitizationOptions?: Object }} opt
 * @returns {*}
 */
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
  if (isNullOrWhiteSpace(tableName)) return undefined;
  if (lookup_value == null) return undefined;  // can be any kind of value other than null or undefined
  if (isNullOrWhiteSpace(lookup_column)) return undefined;
  if (isNullOrWhiteSpace(return_column)) return undefined;

  const _return_first_match = sanitize({ value: return_first_match, sanitization: schema.BOOLEAN_TYPE + schema.OPTIONAL})
    ?? true;  // defaults to true

  const _string_insensitive_match = sanitize({ value: string_insensitive_match, sanitization: schema.BOOLEAN_TYPE + schema.OPTIONAL })
    ?? true;  // defaults to true

  let _ret = undefined;
  let _found = false;

  for (const _table of moduleData.tables) {
    if (_string_insensitive_match ? eq2(_table.tableName, tableName) : _table.tableName === tableName) {
      for (const row of _table.table) {
        // get `lookup_column` from `row[lookup_column]` (key are compared with trim & case-insensitive with get2())
        // then compare `lookup_value` with get value (values are compared with trim & case-insensitive with eq2())
        let _match = false;
        if (_string_insensitive_match)
          _match = eq2(lookup_value, get2(row, lookup_column));
        else
          _match = lookup_value === row[lookup_column];

        if (_match) {
          // get from row[return_column] (trim & case-insensitive with get2())
          if (_return_first_match) {
            _ret = _string_insensitive_match ? get2(row, return_column) : row[return_column];
            _found = true;
            break;  // exit loop
          } else {
            _ret = _string_insensitive_match ? get2(row, return_column) : row[return_column];
          }
        }
      }
    }
    if (_return_first_match && _found) break;  // exit loop
  }

  if (sanitization != null)
    return sanitize({
      value: _ret,
      sanitization: sanitization,
      options: sanitizationOptions
    });

  return _ret;
}
