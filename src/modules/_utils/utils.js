export { sanitizeModuleData };

import { ModuleData, sanitization } from '../../deps.js';

/**
 * Sanitize moduleData tables in place (without cloning moduleData).
 * @param {Object} p
 * @param {ModuleData} p.moduleData
 * @param {{tableName: string, sanitization: *, sanitizationOptions?: *}[]} p.moduleSanitization
 */
function sanitizeModuleData ({ moduleData, moduleSanitization }) {
  // convert `moduleSanitization` to a map with `tableName` as key and `sanitization` as value
  const moduleSanitizationMap = new Map();
  for (const _sanitization of moduleSanitization)
    moduleSanitizationMap.set(_sanitization.tableName, _sanitization);

  // loop moduleData tables
  for (const table of moduleData.tables) {
    // if table.tableName is found in moduleSanitization keys, sanitize with moduleSanitization.sanitization
    if (moduleSanitizationMap.has(table.tableName.toLowerCase())) {
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

// TODO funzione di modules/utils che crea una voce di cassa a completamento dello sbilancio corrente (es VsCash)
// con nome e tipo di default, presi da Config.
// Parametri: ledger, unitName
