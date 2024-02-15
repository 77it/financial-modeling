export { convertExcelToModuleDataArray };

import process from "node:process";
import * as windows from "https://deno.land/std@0.205.0/path/windows/mod.ts";

import { ModuleData } from '../engine/modules/module_data.js';
import { moduleDataArray_LoadFromJsonlFile } from './module_data_array__load_from_jsonl_file.js';

import { existSync } from './exist_sync.js';
import { downloadAndDecompressGzip } from './download_and_decompress_gzip.js';

//#region OPTIONS
const OPTIONS__CONVERTER_EXE_GZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.6/Converter.exe.gz';
const OPTIONS__CONVERTER_EXE_NAME = 'converter.exe';

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
  const converterExePath = windows.fromFileUrl(new URL(OPTIONS__CONVERTER_EXE_NAME, import.meta.url));  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186

  // create temporary file to store errors
  const tempErrorsFilePath = await Deno.makeTempFile();

  // download and decompress OPTIONS__CONVERTER_EXE_GZ_URL
  if (!existSync(converterExePath))
    await downloadAndDecompressGzip(
      { url: OPTIONS__CONVERTER_EXE_GZ_URL, path: converterExePath });

  // convert Excel input file to JSONL `modulesData` calling Converter program  // see  https://deno.land/manual@v1.36.4/examples/subprocess
  const jsonlOutput = excelInput + '.dump.jsonl.tmp';
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
  if (code !== 0 || existSync(tempErrorsFilePath)) {
    const errorsText = Deno.readTextFileSync(tempErrorsFilePath);  // see https://deno.land/api@v1.29.4?s=Deno.readTextFileSync
    throw new Error(`Errors during conversion of the Excel input file: ${errorsText}`);
  }

  // throw error if output file does not exist
  if (!existSync(jsonlOutput)) {
    const errorsText = Deno.readTextFileSync(tempErrorsFilePath);  // see https://deno.land/api@v1.29.4?s=Deno.readTextFileSync
    throw new Error(`Errors during conversion of the Excel input file: output file ${jsonlOutput} does not exist`);
  }

  // load `jsonlOutput` JSONL file to `moduleData` array
  const moduleDataArray = await moduleDataArray_LoadFromJsonlFile(jsonlOutput);

  // delete temporary file
  try {
    Deno.removeSync(jsonlOutput);
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
