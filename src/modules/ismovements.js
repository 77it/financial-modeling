// TODO to implement

import * as SETTINGS_NAMES from '../config/settings_names.js';
import { tablesInfo } from '../config/modules/ismovements.js';
import { ModuleData, SimulationContext, eq2 } from './deps.js';
import { sanitizeModuleData } from './_utils/sanitize_module_data.js';

export class Module {
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
    this.#moduleData = sanitizeModuleData({ moduleData: moduleData, tablesInfo: tablesInfo });
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
    if (this.#moduleData?.tables == null) return;

    // loop all tables
    for (const table of this.#moduleData.tables) {
      // if tableName == tablesInfo.SET.tableName, loop all rows and create a setting for each entry
      if (eq2(table.tableName, tablesInfo.SET.tableName)) {
        for (const row of table.table) {
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
