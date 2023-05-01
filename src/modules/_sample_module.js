// this is a sample module reference implementation
// everything in it is optional, every method can be implemented or not, don't take anything for granted.

//#region documentation
// Error management
/*
#error #fatal error #throw
Every module that wants to interrupt program execution for a fatal error throws a new Error;
*/

//#endregion

import { ModuleData, SimulationContextDaily, SimulationContextStart } from '../deps.js';

export class Module {
  #name = '_sample_module';

  //#region private fields
  /** @type {boolean} */
  #alive;
  /** @type {undefined|Date} */
  #startDate;

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
  }

  get name () { return this.#name; }

  get alive () { return this.#alive; }

  /** @returns {undefined|Date} */
  get startDate () { return this.#startDate; }

  /**
   * Set Drivers, SharedConstants, startDate.
   * Called only one time, before the simulation starts.
   * @param {Object} p
   * @param {ModuleData} p.moduleData
   * @param {SimulationContextStart} p.simulationContextStart
   * @returns {void}
   */
  oneTimeBeforeTheSimulationStarts ({ moduleData, simulationContextStart }) {
    // do something: using `moduleData` set Drivers, Settings, TaskLocks, this.#startDate
  }

  /**
   * Called daily, as first step of daily modeling.
   * @param {Object} p
   * @param {Date} p.today
   * @param {SimulationContextDaily} p.simulationContextDaily
   * @returns {void}
   */
  beforeDailyModeling ({ today, simulationContextDaily }) {
    // do something
  }

  /**
   * Called daily, after `beforeDailyModeling`
   * @param {Object} p
   * @param {Date} p.today
   * @param {SimulationContextDaily} p.simulationContextDaily
   * @returns {void}
   */
  dailyModeling ({ today, simulationContextDaily }) {
    // do something
  }

  /**
   * Called only one time, after the simulation ends.
   * @param {Object} p
   * @param {SimulationContextDaily} p.simulationContextDaily
   * @returns {void}
   */
  oneTimeAfterTheSimulationEnds ({ simulationContextDaily }) {
    // do something
  }
}
