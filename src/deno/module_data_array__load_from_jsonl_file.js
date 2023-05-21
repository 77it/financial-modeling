export { moduleDataArray_LoadFromJsonlFile };

import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';
import { ModuleData } from '../engine/modules/module_data.js';
import { win32 } from 'https://deno.land/std@0.182.0/path/mod.ts';

/**
 * Returns a ModuleData from a JSONL file
 * @param {URL | string} jsonlFilePath
 * @return {Promise<ModuleData[]>} deserialized ModuleData
 */
async function moduleDataArray_LoadFromJsonlFile (jsonlFilePath) {
  try {
    let _jsonlFilePath = (jsonlFilePath instanceof URL) ? win32.fromFileUrl(jsonlFilePath) : jsonlFilePath;
    const fileReader = await Deno.open(_jsonlFilePath);
    const jsonLines = [];

    for await (const line of readLines(fileReader))
      if (line.trim())
        jsonLines.push(line);
    fileReader.close();

    // loop jsonLines and parse content to ModuleData
    const moduleDataArray = [];
    for (const json of jsonLines)
      moduleDataArray.push(new ModuleData(JSON.parse(json)));

    return moduleDataArray
  } catch (error) {
    return [];
  }
}
