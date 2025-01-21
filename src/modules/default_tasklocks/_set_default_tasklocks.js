// this is the module used to set fallback default TaskLocks

//#region imports
import { ModuleData, SimulationContext } from '../../deps.js';
import * as SETTINGS_NAMES from '../../config/settings_names.js';
import { SettingsDefaultValues } from '../../config/settings_default_values.js';
import * as CFG from '../../config/engine.js';
import * as GLOBALS from '../../config/globals.js';
import { TaskLocks_Names } from '../../config/tasklocks_names.js';
//#endregion imports

export class Module {
  //#region boilerplate
  //#region private fields
  /** @type {SimulationContext} */
  #simulationContext;
  //#endregion private fields

  constructor () {
    //@ts-ignore
    this.#simulationContext = undefined;
  }

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
  //#endregion boilerplate

  /** Set TaskLocks */
  setTaskLocksBeforeTheSimulationStarts () {
    // set default TaskLocks on Simulation (when unit is empty or missing the default unit is used)
    this.#simulationContext.setTaskLock({ unit: '', name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__MISSING__SET_WITH_DEFAULT_VALUE, value: this.#taskLock_setMissingSettingsWithDefaultValue });
    this.#simulationContext.setTaskLock({ unit: '', name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__JS_ENGINE_CONFIGURATION__GLOBAL_VALUES__SET, value: this.#taskLock_setJsEngineConfigurationGlobalValuesFromSimulationSettings });
  }

  // is an arrow function because it is used as a callback, and it needs to access the class private fields
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

  // is an arrow function because it is used as a callback, and it needs to access the class private fields
  /** Set Js Engine Configuration Global Values from Simulation Settings */
  #taskLock_setJsEngineConfigurationGlobalValuesFromSimulationSettings = () => {
    GLOBALS.DRIVER_PREFIXES__ZERO_IF_NOT_SET.setOneTimeBeforeRead(this.#simulationContext.getSetting({ unit: CFG.SIMULATION_NAME, name: SETTINGS_NAMES.Simulation.$$DRIVER_PREFIXES__ZERO_IF_NOT_SET }));
  };
}
