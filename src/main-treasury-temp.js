// run with
// `deno run --allow-read --allow-write THIS-FILE.js --input INPUT --output OUTPUT --errors ERRORS`

export { main };

//#region settings
const OPTIONS = {};
OPTIONS.FILES = {};
OPTIONS.FILES.CONVERTER_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v1.0.6/Converter.exe.gz';
OPTIONS.FILES.CONVERTER_EXEGZ_PATH = './converter.exe';
//#endregion settings

import { parse } from 'https://deno.land/std@0.172.0/flags/mod.ts';
import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';
import { writeAllSync } from 'https://deno.land/std@0.173.0/streams/write_all.ts';

import { downloadAndDecompressGzip } from './deno/downloadAndDecompressGzip.js';
import { existSync } from './deno/existSync.js';
import { ModuleData } from './engine/modules/module_data.js';
import { moduleData_LoadFromJsonFile } from './engine/modules/module_data__load_from_json_file.js';
import { modulesLoader_Resolve } from './engine/modules/modules_loader__resolve.js';
import { engine } from './engine/engine.js';

// call `main` function only if there are command line arguments  (useful to not call `main` function with the following code when importing this file)
if (Deno.args.length !== 0) {
  const args = parse(Deno.args);  // parse command line arguments
  await main({ excelUserInput: args?.input, output: args?.output, errors: args?.errors });
}

/**
 * @param {Object} p
 * @param {string} p.excelUserInput - Excel file with user input
 * @param {string} p.output - JSONL file with simulation output (accounting writing transactions)
 * @param {string} p.errors - Text file created only if there are errors
 */
async function main ({ excelUserInput, output, errors }) {
  // convert Excel input file to `modulesData`
  const moduleDataArray = await _convertExcelToModuleDataArray({ excelUserInput, errors });

  // create/overwrite trnDump file   // see https://deno.land/api@v1.29.1?s=Deno.open
  const trnDumpFileWriter = await Deno.open(output, { create: true, write: true, truncate: true });

  // create/overwrite errorsDump file
  const errorsDumpFileWriter = await Deno.open(errors, { create: true, write: true, truncate: true });

  // get engine from `moduleDataArray` or from `./engine/engine.js` file
  const _engine = await _getEngine(moduleDataArray);

  try {
    // run simulation
    engine({
      userInput: moduleDataArray,
      appendTrnDump: function (dump) {
        writeAllSync(trnDumpFileWriter, new TextEncoder().encode(dump));  // function to write dump to file // see https://deno.land/std@0.173.0/streams/write_all.ts?s=writeAllSync
      },
      modulesLoader_Resolve: modulesLoader_Resolve  // pass a resolver loaded alongside this module; in that way the resolver can be more up to date than the one that exist alongside engine.js
    });
  } catch (error) {
    const _error = error.stack?.toString() ?? error.toString();
    console.log(_error);
    writeAllSync(errorsDumpFileWriter, new TextEncoder().encode(_error));
  } finally {
    trnDumpFileWriter.close();
    errorsDumpFileWriter.close();
  }
}

/**
 @private
 * @param {Object} p
 * @param {string} p.excelUserInput - Excel file with user input
 * @param {string} p.errors - Text file created only if there are errors
 * @return {Promise<ModuleData[]>} - Array of `ModuleData` objects
 */
async function _convertExcelToModuleDataArray ({ excelUserInput, errors }) {
  // download and decompress Converter.exe.gz
  if (!existSync(OPTIONS.FILES.CONVERTER_EXEGZ_PATH))
    await downloadAndDecompressGzip(
      { url: OPTIONS.FILES.CONVERTER_EXEGZ_URL, path: OPTIONS.FILES.CONVERTER_EXEGZ_PATH });

  // convert Excel input file to JSONL `modulesData` calling Converter program  // see  https://deno.land/manual@v1.29.3/examples/subprocess
  const jsonlExcelFilename = excelUserInput + '.dump.jsonl.tmp';
  const p = Deno.run({ cmd: [OPTIONS.FILES.CONVERTER_EXEGZ_PATH, 'excel-modules-to-jsonl-modules', '--input', excelUserInput, '--output', jsonlExcelFilename, '--errors', errors] });
  await p.status();  // await its completion
  p.close();  // close the process

  // throw error if there are errors
  if (existSync(errors))
    throw new Error(`Errors during conversion of the Excel input file. See ${errors} file.`);

  // deserialize JSONL `modulesData`
  const fileReader = await Deno.open(jsonlExcelFilename);
  const moduleDataArray = [];
  for await (const line of readLines(fileReader))
    moduleDataArray.push(moduleData_LoadFromJsonFile(line));
  fileReader.close();

  // delete temporary file
  try {
    Deno.removeSync(jsonlExcelFilename);
  } catch (_) { }

  // return `modulesData`
  return moduleDataArray;
}

/**
 @private
 * Returns engine function, from `moduleDataArray` or from local engine file
 * @param {ModuleData[]} moduleDataArray
 * @return Promise<any> - Engine function
 */
async function _getEngine (moduleDataArray) {

  let engineUrl = null;

  for (const moduleData of moduleDataArray) {
    if (moduleData.moduleName === 'SETTINGS')
      for (const _table of moduleData.tables) {
        if (_table.tableName === 'SET')
          for (const row of _table.table) {
            if (row?.UNIT.toString().trim() === '$' && row?.NAME.toString().trim().toUpperCase() === '$ENGINE')
              engineUrl = row?.VALUE.toString().trim();
          }
      }
  }

  if (engineUrl) {
    // DYNAMIC IMPORT (works with Deno and browser)
    // inspired to ModulesLoader.addClassFromURI
    let _lastImportError = '';
    for (const _cdnURI of modulesLoader_Resolve(engineUrl)) {
      try {
        const _module = (await import(_cdnURI));
        if (_module != null && _module['engine'] != null) {
          return _module['engine'];
        }
      } catch (error) {
        _lastImportError = error.stack?.toString() ?? error.toString();  // save the last error and go on with the loop trying the next cdnURI
      }
    }
    throw new Error(`error loading module ${engineUrl}, error: ${_lastImportError}`);
  }

  // fallback to local `engine`
  return engine;
}
