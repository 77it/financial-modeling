export { moduleDataArray_LoadFromJsonlFile };

import readline from 'node:readline';
import fs from 'node:fs';
import { ModuleData } from '../engine/modules/module_data.js';

/**
 * Returns a ModuleData from a JSONL file
 * @param {URL | string} jsonlFilePath
 * @return {Promise<ModuleData[]>} deserialized ModuleData
 */
async function moduleDataArray_LoadFromJsonlFile (jsonlFilePath) {
  // see https://nodejs.org/api/readline.html
  const _jsonlFilePath = (jsonlFilePath instanceof URL) ? jsonlFilePath.pathname : jsonlFilePath;
  const __jsonlFilePath = _jsonlFilePath.startsWith('/') ? _jsonlFilePath.slice(1) : _jsonlFilePath;

  const fileStream = fs.createReadStream(__jsonlFilePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const jsonLines = [];
  for await (const line of rl) {
    if (line?.trim())
      jsonLines.push(line);
  }
  fileStream.close();

  // loop jsonLines and parse content to ModuleData
  const moduleDataArray = [];
  for (const json of jsonLines)
    moduleDataArray.push(new ModuleData(JSON.parse(json)));

  return moduleDataArray;
}
