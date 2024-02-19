export { moduleDataArray_LoadFromJsonlFile };

import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';
import { ModuleData } from '../engine/modules/module_data.js';

/**
 * Returns a ModuleData from a JSONL file
 * @param {URL | string} jsonlFilePath
 * @return {Promise<ModuleData[]>} deserialized ModuleData
 */
async function moduleDataArray_LoadFromJsonlFile (jsonlFilePath) {
  // see https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname
  const _jsonlFilePath = (jsonlFilePath instanceof URL) ? jsonlFilePath.pathname : jsonlFilePath;
  const __jsonlFilePath = _jsonlFilePath.startsWith('/') ? _jsonlFilePath.slice(1) : _jsonlFilePath;
  const fileReader = await Deno.open(__jsonlFilePath);
  const jsonLines = [];

  for await (const line of readLines(fileReader))
    if (line.trim())
      jsonLines.push(line);
  fileReader.close();

  // loop jsonLines and parse content to ModuleData
  const moduleDataArray = [];
  for (const json of jsonLines)
    moduleDataArray.push(new ModuleData(JSON.parse(json)));

  return moduleDataArray;
}
