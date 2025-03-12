/**
 Abandon all hope, ye who enter here.
 For financial modeling is a treacherous journey,
 fraught with peril and uncertainty.
 Yet, with careful planning and analysis,
 one may navigate the labyrinthine world of finance,
 and emerge victorious on the other side.
 May this code serve as a guide and a beacon of hope,
 to all who dare to venture forth into the realm of numbers.
*/

// run with
// `deno run --allow-read --allow-write THIS-FILE.js --input INPUT --output OUTPUT --errors ERRORS`

export { main };

//#region node imports
import { parseArgs } from 'node:util';
import process from 'node:process';
import fs from 'node:fs';

import { deleteFile } from './node/delete_file.js';
import { convertExcelToModuleDataArray } from './node/convert_excel_to_moduledata_array.js';
//#endregion node imports

//#region local imports
import { Result, schema, sanitize, parseYAML, isNullOrWhiteSpace, eq2, get2 } from './modules/deps.js';

import { ModuleData } from './engine/modules/module_data.js';
import { modulesLoader_Resolve } from './engine/modules/modules_loader__resolve.js';
import { ModulesLoader } from './modules/_modules_loader.js';
import { Module } from './modules/_sample_module.js';

import { DEFAULT_TASKLOCKS_LOADER__MODULE_PATH } from './config/tasklocks_defaults.js';
import { PYTHON_FORECAST__CLASS_PATH, PYTHON_FORECAST__CLASS_NAME, PYTHON_FORECAST__CLASS_METHOD_NAME } from './config/python.js';

import { PYTHON_FORECAST } from './config/globals.js';

import { MODULE_NAME as SETTINGS_MODULE_NAME, tablesInfo as SETTINGS_TABLES_INFO, moduleSanitization as SETTINGS_SANITIZATION } from './config/modules/settings.js';
import * as SETTINGS_NAMES from './config/settings_names.js';
import * as CFG from './config/engine.js';
//#endregion local imports

// call `main` function only if there are command line arguments  (useful to not call `main` function with the following code when importing this file)
const args = (typeof Deno !== "undefined") ? Deno.args : process.argv.slice(2);
// check if array is an array, and then if the length is > 0
if (Array.isArray(args) && args.length > 0) {
  /** @type {"string"} */
  const str_txt = 'string';  // const that contains the string 'string', to prevent type error in Deno 1.40.5

  const options = {
    input: { type: str_txt, short: 'i', default: '' },
    output: { type: str_txt, short: 'o', default: '' },
    errors: { type: str_txt, short: 'e', default: ''},
  };

  /** @type {{values: {input: string | undefined, output: string | undefined, errors: string | undefined}, positionals: any}} */
  const args_parsed = (() => {
    try {
      return parseArgs({args, options});
    } catch (e) {
      return {values: {input: undefined, output: undefined, errors: undefined}, positionals: []};
    }
  })();

  // if args_parsed are null or not of string type, exit
  if (args_parsed.values?.input == null || typeof args_parsed.values.input !== 'string') {
    console.error('No valid input file specified');
    process.exit(1);
  }
  if (args_parsed.values?.output == null || typeof args_parsed.values.output !== 'string') {
    console.error('No valid output folder specified');
    process.exit(1);
  }
  if (args_parsed.values?.errors == null || typeof args_parsed.values.errors !== 'string') {
    console.error('No valid errors file specified');
    process.exit(1);
  }

  // save value or set to '' if null
  /** @type {string} */
  const excelUserInput = args_parsed.values.input ? args_parsed.values.input : '';
  /** @type {string} */
  const outputFolder = args_parsed.values.output ? args_parsed.values.output : '';
  /** @type {string} */
  const errorsFilePath = args_parsed.values.errors ? args_parsed.values.errors : '';

  await main({ excelUserInput, outputFolder, errorsFilePath });
} else {
  console.log('No command line arguments found, expected: --input EXCEL-INPUT-FILE --output OUTPUT-FOLDER --errors ERRORS-FILE . This file can also be imported and used as a module.');
}

/*
  ______   _   _   _____
 |  ____| | \ | | |  __ \
 | |__    |  \| | | |  | |
 |  __|   | . ` | | |  | |
 | |____  | |\  | | |__| |
 |______| |_| \_| |_____/
 */

/**
 * Run Simulation and write a series of output files - containing accounting writing transactions - in JSONL format in the `output` folder.
 * Will be created a file for each scenario.
 * @param {Object} p
 * @param {string} p.excelUserInput - Path of the Excel file with user input
 * @param {string} p.outputFolder - Output folder
 * @param {string} p.errorsFilePath - Path of the error file, created only if there are errors
 * @param {boolean} [p.moduleResolverDebugFlag=false] - When true, Engine and ModuleLoader are returned from local file
 * @param {boolean} [p.ledgerDebugFlag=false] - Ledger debug flag
 */
async function main ({
  excelUserInput,
  outputFolder,
  errorsFilePath,
  moduleResolverDebugFlag = false,
  ledgerDebugFlag = false
}) {
  // Delete the file before writing to it
  deleteFile(errorsFilePath);

  let _exitCode = 0;

  try {
    // convert Excel input file to an array of `moduleData`
    const _moduleDataArray = await convertExcelToModuleDataArray({ excelInput: excelUserInput });

    // get ModulesLoader class from a Setting (from `moduleDataArray`) or, as a fallback, from `'./modules/_modules_loader.js'` file
    const _$$MODULESLOADER_URL = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$MODULESLOADER_URL,
      settingSanitization: schema.STRING_TYPE
    });
    const _modulesLoaderClass = await _getFunctionFromUrl({
      url: _$$MODULESLOADER_URL,
      functionName: 'ModulesLoader',
      debug: moduleResolverDebugFlag,
      fallbackFunction: ModulesLoader
    });
    // init the module loader passing a resolver; the resolver is loaded in this file, from the same root
    // in that way the resolver can be more up to date than the one that exist alongside ModulesLoader
    /** @type {ModulesLoader} */
    const _modulesLoader = new _modulesLoaderClass({ modulesLoader_Resolve });

    /** Array of module classes: load module classes from moduleDataArray, then init the classes and return them in an array
     * @type {Module[]} */
    const _modulesArray = await _init_modules_classes__loading_Modules_fromUri(
      { modulesLoader: _modulesLoader, moduleDataArray: _moduleDataArray });

    // get `engine` and `normalizeModuleData` functions from a Setting (from `moduleDataArray`) or, as a fallback, from ModulesLoader function;
    // the fallback engine is loaded from the same root of ModulesLoader,
    // in that way the engine can be more aligned with the modules loaded from ModulesLoader
    const _$$ENGINE_URL = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$ENGINE_URL,
      settingSanitization: schema.STRING_TYPE
    });
    const _engine = await _getFunctionFromUrl({
      url: _$$ENGINE_URL,
      functionName: 'engine',
      debug: moduleResolverDebugFlag,
      fallbackFunction: _modulesLoader.getEngine()
    });
    const _normalizeModuleData = await _getFunctionFromUrl({
      url: _$$ENGINE_URL,
      functionName: 'normalizeModuleData',
      debug: moduleResolverDebugFlag,
      fallbackFunction: _modulesLoader.getNormalizeModuleData()
    });

    // get scenarios from `moduleDataArray`
    const _$$SCENARIOS_setting = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$SCENARIOS
    });
    const _$$SCENARIOS_parsed_array = parseYAML(_$$SCENARIOS_setting);
    const _$$SCENARIOS = sanitize({
      value: _$$SCENARIOS_parsed_array,
      sanitization: schema.ARRAY_OF_STRINGS_TYPE
    });

    if (isNullOrWhiteSpace(_$$SCENARIOS[0]))  // if first scenario is empty, set it to base scenario
      _$$SCENARIOS[0] = CFG.SCENARIO_BASE;

    // store python forecast function in Globals if the setting flag is true
    //
    // read setting
    const _$$PYTHON_ADVANCED_FORECAST_FLAG = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$PYTHON_ADVANCED_FORECAST_FLAG,
      settingSanitization: schema.BOOLEAN_TYPE
    });
    // if flag is true, set Global value with Python function
    if (_$$PYTHON_ADVANCED_FORECAST_FLAG) {
      const pythonForecastModule = await import(PYTHON_FORECAST__CLASS_PATH);
      const pythonForecastInstance = new pythonForecastModule[PYTHON_FORECAST__CLASS_NAME]();
      await pythonForecastInstance.loadPython();
      PYTHON_FORECAST.setOneTimeBeforeRead(pythonForecastInstance[PYTHON_FORECAST__CLASS_METHOD_NAME]);
    }

    // before scenario/engine run add, as last module, the module to add default TaskLocks + dummy module data
    const defaultTasklocksLoaderModule = await import(DEFAULT_TASKLOCKS_LOADER__MODULE_PATH);
    const _dummyModuleData = new ModuleData({ moduleName: '', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '', tables: [] });
    _modulesArray.push(new defaultTasklocksLoaderModule.Module());
    _moduleDataArray.push(_dummyModuleData);

    // normalize module data
    _normalizeModuleData(_moduleDataArray);

    //#region loop scenarios
    for (const _scenario of _$$SCENARIOS) {
      if (isNullOrWhiteSpace(_scenario))  // skip empty scenarios
        continue;

      // Create a writable stream; see https://nodejs.org/api/fs.html#fscreatewritestreampath-options
      const _output = `${outputFolder}/${_scenario}.jsonl`;
      // Delete the file before writing to it
      deleteFile(_output);

      // declare array buffer in which to store strings to write to `_output` file
      /** @type {string[]} */
      const _output_buffer = [];
      const _OUTPUT_BUFFER_MAXLENGTH = 1_000;

      /**
       * Callback to dump the transactions
       * @param {string} dump */
      const _appendTrnDump = function (dump) {
        // write to buffer and then write to file every _OUTPUT_BUFFER_MAXLENGTH iterations
        _output_buffer.push(dump);
        if (_output_buffer.length % _OUTPUT_BUFFER_MAXLENGTH === _OUTPUT_BUFFER_MAXLENGTH - 1) {
          // see https://nodejs.org/api/fs.html#fsappendfilesyncpath-data-options
          fs.appendFileSync(_output, _output_buffer.join('\n'), 'utf8');
          // empty buffer and reset counter
          _output_buffer.length = 0;
        }
      };

      // run simulation
      /** @type {Result} */
      const _engine_result = await _engine({
        modulesData: _moduleDataArray,
        modules: _modulesArray,
        scenarioName: _scenario,
        appendTrnDump: _appendTrnDump,
        ledgerDebug: ledgerDebugFlag
      });

      // write remaining strings in buffer
      if (_output_buffer.length > 0) {
        fs.appendFileSync(_output, _output_buffer.join('\n'), 'utf8');
      }

      if (!_engine_result.success) {
        console.log(_engine_result?.error ?? 'Unknown error');
        // see https://nodejs.org/api/fs.html#fsappendfilesyncpath-data-options
        fs.appendFileSync(errorsFilePath, _engine_result?.error ?? 'Unknown error' + '\n', 'utf8');
        _exitCode = 1;
      }
    }
    //#endregion loop scenarios
  } catch (error) {
    const _error = (error instanceof Error) ? error.stack?.toString() ?? error.toString() : 'Unknown error occurred';
    console.log(_error);
    fs.appendFileSync(errorsFilePath, _error, 'utf8');
    _exitCode = 1;
  } finally {
    // if exit code is 0, delete errors file
    if (_exitCode === 0) {
      deleteFile(errorsFilePath);
    }
    // Rather than calling process.exit() directly, the code should set the process.exitCode and allow the process to exit naturally
    // by avoiding scheduling any additional work for the event loop
    // see https://nodejs.org/api/process.html#processexitcode
    // & https://nodejs.org/api/process.html#processexitcode_1
    process.exitCode = _exitCode;
  }

  /*
    ______   _   _   _____
   |  ____| | \ | | |  __ \
   | |__    |  \| | | |  | |
   |  __|   | . ` | | |  | |
   | |____  | |\  | | |__| |
   |______| |_| \_| |_____/
   */
}

//#region private functions
/**
 @private
 * Returns a setting from `moduleDataArray`, optionally sanitizing it
 * @param {Object} p
 * @param {ModuleData[]} p.moduleDataArray
 * @param {string} p.settingName
 * @param {string} [p.settingSanitization]
 * @return {* | undefined} - undefined if some error occurs, otherwise Setting read from `moduleDataArray`
 */
function _get_SimulationSetting_FromModuleDataArray ({
  moduleDataArray,
  settingName,
  settingSanitization
}) {
  try {
    const table = SETTINGS_TABLES_INFO.SET;

    const _setting = (() => {
      for (const moduleData of moduleDataArray) {
        if (eq2(moduleData.moduleName, SETTINGS_MODULE_NAME)) {
          for (const _tableSrc of moduleData.tables) {
            if (eq2(_tableSrc.tableName, table.tableName)) {
              const _table = structuredClone(_tableSrc.table);  // clone _tableSrc to avoid to store the sanitization effect
              sanitize({
                value: _table,
                sanitization: SETTINGS_SANITIZATION
              });
              for (const row of _table) {
                if ((eq2(get2(row, table.columns.SCENARIO), CFG.SCENARIO_BASE) ||
                    isNullOrWhiteSpace(get2(row, table.columns.SCENARIO))) &&
                  eq2(get2(row, table.columns.UNIT), CFG.SIMULATION_NAME) &&
                  eq2(row[table.columns.NAME], settingName))
                  return get2(row, table.columns.VALUE);
              }
            }
          }
        }
      }
    })();

    // sanitize the setting if a sanitization is provided
    if (!isNullOrWhiteSpace(settingSanitization))
      return sanitize({ value: _setting, sanitization: settingSanitization });
    else
      return _setting;
  } catch (e) {
    return undefined;
  }
}

/**
 @private
 * Returns an object from a URL or from fallbackFunction
 * @param {Object} p
 * @param {string} p.url
 * @param {string} p.functionName
 * @param {boolean} p.debug - debug flag: when true, the function is returned from fallbackFunction
 * @param {*} p.fallbackFunction - Fallback function to return when debug is true or when `functionName` is not found
 * @return {Promise<*>} - Some object read from URI
 */
async function _getFunctionFromUrl ({
  url,
  functionName,
  debug,
  fallbackFunction
}) {

  if (debug)
    return fallbackFunction;

  if (!isNullOrWhiteSpace(url)) {
    // DYNAMIC IMPORT (works with DENO, BROWSER and NODE with option --experimental-network-imports)
    // inspired to ModulesLoader.addClassFromURI
    let _lastImportError = '';
    for (const _cdnURI of modulesLoader_Resolve(url)) {
      try {
        const _module = await import(_cdnURI);
        if (_module != null && _module[functionName] != null) {
          return _module[functionName];
        }
      } catch (error) {
        _lastImportError = (error instanceof Error) ? error.stack?.toString() ?? error.toString() : 'Unknown error occurred';  // save the last error and go on with the loop trying the next cdnURI
      }
    }
    throw new Error(`error loading module ${url}, error: ${_lastImportError}`);
  }

  // return fallback function
  return fallbackFunction;
}

/**
 @private
 * Load module classes on modulesLoader reading moduleDataArray, then init the classes and return them in an array
 * @param {Object} p
 * @param {ModulesLoader} p.modulesLoader
 * @param {ModuleData[]} p.moduleDataArray
 * @return {Promise<Module[]>}  returns array of module classes
 * @throws {Error} If module is not founds
 */
async function _init_modules_classes__loading_Modules_fromUri ({ modulesLoader, moduleDataArray }) {
  /** @type {Module[]} */
  const _modulesRepo = [];
  for (const moduleData of moduleDataArray) {
    // try to get the module from modulesLoader
    let module = modulesLoader.get({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
    // if not found, load it from URI and try to get it again
    if (!module) {
      await modulesLoader.addClassFromURI({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
      module = modulesLoader.get({ moduleName: moduleData.moduleName, moduleEngineURI: moduleData.moduleEngineURI });
    }
    // if module is still not found, throw an error
    if (!module)
      throw new Error(`module '${moduleData.moduleName}' not found`);
    // if module is found, init the class and push it to _modulesRepo
    _modulesRepo.push(new module.class());
  }
  return _modulesRepo;
}

//#endregion private functions
