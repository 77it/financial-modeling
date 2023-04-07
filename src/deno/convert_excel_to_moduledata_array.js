export { convertExcelToModuleDataArray };

import { platform } from 'https://deno.land/std@0.171.0/node/process.ts';
import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';

import { moduleData_LoadFromJson } from '../engine/modules/module_data__load_from_json.js';

import { existSync } from './existSync.js';
import { downloadAndDecompressGzip } from './downloadAndDecompressGzip.js';

//#region OPTIONS
const OPTIONS__CONVERTER_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter.exe.gz';
const OPTIONS__CONVERTER_EXEGZ_PATH = './converter.exe';
//#endregion OPTIONS

/**
 * Convert Excel file to an array of `moduleData`
 * @param {Object} p
 * @param {string} p.excelUserInput - Excel file with user input
 * @param {string} p.errors - Text file created only if there are errors
 * @return {Promise<ModuleData[]>} - Array of `ModuleData` objects
 */
async function convertExcelToModuleDataArray ({ excelUserInput, errors }) {
  if (!platformIsWindows)
    throw new Error('platform not supported');

  // download and decompress Converter.exe.gz
  if (!existSync(OPTIONS__CONVERTER_EXEGZ_PATH))
    await downloadAndDecompressGzip(
      { url: OPTIONS__CONVERTER_EXEGZ_URL, path: OPTIONS__CONVERTER_EXEGZ_PATH });

  // convert Excel input file to JSONL `modulesData` calling Converter program  // see  https://deno.land/manual@v1.29.3/examples/subprocess
  const jsonlExcelFilename = excelUserInput + '.dump.jsonl.tmp';
  const p = Deno.run({ cmd: [OPTIONS__CONVERTER_EXEGZ_PATH, 'excel-modules-to-jsonl-modules', '--input', excelUserInput, '--output', jsonlExcelFilename, '--errors', errors] });
  await p.status();  // await its completion
  p.close();  // close the process

  // throw error if there are errors
  if (existSync(errors))
    throw new Error(`Errors during conversion of the Excel input file. See ${errors} file.`);

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