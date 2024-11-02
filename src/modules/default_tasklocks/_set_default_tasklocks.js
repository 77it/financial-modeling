// this is the module used to set fallback default TaskLocks

import { ModuleData, SimulationContext } from '../../deps.js';

const MODULE_NAME = '_set_default_tasklocks';

export class Module {
  #name = MODULE_NAME;

  //#region private fields
  /** @type {SimulationContext} */
  #simulationContext;
  //#endregion private fields

  constructor () {
    //@ts-ignore
    this.#simulationContext = undefined;
  }

  get name () { return this.#name; }

  /**
   * Get SimulationContext and ModuleData, save them.
   * @param {Object} p
   * @param {ModuleData} p.moduleData
   * @param {SimulationContext} p.simulationContext
   */
  init ({ moduleData, simulationContext }) {
    // moduleData is not used

    // save simulationContext
    this.#simulationContext = simulationContext;
  }

  /** Set TaskLocks */
  setTaskLocksBeforeTheSimulationStarts () {
    // set TaskLocks
    xxx TODO;;PIPPO;
  }
}
