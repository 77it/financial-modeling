// this is the module used to set fallback default TaskLocks

import { ModuleData, SimulationContext } from '../../deps.js';
import * as SETTINGS_NAMES from '../../config/settings_names.js';
import { SettingsDefaultValues } from '../../config/settings_default_values.js';
import * as CFG from '../../config/engine.js';
import * as GLOBALS from '../../config/globals.js';
import { TaskLocks_Names } from '../../config/tasklocks_names.js';

const MODULE_NAME = '_set_default_tasklocks';

export class Module {
  //#region private fields
  /** @type {SimulationContext} */
  #simulationContext;
  //#endregion private fields

  constructor () {
    //@ts-ignore
    this.#simulationContext = undefined;
  }

  get name () { return MODULE_NAME; }

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
    // set default TaskLocks
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__MISSING__SET_WITH_DEFAULT_VALUE, value: this.#taskLock_setMissingSettingsWithDefaultValue });
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__JS_ENGINE_CONFIGURATION__GLOBAL_VALUES__SET, value: this.#taskLock_setJsEngineConfigurationGlobalValuesFromSimulationSettings });
  }

  // is an arrow function because it is used as a callback
  /** Set Settings Default Values, only if they don't have a value already defined */
  #taskLock_setMissingSettingsWithDefaultValue = () => {
    // loop `SettingsDefaultValues` keys and set a new Setting if it doesn't exist or if it has a null/undefined value
    for (const settingDefault_Key of Object.keys(SettingsDefaultValues)) {
      if (this.#simulationContext.getSetting({ name: settingDefault_Key }) != null) continue;

      this.#simulationContext.setSetting([{
        name: settingDefault_Key,
        value: SettingsDefaultValues[settingDefault_Key]
      }]);
    }
  };

  // is an arrow function because it is used as a callback
  /** Set Js Engine Configuration Global Values from Simulation Settings */
  #taskLock_setJsEngineConfigurationGlobalValuesFromSimulationSettings = () => {
    GLOBALS.DRIVER_PREFIXES__ZERO_IF_NOT_SET.setOneTimeBeforeRead(this.#simulationContext.getSetting({ unit: CFG.SIMULATION_NAME, name: SETTINGS_NAMES.Simulation.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET }));
  };
}
