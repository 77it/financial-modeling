// this is a sample module reference implementation
// everything in it is optional, every method can be implemented or not, don't take anything for granted.

//#region documentation
// Error management
/*
#error #fatal error #throw
Every module that wants to interrupt program execution for a fatal error throws a new Error;
*/

//#endregion

import * as SETTINGS_NAMES from '../config/settings_names.js';
import { deepFreeze, sanitization, ModuleData, SimulationContext, lowerCaseCompare } from '../deps.js';
import { sanitizeModuleData } from './_utils/utils.js';

const MODULE_NAME = '_sample_module';
const tablesInfo = {};

export class Module {
  #name = MODULE_NAME;

  //#region private fields
  /** @type {boolean} */
  #alive;
  /** @type {undefined|Date} */
  #startDate;
  /** @type {undefined|ModuleData} */
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

  /** Set TaskLocks */
  setTaskLocksBeforeTheSimulationStarts () {
    // set TaskLocks
  }

  /** Set Settings and Drivers */
  setDriversAndSettingsBeforeTheSimulationStarts () {
    // set Settings and Drivers
  }

  /** Get info from TaskLocks, Settings and Drivers, and save them for later reuse */
  getInfoBeforeTheSimulationStarts () {
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
    // do something
  }

  /**
   * Called only one time, after the simulation ends.  */
  oneTimeAfterTheSimulationEnds () {
    // do something
  }
}
