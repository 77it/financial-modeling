export { moduleData_LoadFromJsonFile };

import { ModuleData } from './module_data.js';

/**
 * Returns a ModuleData from a JSON string
 * @param {string} json - ModuleData's Json
 * @return {ModuleData} deserialized ModuleData
 */
function moduleData_LoadFromJsonFile (json) {
  return new ModuleData(JSON.parse(json));
}
