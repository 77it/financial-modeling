export { sanitizeModuleData };

import { ModuleData, validation, sanitization, toStringLowerCaseTrim } from '../../deps.js';

/**
 * Sanitize moduleData tables in place (without cloning moduleData).
 * tableName is case-insensitive.
 * @param {Object} p
 * @param {ModuleData} p.moduleData
 * @param {{tableName: string, sanitization: *, sanitizationOptions?: *}[]} p.moduleSanitization
 */
function sanitizeModuleData ({ moduleData, moduleSanitization }) {
  if (moduleData?.tables == null) return moduleData;
  if (moduleSanitization == null) return moduleData;

  validation.validateObj({ obj: moduleSanitization, validation: { tableName: validation.STRING_TYPE, sanitization: validation.OBJECT_TYPE, sanitizationOptions: validation.OBJECT_TYPE + '?' } });

  // convert `moduleSanitization` to an object `tableName` as key and `sanitization` as value
  /** @type {Record<string, any>} */
  const moduleSanitizationObj =  {};
  for (const _sanitization of moduleSanitization)
    moduleSanitizationObj[toStringLowerCaseTrim(_sanitization.tableName)] = _sanitization;

  // loop moduleData tables
  for (const table of moduleData.tables) {
    const _sanitization = moduleSanitizationObj[toStringLowerCaseTrim(table.tableName)];
    // if table.tableName is found in moduleSanitization keys, sanitize with moduleSanitization.sanitization
    if (!(_sanitization == null)) {
      sanitization.sanitizeObj(
        {
          obj: table.table,
          sanitization: _sanitization.sanitization,
          options: _sanitization?.sanitizationOptions
        });
    }
  }
  return moduleData;
}
