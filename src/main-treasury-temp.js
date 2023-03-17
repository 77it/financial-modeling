// run with
// `deno run --allow-read --allow-write THIS-FILE.js --input INPUT --output OUTPUT --errors ERRORS`

export { main };

//#region settings
const OPTIONS = {};
OPTIONS.FILES = {};
OPTIONS.FILES.CONVERTER_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter.exe.gz';
OPTIONS.FILES.CONVERTER_EXEGZ_PATH = './converter.exe';
//#endregion settings

//#region deno imports
import { parse } from 'https://deno.land/std@0.172.0/flags/mod.ts';
import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';
import { writeAllSync } from 'https://deno.land/std@0.173.0/streams/write_all.ts';

import { downloadAndDecompressGzip } from './deno/downloadAndDecompressGzip.js';
import { existSync } from './deno/existSync.js';
//#endregion deno imports

//#region local imports
import { sanitization } from './deps.js';

import { parseJSON5 } from './deps.js';

import { ModuleData } from './engine/modules/module_data.js';
import { moduleData_LoadFromJson } from './engine/modules/module_data__load_from_json.js';
import { modulesLoader_Resolve } from './engine/modules/modules_loader__resolve.js';
import { engine } from './engine/engine.js';
import { ModulesLoader } from './modules/_modules_loader.js';
import { Module } from './modules/_sample_module.js';

import { ModuleInfo as SETTINGS_MODULE_INFO } from './modules/settings.js';
import * as SETTINGS_NAMES from './engine/settings/settings_names.js';
import * as STD_NAMES from './modules/_names/standard_names.js';
//#endregion local imports

// call `main` function only if there are command line arguments  (useful to not call `main` function with the following code when importing this file)
if (Deno.args.length !== 0) {
  const args = parse(Deno.args);  // parse command line arguments
  await main({ excelUserInput: args?.input, outputFolder: args?.output, errors: args?.errors });
}
else
  console.log('No command line arguments found, expected: --input EXCEL-INPUT-FILE --output OUTPUT-FOLDER --errors ERRORS-FILE . This file can also be imported and used as a module.');

/**
 * Run Simulation and write a series of output files - containing accounting writing transactions - in JSONL format in the `output` folder.
 * Will be created a file for each scenario.
 * @param {Object} p
 * @param {string} p.excelUserInput - Excel file with user input
 * @param {string} p.outputFolder - Output folder
 * @param {string} p.errors - Text file created only if there are errors
 * @param {boolean} [p.debug=false] - Optional debug flag
 */
async function main ({ excelUserInput, outputFolder, errors, debug = false }) {
  // create/overwrite errorsDump file
  const errorsDumpFileWriter = await Deno.open(errors, { create: true, write: true, truncate: true });

  let _exitCode = 0;

  try {
    // convert Excel input file to an array of `moduleData`
    const _moduleDataArray = await _convertExcelToModuleDataArray({ excelUserInput, errors });

    // get ModulesLoader class from `moduleDataArray` or from `'./modules/_modules_loader.js'` file
    const _$$MODULESLOADER_URL = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$MODULESLOADER_URL,
      settingSanitization: sanitization.STRING_TYPE
    });
    const _modulesLoaderClass = await _getObject_FromUrl({
      url: _$$MODULESLOADER_URL,
      objectName: 'ModulesLoader',
      debug: debug,
      defaultObject: ModulesLoader
    });
    // init the module loader passing a resolver loaded alongside this module; in that way the resolver can be more up to date than the one that exist alongside ModulesLoader
    const _modulesLoader = new _modulesLoaderClass({ modulesLoader_Resolve });

    /** Array of module classes
     * @type {Module[]} */
    const _modulesArray = await _init_modules_classes__loading_Modules_fromUri(
      { modulesLoader: _modulesLoader, moduleDataArray: _moduleDataArray });

    // get engine from `moduleDataArray` or from `./engine/engine.js` file
    const _$$ENGINE_URL = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$ENGINE_URL,
      settingSanitization: sanitization.STRING_TYPE
    });
    const _engine = await _getObject_FromUrl({
      url: _$$ENGINE_URL,
      objectName: 'engine',
      debug: debug,
      defaultObject: engine
    });

    // get scenarios from `moduleDataArray`
    const _$$SCENARIOS_setting = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$SCENARIOS
    });
    // TODO write lib to use JSON5; try/catch; if error, undefined
    const _$$SCENARIOS_parsed_array = parseJSON5(_$$SCENARIOS_setting);
    const _$$SCENARIOS = sanitization.sanitize({
      value: _$$SCENARIOS_parsed_array,
      sanitization: sanitization.ARRAY_OF_STRINGS_TYPE
    });

    //#region loop scenarios
    for (const _unsanitized_scenario of _$$SCENARIOS) {
      const _scenario = (_unsanitized_scenario === '') ? STD_NAMES.Scenario.BASE : _unsanitized_scenario;

      // create/overwrite output file   // see https://deno.land/api@v1.29.1?s=Deno.open
      const _output = `${outputFolder}/${_scenario}.jsonl`;
      const trnDumpFileWriter = await Deno.open(_output, { create: true, write: true, truncate: true });

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
        scenarioName: _scenario,
        appendTrnDump: _appendTrnDump
      });

      if (!_engine_result.success) {
        writeToStream(errorsDumpFileWriter, _engine_result.error);
        _exitCode = 1;
      }

      trnDumpFileWriter.close();
    }
    //#endregion loop scenarios
  } catch (error) {
    const _error = error.stack?.toString() ?? error.toString();
    console.log(_error);
    writeToStream(errorsDumpFileWriter, _error);
    _exitCode = 1;
  } finally {
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

/**
 @private
 * Returns a setting from `moduleDataArray`, optionally sanitizing it
 * @param {Object} p
 * @param {ModuleData[]} p.moduleDataArray
 * @param {string} p.settingName
 * @param {string} [p.settingSanitization]
 * @return {*} - Setting read from `moduleDataArray`
 */
function _get_SimulationSetting_FromModuleDataArray ({
  moduleDataArray,
  settingName,
  settingSanitization
}) {
  const moduleName = SETTINGS_MODULE_INFO.MODULE_NAME;
  const tableName = SETTINGS_MODULE_INFO.TablesInfo.Set.NAME;
  const tableSanitization = SETTINGS_MODULE_INFO.TablesInfo.Set.Validation;
  const tableColScenario = SETTINGS_MODULE_INFO.TablesInfo.Set.Columns.SCENARIO;
  const tableColUnit = SETTINGS_MODULE_INFO.TablesInfo.Set.Columns.UNIT;
  const tableColName = SETTINGS_MODULE_INFO.TablesInfo.Set.Columns.NAME;
  const tableColValue = SETTINGS_MODULE_INFO.TablesInfo.Set.Columns.VALUE;
  const scenarioName = STD_NAMES.Scenario.BASE;
  const unitName = STD_NAMES.Simulation.NAME;

  const _setting = (() => {
    for (const moduleData of moduleDataArray) {
      if (moduleData.moduleName === moduleName)
        for (const _tableObj of moduleData.tables) {
          if (_tableObj.tableName === tableName) {
            const _table = structuredClone(_tableObj.table);  // clone _tableObj to avoid side effects
            sanitization.sanitizeObj({
              obj: _table,
              sanitization: tableSanitization
            });
            for (const row of _table) {
              if (
                (row[tableColScenario].toString().trim().toUpperCase() === scenarioName.trim().toUpperCase() ||
                  row[tableColScenario].toString().trim().toUpperCase() === '') &&
                row[tableColUnit].toString().trim().toUpperCase() === unitName.trim().toUpperCase() &&
                row[tableColName].toString().trim().toUpperCase() === settingName.trim().toUpperCase())
                return row[tableColValue];
            }
          }
        }
    }
  })();

  if (settingSanitization)
    return sanitization.sanitize({ value: _setting, sanitization: settingSanitization });
  else
    return _setting;
}

/**
 @private
 * Returns an object from a URL or from defaultObject
 * @param {Object} p
 * @param {string} p.url
 * @param {string} p.objectName
 * @param {boolean} p.debug - Debug flag: when true, the engine function is returned from local engine file
 * @param {*} p.defaultObject - Default object to return when debug is true or when `settingName` is not found
 * @return {Promise<*>} - Some object read from URI
 */
async function _getObject_FromUrl ({
  url,
  objectName,
  debug,
  defaultObject
}) {

  if (debug)
    return defaultObject;

  if (url) {
    // DYNAMIC IMPORT (works with Deno and browser)
    // inspired to ModulesLoader.addClassFromURI
    let _lastImportError = '';
    for (const _cdnURI of modulesLoader_Resolve(url)) {
      try {
        const _module = await import(_cdnURI);
        if (_module != null && _module[objectName] != null) {
          return _module[objectName];
        }
      } catch (error) {
        _lastImportError = error.stack?.toString() ?? error.toString();  // save the last error and go on with the loop trying the next cdnURI
      }
    }
    throw new Error(`error loading module ${url}, error: ${_lastImportError}`);
  }

  // fallback to default object
  return defaultObject;
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
