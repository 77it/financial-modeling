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
import { parse } from 'https://deno.land/std@0.172.0/flags/mod.ts';
import { writeAllSync } from 'https://deno.land/std@0.173.0/streams/write_all.ts';
import process from "node:process";

import { existsSync } from './node/exists_sync.js';
import { convertExcelToModuleDataArray } from './node/convert_excel_to_moduledata_array.js';
//#endregion node imports

//#region local imports
import { Result, schema, sanitize, sanitizeObj, parseJSON5, isNullOrWhiteSpace, eq2, get2 } from './deps.js';

import { ModuleData } from './engine/modules/module_data.js';
import { modulesLoader_Resolve } from './engine/modules/modules_loader__resolve.js';
import { engine } from './engine/engine.js';
import { ModulesLoader } from './modules/_modules_loader.js';
import { Module } from './modules/_sample_module.js';

import { MODULE_NAME as SETTINGS_MODULE_NAME, tablesInfo as SETTINGS_TABLES_INFO } from './config/modules/settings.js';
import * as SETTINGS_NAMES from './config/settings_names.js';
import * as CFG from './config/engine.js';
//#endregion local imports

// call `main` function only if there are command line arguments  (useful to not call `main` function with the following code when importing this file)
if (Deno.args.length !== 0) {
  const args = parse(Deno.args);  // parse command line arguments
  await main({ excelUserInput: args?.input, outputFolder: args?.output, errors: args?.errors });
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
 * @param {string} p.errors - Path of the error file, created only if there are errors
 * @param {boolean} [p.moduleResolverDebugFlag=false] - When true, Engine and ModuleLoader are returned from local file
 * @param {boolean} [p.ledgerDebugFlag=false] - Ledger debug flag
 */
async function main ({
  excelUserInput,
  outputFolder,
  errors,
  moduleResolverDebugFlag = false,
  ledgerDebugFlag = false
}) {
  // create/overwrite errorsDump file
  const errorsDumpFileWriter = await Deno.open(errors, { create: true, write: true, truncate: true });

  let _exitCode = 0;

  try {
    // convert Excel input file to an array of `moduleData`
    const _moduleDataArray = await convertExcelToModuleDataArray({ excelInput: excelUserInput });

    // get ModulesLoader class from `moduleDataArray` or from `'./modules/_modules_loader.js'` file
    const _$$MODULESLOADER_URL = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$MODULESLOADER_URL,
      settingSanitization: schema.STRING_TYPE
    });
    const _modulesLoaderClass = await _getFunctionFromUrl({
      url: _$$MODULESLOADER_URL,
      functionName: 'ModulesLoader',
      debug: moduleResolverDebugFlag,
      defaultFunction: ModulesLoader
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
      settingSanitization: schema.STRING_TYPE
    });
    const _engine = await _getFunctionFromUrl({
      url: _$$ENGINE_URL,
      functionName: 'engine',
      debug: moduleResolverDebugFlag,
      defaultFunction: engine
    });

    // get scenarios from `moduleDataArray`
    const _$$SCENARIOS_setting = _get_SimulationSetting_FromModuleDataArray({
      moduleDataArray: _moduleDataArray,
      settingName: SETTINGS_NAMES.Simulation.$$SCENARIOS
    });
    const _$$SCENARIOS_parsed_array = parseJSON5(_$$SCENARIOS_setting);
    const _$$SCENARIOS = sanitize({
      value: _$$SCENARIOS_parsed_array,
      sanitization: schema.ARRAY_OF_STRINGS_TYPE
    });

    if (isNullOrWhiteSpace(_$$SCENARIOS[0]))  // if first scenario is empty, set it to base scenario
      _$$SCENARIOS[0] = CFG.SCENARIO_BASE;

    //#region loop scenarios
    for (const _scenario of _$$SCENARIOS) {
      if (isNullOrWhiteSpace(_scenario))  // skip empty scenarios
        continue;

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
        appendTrnDump: _appendTrnDump,
        ledgerDebug: ledgerDebugFlag
      });

      if (!_engine_result.success) {
        console.log(_engine_result?.error ?? 'Unknown error');
        writeToStream(errorsDumpFileWriter, _engine_result?.error ?? 'Unknown error');
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
    // if exit code is 0, delete errors file
    if (_exitCode === 0 && existsSync(errors)) {
      Deno.removeSync(errors);
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
  try {
    const table = SETTINGS_TABLES_INFO.Set;

    const _setting = (() => {
      for (const moduleData of moduleDataArray) {
        if (eq2(moduleData.moduleName, SETTINGS_MODULE_NAME)) {
          for (const _tableSrc of moduleData.tables) {
            if (eq2(_tableSrc.tableName, table.tableName)) {
              const _table = structuredClone(_tableSrc.table);  // clone _tableSrc to avoid to store the sanitization effect
              sanitizeObj({
                obj: _table,
                sanitization: table.sanitization
              });
              for (const row of _table) {
                if ((eq2(get2(row, table.columns.scenario), CFG.SCENARIO_BASE) ||
                    isNullOrWhiteSpace(get2(row, table.columns.scenario))) &&
                  eq2(get2(row, table.columns.unit), CFG.SIMULATION_NAME) &&
                  eq2(row[table.columns.name], settingName))
                  return get2(row, table.columns.value);
              }
            }
          }
        }
      }
    })();

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
 * Returns an object from a URL or from defaultFunction
 * @param {Object} p
 * @param {string} p.url
 * @param {string} p.functionName
 * @param {boolean} p.debug - debug flag: when true, the function is returned from defaultFunction
 * @param {*} p.defaultFunction - Default object to return when debug is true or when `functionName` is not found
 * @return {Promise<*>} - Some object read from URI
 */
async function _getFunctionFromUrl ({
  url,
  functionName,
  debug,
  defaultFunction
}) {

  if (debug)
    return defaultFunction;

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
        _lastImportError = error.stack?.toString() ?? error.toString();  // save the last error and go on with the loop trying the next cdnURI
      }
    }
    throw new Error(`error loading module ${url}, error: ${_lastImportError}`);
  }

  // fallback to default object
  return defaultFunction;
}

/**
 @private
 * Load modules on modulesLoader reading moduleDataArray, then init the classes and store them in modulesRepo
 * @param {Object} p
 * @param {ModulesLoader} p.modulesLoader
 * @param {ModuleData[]} p.moduleDataArray
 * @return {Promise<*[]>}  returns array of module classes
 * @throws {Error} If module is not founds
 */
async function _init_modules_classes__loading_Modules_fromUri ({ modulesLoader, moduleDataArray }) {
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
