export { sanitizeModuleData };

import { ModuleData, schema, validateObj, sanitizeObj, eq2 } from '../../deps.js';

/**
 * Sanitize moduleData tables in place (without cloning moduleData).
 * tableName is matched between moduleData and moduleSanitization in a case insensitive & trim way.
 * sanitization is also done in a case insensitive & trim way, matching the keys of the object to sanitize to the sanitization object keys.
 * @param {Object} p
 * @param {ModuleData} p.moduleData
 * @param {{tableName: string, sanitization: *, sanitizationOptions?: *}[]} p.moduleSanitization
 */
function sanitizeModuleData ({ moduleData, moduleSanitization }) {
  if (moduleData?.tables == null) return moduleData;
  if (moduleSanitization == null) return moduleData;

  validateObj({ obj: moduleSanitization, validation: { tableName: schema.STRING_TYPE, sanitization: schema.OBJECT_TYPE, sanitizationOptions: schema.OBJECT_TYPE + '?' } });

  // loop moduleData tables
  for (const _table of moduleData.tables) {
    // search for `_table.tableName` in `moduleSanitization` array (in a case insensitive way); if not found, `_sanitization` is undefined
    const _sanitization = moduleSanitization.find(_ => eq2(_.tableName, _table.tableName));

    // if `_sanitization` has a value, sanitize `_table.table` with it
    if (!(_sanitization == null)) {
      sanitizeObj(
        {
          obj: _table.table,
          sanitization: _sanitization.sanitization,
          options: _sanitization?.sanitizationOptions,
          keyInsensitiveMatch: true
        });
    }
  }
  return moduleData;
}
