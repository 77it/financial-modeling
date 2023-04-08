export { convertExcelToModuleDataArray };

import { platform } from 'https://deno.land/std@0.171.0/node/process.ts';
import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';
import { win32 } from "https://deno.land/std@0.182.0/path/mod.ts";

import { ModuleData } from '../engine/modules/module_data.js';
import { moduleData_LoadFromJson } from '../engine/modules/module_data__load_from_json.js';

import { existSync } from './exist_sync.js';
import { downloadAndDecompressGzip } from './download_and_decompress_gzip.js';

//#region OPTIONS
const OPTIONS__CONVERTER_EXE_GZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter.exe.gz';
const OPTIONS__CONVERTER_EXE_NAME = 'converter.exe';

//#endregion OPTIONS

/**
 * Convert Excel file to an array of `moduleData`
 * @param {Object} p
 * @param {string} p.excelInput - Excel file with user input
 * @return {Promise<ModuleData[]>} - Array of `ModuleData` objects
 */
async function convertExcelToModuleDataArray ({ excelInput}) {
  if (!platformIsWindows)
    throw new Error('platform not supported');

  // build a path with OPTIONS__CONVERTER_EXE_NAME and this file path + normalize to win32 path
  const converterExePath = win32.fromFileUrl(new URL(OPTIONS__CONVERTER_EXE_NAME, import.meta.url));  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186

  // create temporary file to store errors
  const tempErrorsFilePath = await Deno.makeTempFile();

  // download and decompress Converter.exe.gz
  if (!existSync(converterExePath))
    await downloadAndDecompressGzip(
      { url: OPTIONS__CONVERTER_EXE_GZ_URL, path: converterExePath });

  // convert Excel input file to JSONL `modulesData` calling Converter program  // see  https://deno.land/manual@v1.29.3/examples/subprocess
  const jsonlExcelFilename = excelInput + '.dump.jsonl.tmp';
  const p = Deno.run({ cmd: [converterExePath, 'excel-modules-to-jsonl-modules', '--input', excelInput, '--output', jsonlExcelFilename, '--errors', tempErrorsFilePath] });
  await p.status();  // await its completion
  p.close();  // close the process

  // throw error if there are errors
  if (existSync(tempErrorsFilePath)){
    const errorsText = Deno.readTextFileSync(tempErrorsFilePath);  // see https://deno.land/api@v1.29.4?s=Deno.readTextFileSync
    throw new Error(`Errors during conversion of the Excel input file: ${errorsText}`);
  }

  // deserialize JSONL `modulesData`
  const fileReader = await Deno.open(jsonlExcelFilename);
  const moduleDataArray = [];
  for await (const line of readLines(fileReader))
    if (line.trim())
      moduleDataArray.push(moduleData_LoadFromJson(line));
  fileReader.close();

  // delete temporary file
  try {
    Deno.removeSync(jsonlExcelFilename);
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
  return (platform === 'win32');
}

//#endregion private functions
