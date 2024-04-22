export { moduleDataArray_LoadFromJsonlFile };

import { ModuleData } from '../engine/modules/module_data.js';
import { readUtf8TextFileRemovingBOM } from './read_utf8_text_file_removing_bom.js';
import { isNullOrWhiteSpace } from '../lib/string_utils.js';

/**
 * Returns a ModuleData from a JSONL file
 * @param {URL | string} jsonlFilePath
 * @return {Promise<ModuleData[]>} deserialized ModuleData
 */
async function moduleDataArray_LoadFromJsonlFile (jsonlFilePath) {
  const _jsonlFilePath = (jsonlFilePath instanceof URL) ? jsonlFilePath.pathname : jsonlFilePath;
  // remove leading slash
  const __jsonlFilePath = _jsonlFilePath.startsWith('/') ? _jsonlFilePath.slice(1) : _jsonlFilePath;

  const jsonTxt = readUtf8TextFileRemovingBOM(__jsonlFilePath);

  // split jsonTxt in lines (LF, CRLF)
  const jsonLines = jsonTxt.split(/\r?\n/);

  // loop jsonLines and parse content to ModuleData
  const moduleDataArray = [];
  for (let json of jsonLines) {
    if (!isNullOrWhiteSpace(json))
      moduleDataArray.push(new ModuleData(JSON.parse(json)));
  }

  return moduleDataArray;
}
