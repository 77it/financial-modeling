export { sanitizeModuleData };

import { ModuleData, schema, validateObj, sanitizeObj, toStringLowerCaseTrim } from '../../deps.js';

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

  validateObj({ obj: moduleSanitization, validation: { tableName: schema.STRING_TYPE, sanitization: schema.OBJECT_TYPE, sanitizationOptions: schema.OBJECT_TYPE + '?' } });

  // convert `moduleSanitization` to an object with `tableName` as key and `sanitization` as value
  /** @type {Record<string, any>} */
  const moduleSanitizationObj =  {};
  for (const _sanitization of moduleSanitization)
    moduleSanitizationObj[toStringLowerCaseTrim(_sanitization.tableName)] = _sanitization;

  // loop moduleData tables
  for (const _currTab of moduleData.tables) {
    // get case-insensitive `table.tableName` key from `moduleSanitizationObj` object
    const _sanitization = moduleSanitizationObj[toStringLowerCaseTrim(_currTab.tableName)];
    // if `table.tableName` is found in `moduleSanitizationObj` keys, sanitize `_currTab.table` with `_sanitization.sanitization`
    if (!(_sanitization == null)) {
      sanitizeObj(
        {
          obj: _currTab.table,
          sanitization: _sanitization.sanitization,
          options: _sanitization?.sanitizationOptions
        });
    }
  }
  return moduleData;
}
