export { sanitizeModuleData };

import * as CONST from '../../config/modules/_const.js';
import { ModuleData, schema, validateObj, sanitizeObj, eq2, parseYAML, parseJSON5 } from '../../deps.js';

/**
 * Sanitize and parse values of moduleData tables in place (without cloning moduleData).
 * tableName is matched between moduleData and moduleSanitization in a case insensitive & trim way.
 * sanitization and parsing is also done in a case insensitive & trim way, matching the keys of the object to sanitize to the sanitization object keys.
 * parsing is done before sanitization, with YAML or JSON5 (values from config/modules/_const.js), only for the keys specified in the sanitization object.
 * @param {Object} p
 * @param {ModuleData} p.moduleData
 * @param {{tableName: string, parse?: *, sanitization?: *, sanitizationOptions?: *}[]} p.moduleSanitization
 */
function sanitizeModuleData ({ moduleData, moduleSanitization }) {
  if (moduleData?.tables == null) return moduleData;
  if (moduleSanitization == null) return moduleData;

  validateObj({ obj: moduleSanitization, validation: { tableName: schema.STRING_TYPE, sanitization: schema.OBJECT_TYPE, sanitizationOptions: schema.OBJECT_TYPE + '?' } });

  // loop moduleData tables
  for (const _table of moduleData.tables) {
    // search for `_table.tableName` in `moduleSanitization` array (in a case insensitive way); if not found, `_pss` is undefined
    // if found, `_pss` contains the parsing and sanitization settings object for the table
    /** @type {{tableName: string, parse?: *, sanitization?: *, sanitizationOptions?: *} | undefined} */
    const _pss = moduleSanitization.find(_ => eq2(_.tableName, _table.tableName));

    // if `_pss` has a value, parse and sanitize `_table.table` with it
    if (_pss != null) {

      // if `_pss.parse` is not null and an object, parse with it
      if (_pss.parse != null && typeof _pss.parse === 'object') {
        // loop `_pss.parse` keys
        for (const _parseKey in _pss.parse) {
          // loop `_table.table` rows
          for (const _row of _table.table) {
            // loop `_row` keys
            for (const _rowKey in _row) {
              // if `_rowKey` matches `_parseKey` in a case insensitive way, parse `_row[_rowKey]` with `_pss.parse[_parseKey]`
              if (eq2(_rowKey, _parseKey)) {
                // switch over `_pss.parse[_parseKey]` values, matching them against CONST values
                switch (_pss.parse[_parseKey]) {
                  case CONST.YAML_PARSE:
                    _row[_rowKey] = parseYAML(_row[_rowKey]);
                    break;
                  case CONST.JSON5_PARSE:
                    _row[_rowKey] = parseJSON5(_row[_rowKey]);
                    break;
                  default:
                    throw new Error(`Unknown parse type: ${_pss.parse[_parseKey]}`);
                }
              }
            }
          }
        }
      }

      // if .sanitization is not null and an object, sanitize with it
      if (_pss.sanitization != null && typeof _pss.sanitization === 'object') {
        sanitizeObj(
          {
            obj: _table.table,
            sanitization: _pss.sanitization,
            options: _pss?.sanitizationOptions,
            keyInsensitiveMatch: true
          });
      }
    }
  }
  return moduleData;
}
