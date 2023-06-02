export { sanitizeModuleData };

import { ModuleData, sanitization, ifStringLowerCaseTrim } from '../../deps.js';

/**
 * Sanitize moduleData tables in place (without cloning moduleData).
 * @param {Object} p
 * @param {ModuleData} p.moduleData
 * @param {{tableName: string, sanitization: *, sanitizationOptions?: *}[]} p.moduleSanitization
 */
function sanitizeModuleData ({ moduleData, moduleSanitization }) {
  if (moduleData?.tables == null) return moduleData;
  if (moduleSanitization == null) return moduleData;

  // convert `moduleSanitization` to a map with `tableName` as key and `sanitization` as value
  const moduleSanitizationMap = new Map();
  for (const _sanitization of moduleSanitization)
    moduleSanitizationMap.set(ifStringLowerCaseTrim(_sanitization.tableName), _sanitization);

  // loop moduleData tables
  for (const table of moduleData.tables) {
    // if table.tableName is found in moduleSanitization keys, sanitize with moduleSanitization.sanitization
    if (moduleSanitizationMap.has(ifStringLowerCaseTrim(table.tableName))) {
      sanitization.sanitizeObj(
        {
          obj: table.table,
          sanitization: moduleSanitizationMap.get(table.tableName).sanitization,
          options: moduleSanitizationMap.get(table.tableName).sanitizationOptions
        });
    }
  }
  return moduleData;
}
