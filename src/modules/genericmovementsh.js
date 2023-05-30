// TODO to implement

// IMPLEMENTATION NOTES
/*
# describe as JSON5 loan as start date, end date, tasso iniziale, tasso attuale + capitale residuo a fine periodo (es fine anno, 25 mln)

Calcola piano #1 con capitale 1.000.000 e precisione 4, tasso 1,5%
Calcola piano #2, es 25.000.000, tasso 2,3% impostando:
* Scadenze future con le rate dalla successiva alla data di bilancio alla fine
* Quota capitale nuove rate: capitale singola scadenza piano #1 / 1mln * 25mln
* Capitale residuo: ricalcolato rata per rata con la nuova quota capitale (capitale rata precedente - capitale calcolato al punto precedente)
* Interessi nuove rate: interessi singola scadenza piano #1 / 1,5 * 2,3 / capitale residuo #1 * capitale residuo #2

Useful because the plan don’t start at 31.12.XXXX but we have to regenerate a plan to split the dates
 */

import { deepFreeze, ModuleData, SimulationContext, sanitization, lowerCaseCompare, isNullOrWhiteSpace } from '../deps.js';
import { sanitizeModuleData } from './_utils/sanitization_utils.js';
import { moduleDataLookup } from './_utils/search_utils.js';
import * as SETTINGS_NAMES from '../config/settings_names.js';
import * as MODULES_CONFIG from '../config/modules.js';

const MODULE_NAME = 'genericmovementsh';
const tablesInfo = {};
tablesInfo.Settings = {};
tablesInfo.Settings.tableName = 'settings';
tablesInfo.Settings.columns = { name: 'name', value: 'value' };
tablesInfo.Settings.sanitization = {
  [tablesInfo.Settings.columns.name]: sanitization.STRING_TYPE,
  [tablesInfo.Settings.columns.value]: sanitization.ANY_TYPE
};
tablesInfo.Set = {};
tablesInfo.Set.tableName = 'set';
tablesInfo.Set.columns = { categoria: 'categoria', category: 'category' };
tablesInfo.Set.sanitization = {
  [tablesInfo.Set.columns.categoria]: sanitization.STRING_TYPE,
  [tablesInfo.Set.columns.category]: sanitization.STRING_TYPE
};
const ModuleInfo = { MODULE_NAME, tablesInfo };
deepFreeze(ModuleInfo);

export class Module {
  #name = MODULE_NAME;

  //#region private fields
  /** @type {boolean} */
  #alive;
  /** @type {undefined|Date} */
  #startDate;
  /** @type {ModuleData} */
  #moduleData;
  /** @type {SimulationContext} */
  #simulationContext;
  /** @type {string} */
  #ACTIVE_UNIT;
  /** @type {Date} */
  #SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE;

  //#region data from modules
  /** @type {undefined|string} */
  #accounting_type;
  #accounting_type_moduleDataLookup = {
    lookup_value: 'type',
    sanitization: sanitization.STRING_TYPE,
    tableName: tablesInfo.Settings.tableName,
    lookup_key: tablesInfo.Settings.columns.name,
    return_key: tablesInfo.Settings.columns.value,
    return_first_match: false,
    string_insensitive_match: true
  };
  /** @type {undefined|string} */
  #accounting_opposite_type;
  #accounting_opposite_type_moduleDataLookup = {
    lookup_value: 'vs type',
    sanitization: sanitization.STRING_TYPE,
    tableName: tablesInfo.Settings.tableName,
    lookup_key: tablesInfo.Settings.columns.name,
    return_key: tablesInfo.Settings.columns.value,
    return_first_match: false,
    string_insensitive_match: true
  };
  //#endregion data from modules

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
    //@ts-ignore
    this.#moduleData = undefined;
    //@ts-ignore
    this.#simulationContext = undefined;

    this.#ACTIVE_UNIT = '';
    this.#SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE = new Date(0);
  }

  get name () { return this.#name; }

  get alive () { return this.#alive; }

  /** @returns {undefined|Date} */
  get startDate () { return this.#startDate; }

  /**
   * Get SimulationContext and ModuleData, save them.
   * @param {Object} p
   * @param {ModuleData} p.moduleData
   * @param {SimulationContext} p.simulationContext
   */
  init ({ moduleData, simulationContext }) {
    // save moduleData, after sanitizing it
    this.#moduleData = sanitizeModuleData({ moduleData, moduleSanitization: Object.values(tablesInfo) });
    // save simulationContext
    this.#simulationContext = simulationContext;
  }

  /** Get info from TaskLocks, Settings and Drivers, and save them for later reuse */
  prepareDataForDailyModeling () {
    // read from Settings Unit Historical end and save the value
    this.#ACTIVE_UNIT = this.#simulationContext.getSetting({ name: SETTINGS_NAMES.Simulation.ACTIVE_UNIT });
    this.#SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE = this.#simulationContext.getSetting({
      unit: this.#ACTIVE_UNIT,
      name: SETTINGS_NAMES.Unit.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE
    });

    this.#accounting_type = moduleDataLookup(this.#moduleData, this.#accounting_type_moduleDataLookup);
    this.#accounting_opposite_type = moduleDataLookup(this.#moduleData, this.#accounting_opposite_type_moduleDataLookup);
    if (isNullOrWhiteSpace(this.#accounting_opposite_type))
      this.#accounting_opposite_type = this.#simulationContext.getSetting({ name: SETTINGS_NAMES.Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE });
  }

  /**
   * Called daily, after `beforeDailyModeling`
   * @param {Object} p
   * @param {Date} p.today
   */
  dailyModeling ({ today }) {
    if (this.#moduleData?.tables == null) return;

    // loop all tables
    for (const _table of this.#moduleData.tables) {
      // if tableName == tablesInfo.Set.name
      if (lowerCaseCompare(_table.tableName, tablesInfo.Set.tableName)) {
        for (const row of _table.table) {
          //TODO create ledger entry
          // data columns are all columns starting with MODULES_CONFIG.DATA_COLUMN_MARKER, with date in format YYYY-MM-DD or something similar

          //if `date` = `today`
          //scrivi accounting e vs accounting da this.#accounting_opposite_type
        }
      }
    }
  }
}