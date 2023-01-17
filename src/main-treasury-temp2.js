//#region settings
import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';

const OPTIONS = {};
OPTIONS.FILES = {};
OPTIONS.FILES.CONVERTER_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v1.0.6/Converter.exe.gz';
OPTIONS.FILES.CONVERTER_EXEGZ_PATH = './converter.exe';
//#endregion settings

import { downloadAndDecompressGzip } from './deno/downloadAndDecompressGzip.js';
import { existSync } from './deno/existSync.js';
import { ModuleData, ModuleDataLoader } from './engine/modules/module_data.js';

/**
 * @param {Object} p
 * @param {string} p.input - Excel file with user input
 * @param {string} p.output - JSONL file with simulation output (accounting writing transactions)
 * @param {string} p.errors - Text file created only if there are errors
 */
export async function main ({ input, output, errors }) {
  // convert Excel input file to `modulesData`
  const moduleDataArray = await convertExcelToModuleDataArray({ input, errors });

  // TODO * chiama engine.js passando modulesData[]
  console.dir(moduleDataArray);
}

/**
 * @param {Object} p
 * @param {string} p.input - Excel file with user input
 * @param {string} p.errors - Text file created only if there are errors
 * @return {Promise<ModuleData[]>} - Array of `ModuleData` objects
 */
async function convertExcelToModuleDataArray ({ input, errors}) {
  // download and decompress Converter.exe.gz
  if (!existSync(OPTIONS.FILES.CONVERTER_EXEGZ_PATH))
    await downloadAndDecompressGzip(
      { url: OPTIONS.FILES.CONVERTER_EXEGZ_URL, path: OPTIONS.FILES.CONVERTER_EXEGZ_PATH });

  // convert Excel input file to JSONL `modulesData` calling Converter program  // see  https://deno.land/manual@v1.29.3/examples/subprocess
  const jsonlExcelFilename = input + '.jsonl.tmp';
  const p = Deno.run({ cmd: [OPTIONS.FILES.CONVERTER_EXEGZ_PATH, 'excel-modules-to-jsonl-modules', '--input', input, '--output', jsonlExcelFilename, '--errors', errors] });
  await p.status();  // await its completion
  p.close();  // close the process

  // throw error if there are errors
  if (existSync(errors))
    throw new Error(`Errors during conversion of the Excel input file. See ${errors} file.`);

  // deserialize JSONL `modulesData`
  const fileReader = await Deno.open(jsonlExcelFilename);
  const moduleDataArray = [];
  for await (const line of readLines(fileReader))
    moduleDataArray.push(ModuleDataLoader(line));
  fileReader.close();

  // delete temporary file
  Deno.removeSync(jsonlExcelFilename);

  // return `modulesData`
  return moduleDataArray;
}
