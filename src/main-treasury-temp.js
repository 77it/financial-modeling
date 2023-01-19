// run with
// `deno run --allow-read --allow-write THIS-FILE.js --input INPUT --output OUTPUT --errors ERRORS`

export { main };

//#region settings
const OPTIONS = {};
OPTIONS.FILES = {};
OPTIONS.FILES.CONVERTER_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v1.0.6/Converter.exe.gz';
OPTIONS.FILES.CONVERTER_EXEGZ_PATH = './converter.exe';
//#endregion settings

import { parse } from "https://deno.land/std@0.172.0/flags/mod.ts";
import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';
import { writeAllSync } from "https://deno.land/std@0.173.0/streams/write_all.ts";

import { downloadAndDecompressGzip } from './deno/downloadAndDecompressGzip.js';
import { existSync } from './deno/existSync.js';
import { ModuleData, ModuleDataLoader } from './engine/modules/module_data.js';
import { engine } from './engine/engine.js';

// call `main` function only if there are command line arguments  (useful to not call `main` function with the following code when importing this file)
if (Deno.args.length !== 0)
{
  const args = parse(Deno.args)  // parse command line arguments
  await main({input: args?.input, output: args?.output, errors: args?.errors});
}

/**
 * @param {Object} p
 * @param {string} p.input - Excel file with user input
 * @param {string} p.output - JSONL file with simulation output (accounting writing transactions)
 * @param {string} p.errors - Text file created only if there are errors
 */
async function main ({ input, output, errors }) {
  // convert Excel input file to `modulesData`
  const moduleDataArray = await convertExcelToModuleDataArray({ input, errors });

  const trnDumpFile = await Deno.open(output, {  // create/overwrite file   // see https://deno.land/api@v1.29.1?s=Deno.open
    create: true,
    write: true,
  });

  try {
    // run simulation
    engine({
      input: moduleDataArray,
      appendTrnDump: function(dump) {
        writeAllSync(trnDumpFile, new TextEncoder().encode(dump));  // function to write dump to file // see https://deno.land/std@0.173.0/streams/write_all.ts?s=writeAllSync
      }
    });
  }
  finally {
    trnDumpFile.close();
  }
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
  const jsonlExcelFilename = input + '.dump.jsonl.tmp';
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
  try {
    Deno.removeSync(jsonlExcelFilename);
  } catch (_) { }

  // return `modulesData`
  return moduleDataArray;
}
