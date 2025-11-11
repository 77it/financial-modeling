// We use here the standard JSON.parse ignoring the possibility to have numbers longer than what JavaScript can handle.
// See notes below about this choice.



export { moduleDataArray_LoadFromJsonlFile };

import { ModuleData } from '../engine/modules/module_data.js';
import { readUtf8TextFileRemovingBOM } from './read_utf8_text_file_removing_bom.js';
import { isNullOrWhiteSpace } from '../lib/string_utils.js';
import { platformIsWindows } from './platform_is_windows.js';

/**
 * Returns a ModuleData from a JSONL file
 * @param {URL | string} jsonlFilePath
 * @return {ModuleData[]} deserialized ModuleData
 */
function moduleDataArray_LoadFromJsonlFile (jsonlFilePath) {
  const _jsonlFilePath = (jsonlFilePath instanceof URL) ? jsonlFilePath.pathname : jsonlFilePath;
  // remove leading slash if platform is Windows
  const __jsonlFilePath = (platformIsWindows() && _jsonlFilePath.startsWith('/')) ? _jsonlFilePath.slice(1) : _jsonlFilePath;

  const jsonTxt = readUtf8TextFileRemovingBOM(__jsonlFilePath);

  // split jsonTxt in lines (LF, CRLF)
  const jsonLines = jsonTxt.split(/\r?\n/);

  // loop jsonLines and parse content to ModuleData
  const moduleDataArray = [];
  for (const json of jsonLines) {
    if (!isNullOrWhiteSpace(json)) {
      // We use here the standard JSON.parse ignoring the possibility to have numbers longer than
      // what JavaScript can handle, because the source is a JSONL file exporting data from Excel
      // so numbers are limited to what Excel can handle (15 digits), which is manageable by JavaScript too.
      //
      // We could use a library that converts every number to string (deserializing directly to string)
      // but for speed reasons we avoid that here, by now.
      // A library could be https://github.com/josdejong/lossless-json (forked in https://github.com/77it/lossless-json)
      moduleDataArray.push(new ModuleData(JSON.parse(json)));
    }
  }

  return moduleDataArray;
}
