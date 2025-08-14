export { convertExcelToModuleDataArray };

import { convertExcelToJsonlFile } from './convert_excel_to_jsonl_file.js';

import { deleteFile } from './delete_file.js';

import { ModuleData } from '../engine/modules/module_data.js';
import { moduleDataArray_LoadFromJsonlFile } from './module_data_array__load_from_jsonl_file.js';

/**
 * Convert Excel file to an array of `moduleData`
 * @param {Object} p
 * @param {string} p.excelInput - Excel file with user input
 * @return {Promise<ModuleData[]>} - Array of `ModuleData` objects
 */
async function convertExcelToModuleDataArray ({ excelInput }) {
  const jsonlOutput = excelInput + '.dump.jsonl.tmp';

  await convertExcelToJsonlFile({ excelInput, jsonlOutput });

  // load `jsonlOutput` JSONL file to `moduleData` array
  const moduleDataArray = moduleDataArray_LoadFromJsonlFile(jsonlOutput);

  // delete temporary file
  deleteFile(jsonlOutput);

  // return `modulesData`
  return moduleDataArray;
}
