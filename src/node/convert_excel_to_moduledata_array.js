export { convertExcelToModuleDataArray };

import fs from 'node:fs';
import process from "node:process";

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
  if (!platformIsWindows)
    throw new Error('platform not supported');

  // build a path with OPTIONS__CONVERTER_EXE_NAME and this file path + normalize to windows path
  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186
  // & https://developer.mozilla.org/en-US/docs/Web/API/URL
  const _converterExePath = (new URL(OPTIONS__CONVERTER_EXE_NAME, import.meta.url)).pathname;
  const converterExePath = _converterExePath.startsWith('/') ? _converterExePath.slice(1) : _converterExePath;

  // download and decompress OPTIONS__CONVERTER_EXE_GZ_URL
  if (!existsSync(converterExePath))
    await downloadFromUrl(
      { url: OPTIONS__CONVERTER_EXE_URL, filepath: converterExePath });

  // convert Excel input file to JSONL `modulesData` calling Converter program  // see  https://deno.land/manual@v1.36.4/examples/subprocess
  const jsonlOutput = excelInput + '.dump.jsonl.tmp';
  const tempErrorsFilePath = excelInput + '.errors.tmp';
  const command = new Deno.Command(converterExePath, {
    args: [
      'excel-modules-to-jsonl-modules',
      '--input', excelInput,
      '--output', jsonlOutput,
      '--errors', tempErrorsFilePath
    ]
  });
  const { code, stdout, stderr } = await command.output();  // await its completion

  // throw error if there are errors
  if (code !== 0 || existsSync(tempErrorsFilePath)) {
    const errorsText = fs.readFileSync(tempErrorsFilePath, 'utf8');  // see https://nodejs.org/api/fs.html#fsreadfilesyncpath-options
    throw new Error(`Errors during conversion of the Excel input file: ${errorsText}`);
  }

  // throw error if output file does not exist
  if (!existsSync(jsonlOutput)) {
    throw new Error(`Errors during conversion of the Excel input file: output file ${jsonlOutput} does not exist`);
  }

  // load `jsonlOutput` JSONL file to `moduleData` array
  const moduleDataArray = await moduleDataArray_LoadFromJsonlFile(jsonlOutput);

  // delete temporary file
  try {
    fs.unlinkSync(jsonlOutput);
  } catch (_) { }

  // return `modulesData`
  return moduleDataArray;
}

//#region private functions
/**
 @private
 Convert Excel input file to an array of `moduleData`
 * @return {boolean} - true if the platform is Windows
 */
function platformIsWindows () {
  // see https://deno.land/std@0.171.0/node/process.ts?s=platform
  // see also https://nodejs.org/api/process.html#process_process_platform
  //const platforms = ['aix', 'android', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32'];
  return (process.platform === 'win32');
}

//#endregion private functions
