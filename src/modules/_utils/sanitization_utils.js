export { sanitizeModuleData };

import * as CONST from '../../config/modules/_const.js';
import { ModuleData, schema, validateObj, sanitizeObj, eq2, parseYAML, parseJSON5 } from '../../deps.js';

/**
 * Sanitize and parse values of moduleData tables in place (without cloning moduleData).
 * tableName is matched between moduleData and moduleSanitization in a case insensitive & trim way.
 * sanitization and parsing is also done in a case insensitive & trim way, matching the keys of the object to sanitize to the sanitization object keys.
 * parsing is done before sanitization, with YAML or JSON5 (values from config/modules/_const.js)
 * @param {Object} p
 * @param {ModuleData} p.moduleData
 * @param {{tableName: string, parsing: *, sanitization: *, sanitizationOptions?: *}[]} p.moduleSanitization
 */
function sanitizeModuleData ({ moduleData, moduleSanitization }) {
  if (moduleData?.tables == null) return moduleData;
  if (moduleSanitization == null) return moduleData;

  validateObj({ obj: moduleSanitization, validation: { tableName: schema.STRING_TYPE, sanitization: schema.OBJECT_TYPE, sanitizationOptions: schema.OBJECT_TYPE + '?' } });

  // loop moduleData tables
  for (const _table of moduleData.tables) {
    // search for `_table.tableName` in `moduleSanitization` array (in a case insensitive way); if not found, `_pss` is undefined
    // if found, `_pss` contains the parsing and sanitization settings object for the table
    const _pss = moduleSanitization.find(_ => eq2(_.tableName, _table.tableName));

    // if `_pss` has a value, parse and sanitize `_table.table` with it
    if (_pss != null) {
      // if `_pss.parsing` is not null and an object, parse with it
      if (_pss.parsing != null && typeof _pss.parsing === 'object') {
        // loop `_pss.parsing` keys
        for (const _parseKey in _pss.parsing) {
          // loop `_table.table` keys
          for (const _tableKey in _table.table) {
            // if `_tableKey` matches `_parseKey` in a case insensitive way, parse `_table.table[_tableKey]` with `_pss.parsing[_parseKey]`
            if (eq2(_tableKey, _parseKey)) {
              // switch over `_pss.parsing[_parseKey]` values, matching them against CONST values
              switch (_pss.parsing[_parseKey]) {
                case CONST.YAML_PARSING:
                  _table.table[_tableKey] = parseYAML(_table.table[_tableKey]);
                  break;
                case CONST.JSON5_PARSING:
                  _table.table[_tableKey] = parseJSON5(_table.table[_tableKey]);
                  break;
                default:
                  throw new Error(`Unknown parsing type: ${_pss.parsing[_parseKey]}`);
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
