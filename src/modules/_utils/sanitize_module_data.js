export { sanitizeModuleData };

import * as CONST from '../../config/modules/_const.js';
import { ModuleData, schema, validate, sanitize, eq2, get2, parseYAML, parseJSON5 } from '../deps.js';

/**
 * Parse then Sanitize values of moduleData tables in place (without cloning moduleData).
 * tableName is matched between moduleData and sanitization in a case insensitive & trim way.
 * Parsing and Sanitization are also done in a case insensitive & trim way, matching the keys of the object to sanitize to the sanitization object keys.
 * Parsing is done before Sanitization, with YAML or JSON5 (values from config/modules/_const.js), only for the specified keys.
 * @param {Object} p
 * @param {ModuleData} p.moduleData
 * @param {*} p.tablesInfo
 * @throws {Error} if moduleData is not an instance of `ModuleData` or if tablesInfo is not an object
 */
function sanitizeModuleData ({ moduleData, tablesInfo }) {
  if (moduleData == null || !(moduleData instanceof ModuleData))
    throw new Error('moduleData must be an instance of ModuleData');
  if (tablesInfo == null)
    throw new Error('tablesInfo must be an object');

  if (moduleData?.tables == null) return moduleData;

  // loop moduleData tables to parse and sanitize them, table by table
  for (const _table of moduleData.tables) {
    // search for `_table.tableName` in `tablesInfo` (in a case insensitive way); if not found, `_pss` is undefined
    // if found, `_pss` contains the tablesInfo property that matches `_table.tableName` (case insensitive),
    // with parsing and sanitization settings object for the table
    /** @type {* | undefined} */
    const _tableInfo = Object.values(tablesInfo).find(_ => eq2(_.tableName, _table.tableName));

    if (_tableInfo == null) {
      continue;
    }

    /* _tableInfo sample structure
    {
      tableName: 'tableA',
      description: 'Description for table A',  // optional
      columns: {
        COLUMN_A: {
          name: 'columnA',
          sanitization: schema.STRING_TYPE,
          description: 'Description for column A',  // optional
          parse: CONST.YAML_PARSE,  // optional
          values: {  // optional
            ACCOUNTING_TYPE: 'type',
            ACCOUNTING_VS_TYPE: 'vs type'
          }
        },
        COLUMN_B: {
          name: 'columnB',
          sanitization: schema.ANY_TYPE,
        }
      },
      sanitizationOptions: {  // optional
        defaultDate: new Date(0)
      }
    }
    */

    // loop all `_tableInfo.columns` to find, in each row of `_table` the keys (columns) that matches `_tableInfo.columns.KEY`
    // and parse the content of the `_table` key if `_tableInfo.columns.MATCHING_COLUMN_NAME.parse` is true
    // and sanitize the content of the `_table` key with `_tableInfo.columns.MATCHING_COLUMN_NAME.sanitization`
    for (const _tableInfo_column of Object.values(_tableInfo.columns)) {
      // loop `_table` rows
      for (const _table_row of _table.table) {
        for (const _table_row_key of Object.keys(_table_row)) {
          if (!eq2(_table_row_key, _tableInfo_column.name))
            continue;

          // if `_tableInfo_column.parse` is defined, parse the value
          if (_tableInfo_column.parse != null) {
            switch (_tableInfo_column.parse) {
              case CONST.YAML_PARSE:
                _table_row[_table_row_key] = parseYAML(_table_row[_table_row_key]);
                break;
              case CONST.JSON5_PARSE:
                _table_row[_table_row_key] = parseJSON5(_table_row[_table_row_key]);
                break;
              default:
                throw new Error(`Unknown parse type: ${_tableInfo_column.parse}`);
            }
          }

          // if `_tableInfo_column.sanitization` is not defined, throws, because sanitization is mandatory
          if (_tableInfo_column.sanitization == null) {
            throw new Error(`Sanitization is mandatory for column ${_table_row_key} in table ${_table.tableName}, but is missing in tablesInfo ${JSON.stringify(_tableInfo)}`);
          }
          
          // sanitize the table value
          _table_row[_table_row_key] = sanitize(
            {
              value: _table_row[_table_row_key],
              sanitization: _tableInfo_column.sanitization,
              options: _tableInfo.sanitizationOptions,
              keyInsensitiveMatch: true
            });
        }
      }
    }
  }
  return moduleData;
}
