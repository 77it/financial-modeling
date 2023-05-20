// TODO to implement

import * as SETTINGS_NAMES from '../config/settings_names.js';

import { deepFreeze, validation, ModuleData, SimulationContext, sanitization, lowerCaseCompare } from '../deps.js';
import { sanitizeModuleData } from './_utils/utils.js';

const MODULE_NAME = 'ismovements';
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
  /** @type {undefined|ModuleData} */
  #moduleData;
  /** @type {undefined|SimulationContext} */
  #simulationContext;

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
    this.#moduleData = undefined;
    this.#simulationContext = undefined;
  }

  get name () { return this.#name; }

  get alive () { return this.#alive; }

  /** @returns {undefined|Date} */
  get startDate () { return this.#startDate; }

  /**
   * Save Context, save ModuleData, set Locks.
   * @param {Object} p
   * @param {ModuleData} p.moduleData
   * @param {SimulationContext} p.simulationContext
   */
  init ({ moduleData, simulationContext }) {
    // save moduleData, after sanitizing it
    this.#moduleData = sanitizeModuleData({moduleData, moduleSanitization: Object.values(tablesInfo)});
    // save simulationContext
    this.#simulationContext = simulationContext;
  }

  /** Set Settings and Drivers */
  setBeforeTheSimulationStarts () {
    // do something
  }

  /** Get info from settings and drivers, and save them for later reuse */
  getBeforeTheSimulationStarts () {
    // read from Settings Unit Historical end and save the value
    this.#ACTIVE_UNIT = simulationContextDaily.getSetting({ name: SETTINGS_NAMES.Simulation.ACTIVE_UNIT });
    this.#SIMULATION_START_DATE = simulationContextDaily.getSetting({ unit: _ACTIVE_UNIT, name: SETTINGS_NAMES.Unit.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE });
  }

  /**
   * Called daily, as first step of daily modeling.
   * @param {Object} p
   * @param {Date} p.today
   */
  beforeDailyModeling ({ today }) {
    // do something
  }

  /**
   * Called daily, after `beforeDailyModeling`
   * @param {Object} p
   * @param {Date} p.today
   */
  dailyModeling ({ today }) {
    // loop all tables
    for (const table in this.#moduleData?.tables) {
      // if tableName == tablesInfo.Set.name, loop all rows and create a setting for each entry
      if (lowerCaseCompare(table, tablesInfo.Set.tableName)) {
        for (const row of table) {
          //TODO create ledger entry
          //in base al valore di Setting Unit Historical end, per capire se muovere vs cash o vs PN.
        }
      }
    }
  }

  /**
   * Called only one time, after the simulation ends.  */
  oneTimeAfterTheSimulationEnds () {
    // do something
  }
}