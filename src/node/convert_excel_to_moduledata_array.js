export { convertExcelToModuleDataArray };

import { execFileSync } from 'node:child_process';

import { readUtf8TextFileRemovingBOM } from './read_utf8_text_file_removing_bom.js';
import { deleteFile } from './delete_file.js';
import { platformIsWindows } from './platform_is_windows.js';

import { ModuleData } from '../engine/modules/module_data.js';
import { moduleDataArray_LoadFromJsonlFile } from './module_data_array__load_from_jsonl_file.js';

import { existsSync } from './exists_sync.js';
import { downloadFromUrl } from './download_from_url.js';

//#region OPTIONS
const OPTIONS__CONVERTER_EXE_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.6/Converter.exe';
const OPTIONS__CONVERTER_EXE_NAME = '../../bin/converter.exe';

//#endregion OPTIONS

/**
 * Convert Excel file to an array of `moduleData`
 * @param {Object} p
 * @param {string} p.excelInput - Excel file with user input
 * @return {Promise<ModuleData[]>} - Array of `ModuleData` objects
 */
async function convertExcelToModuleDataArray ({ excelInput }) {
  if (!platformIsWindows())
    throw new Error('platform not supported');

  // build a path with OPTIONS__CONVERTER_EXE_NAME and this file path + normalize the path for Windows by removing the leading slash if it exists
  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186
  // & https://developer.mozilla.org/en-US/docs/Web/API/URL
  const _converterExePath = new URL(OPTIONS__CONVERTER_EXE_NAME, import.meta.url).pathname;
  const converterExePath = _converterExePath.startsWith('/') ? _converterExePath.slice(1) : _converterExePath;

  // download and decompress OPTIONS__CONVERTER_EXE_GZ_URL
  if (!existsSync(converterExePath))
    await downloadFromUrl(
      { url: OPTIONS__CONVERTER_EXE_URL, filepath: converterExePath });

  //#region convert Excel input file to JSONL `modulesData` calling Converter program
  const jsonlOutput = excelInput + '.dump.jsonl.tmp';
  const tempErrorsFilePath = excelInput + '.errors.tmp';

  const args = [
    'excel-modules-to-jsonl-modules',
    '--input', excelInput,
    '--output', jsonlOutput,
    '--errors', tempErrorsFilePath
  ]

  const { stdout_string, exit_code } = (() => {
    try {
      // see https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
      // see https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback
      const stdout_string = execFileSync(converterExePath, args, {encoding: 'utf8'});  // will print stderr without intercepting it
      return {stdout_string: stdout_string, exit_code: 0};
    } catch (error) {
      console.log(error);
      return {stdout_string: '', exit_code: 1};
    }
  })();
  //#endregion convert Excel input file to JSONL `modulesData` calling Converter program

  // throw error if there are errors
  if (exit_code !== 0 || existsSync(tempErrorsFilePath)) {
    const errorsText = readUtf8TextFileRemovingBOM(tempErrorsFilePath);
    throw new Error(`Errors during conversion of the Excel input file: ${errorsText}`);
  }

  // throw error if output file does not exist
  if (!existsSync(jsonlOutput)) {
    throw new Error(`Errors during conversion of the Excel input file: output file ${jsonlOutput} does not exist`);
  }

  // load `jsonlOutput` JSONL file to `moduleData` array
  const moduleDataArray = await moduleDataArray_LoadFromJsonlFile(jsonlOutput);

  // delete temporary file
  deleteFile(jsonlOutput);

  // return `modulesData`
  return moduleDataArray;
}
