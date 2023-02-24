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
import { ModulesLoader } from './modules/_modules_loader.js';
import { ModuleData } from './engine/modules/module_data.js';
import { Module } from './modules/_sample_module.js';
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
 * @param {boolean} [p.debug=false] - Optional debug flag
 */
async function main ({ excelUserInput, output, errors, debug = false }) {
  // create/overwrite trnDump file   // see https://deno.land/api@v1.29.1?s=Deno.open
  const trnDumpFileWriter = await Deno.open(output, { create: true, write: true, truncate: true });

  // create/overwrite errorsDump file
  const errorsDumpFileWriter = await Deno.open(errors, { create: true, write: true, truncate: true });

  let _exitCode = 0;

  try {
    // convert Excel input file to an array of `moduleData`
    const _moduleDataArray = await _convertExcelToModuleDataArray({ excelUserInput, errors });

    // get ModulesLoader class from `moduleDataArray` or from `'./modules/_modules_loader.js'` file
    const _modulesLoaderClass = await _getObject_FromUri_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      moduleName: 'SETTINGS', tableName: 'SET', unitName: '$', settingName: '$MODULESLOADER',
      objectName: 'ModulesLoader',
      debug: debug, defaultDebugObject: ModulesLoader
    });
    // init the module loader passing a resolver loaded alongside this module; in that way the resolver can be more up to date than the one that exist alongside engine.js
    const _modulesLoader = new _modulesLoaderClass({ modulesLoader_Resolve });

    /** Array of module classes
     * @type {Module[]} */
    const _modulesArray = await _init_modules_classes__loading_Modules_fromUri(
      { modulesLoader: _modulesLoader, moduleDataArray: _moduleDataArray });

    // get engine from `moduleDataArray` or from `./engine/engine.js` file
    const _engine = await _getObject_FromUri_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      moduleName: 'SETTINGS', tableName: 'SET', unitName: '$', settingName: '$ENGINE',
      objectName: 'engine',
      debug: debug, defaultDebugObject: engine
    });

    /**
     * Callback to dump the transactions
     * @param {string} dump */
    const _appendTrnDump = function (dump) {
      writeToStream(trnDumpFileWriter, dump);
    };

    // run simulation
    /** @type {Result} */
    const _engine_result = await _engine({
      modulesData: _moduleDataArray,
      modules: _modulesArray,
      appendTrnDump: _appendTrnDump
    });

    if (!_engine_result.success) {
      writeToStream(errorsDumpFileWriter, _engine_result.error);
      _exitCode = 1;
    }
  } catch (error) {
    const _error = error.stack?.toString() ?? error.toString();
    console.log(_error);
    writeToStream(errorsDumpFileWriter, _error);
    _exitCode = 1;
  } finally {
    trnDumpFileWriter.close();
    errorsDumpFileWriter.close();
    Deno.exit(_exitCode);
  }

  //#region local functions
  /**
   * Write text to stream
   * see https://deno.land/std@0.173.0/streams/write_all.ts?s=writeAllSync
   * @param {*} stream
   * @param {string} text
   */
  function writeToStream (stream, text) {
    writeAllSync(stream, new TextEncoder().encode(text));
  }

  //#endregion local functions
}

//#region private functions
/**
 @private
 Convert Excel input file to an array of `moduleData`
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
 * @param {Object} p
 * @param {ModuleData[]} p.moduleDataArray
 * @param {string} p.moduleName
 * @param {string} p.tableName
 * @param {string} p.unitName
 * @param {string} p.settingName
 * @param {string} p.objectName
 * @param {boolean} p.debug - Debug flag: when true, the engine function is returned from local engine file
 * @param {*} p.defaultDebugObject - Default object to return when debug is true
 * @return {Promise<*>} - Some object read from URI
 */
async function _getObject_FromUri_FromModuleDataArray ({
  moduleDataArray,
  moduleName,
  tableName,
  unitName,
  settingName,
  objectName,
  debug,
  defaultDebugObject
}) {

  if (debug)
    return defaultDebugObject;

  const engineUrl = (() => {
    for (const moduleData of moduleDataArray) {
      if (moduleData.moduleName === moduleName)
        for (const _table of moduleData.tables) {
          if (_table.tableName === tableName)
            for (const row of _table.table) {
              if (row?.UNIT.toString().trim() === unitName.trim().toUpperCase() && row?.NAME.toString().trim().toUpperCase() === settingName.trim().toUpperCase())
                return row?.VALUE.toString().trim();
            }
        }
    }
  })();

  if (engineUrl) {
    // DYNAMIC IMPORT (works with Deno and browser)
    // inspired to ModulesLoader.addClassFromURI
    let _lastImportError = '';
    for (const _cdnURI of modulesLoader_Resolve(engineUrl)) {
      try {
        const _module = (await import(_cdnURI));
        if (_module != null && _module[objectName] != null) {
          return _module[objectName];
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

/**
 @private
 * Load modules on modulesLoader reading moduleDataArray, then init the classes and store them in modulesRepo
 * @param {Object} p
 * @param {ModulesLoader} p.modulesLoader
 * @param {ModuleData[]} p.moduleDataArray
 * @return {Promise<*[]>}  returns array of module classes
 */
async function _init_modules_classes__loading_Modules_fromUri ({ modulesLoader, moduleDataArray }) {
  const _modulesRepo = [];
  for (const moduleData of moduleDataArray) {
    let module = modulesLoader.get({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
    if (!module) {
      await modulesLoader.addClassFromURI({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
      module = modulesLoader.get({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
    }
    if (!module)
      throw new Error(`module ${moduleData.moduleName} not found`);
    _modulesRepo.push(new module.class());
  }
  return _modulesRepo;
}

//#endregion private functions

//#region types definitions
/** @typedef {{success: true, value?: *} | {success:false, error: string}} Result */
//#endregion types definitions
