// this is the module used to set fallback default TaskLocks

import { ModuleData, SimulationContext } from '../../deps.js';
import * as SETTINGS_NAMES from '../../config/settings_names.js';
import { SettingsDefaultValues } from '../../config/settings_default_values.js';
import * as CFG from '../../config/engine.js';
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
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__MISSING__SET_WITH_DEFAULT_VALUE, value: this.#setMissingSettingsWithDefaultValue });
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__JS_ENGINE_CONFIGURATION__GLOBAL_VALUES__SET, value: this.#setJsEngineConfigurationGlobalValuesFromSimulationSettings });
  }

  /** Set Settings Default Values, only if they don't have a value already defined */
  #setMissingSettingsWithDefaultValue = () => {
    // loop `SettingsDefaultValues` keys and set a new Setting if it doesn't exist or if it has a null/undefined value
    for (const settingDefault_Key of Object.keys(SettingsDefaultValues)) {
      if (this.#simulationContext.getSetting({ name: settingDefault_Key }) != null) continue;

      this.#simulationContext.setSetting([{
        name: settingDefault_Key,
        value: SettingsDefaultValues[settingDefault_Key]
      }]);
    }
  };

  /** Set Js Engine Configuration Global Values from Simulation Settings */
  #setJsEngineConfigurationGlobalValuesFromSimulationSettings = () => {
    CFG.DRIVER_PREFIXES__ZERO_IF_NOT_SET.set(this.#simulationContext.getSetting({ unit: CFG.SIMULATION_NAME, name: SETTINGS_NAMES.Simulation.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET }));
  };
}
