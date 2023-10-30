export { ModuleInfo };

import { TaskLocks_Names } from '../config/tasklocks_names.js';
import { SettingsDefaultValues } from '../config/settings_default_values.js';
import { SettingsSchemas, SettingsSanitizationOptions } from '../config/settings.schemas.js';
import { deepFreeze, schema, sanitize, ModuleData, SimulationContext, eq2, get2 } from '../deps.js';
import { sanitizeModuleData } from './_utils/sanitization_utils.js';

const MODULE_NAME = 'settings';
const tablesInfo = {};
tablesInfo.Set = {};
tablesInfo.Set.tableName = 'set';
tablesInfo.Set.columns = { scenario: 'scenario', unit: 'unit', name: 'name', date: 'date', value: 'value' };
tablesInfo.Set.sanitization = {
  [tablesInfo.Set.columns.scenario]: schema.STRING_TYPE,
  [tablesInfo.Set.columns.unit]: schema.STRING_TYPE,
  [tablesInfo.Set.columns.name]: schema.STRING_TYPE,
  [tablesInfo.Set.columns.date]: schema.DATE_TYPE,
  [tablesInfo.Set.columns.value]: schema.ANY_TYPE
};
tablesInfo.Set.sanitizationOptions = {
  defaultDate: new Date(0)
};
tablesInfo.ActiveSet = {};
tablesInfo.ActiveSet.tableName = 'activeset';
tablesInfo.ActiveSet.columns = { scenario: 'scenario', unit: 'unit', name: 'name', date: 'date', value: 'value' };
tablesInfo.ActiveSet.sanitization = {
  [tablesInfo.ActiveSet.columns.scenario]: schema.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.unit]: schema.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.name]: schema.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.date]: schema.DATE_TYPE,
  [tablesInfo.ActiveSet.columns.value]: schema.ANY_TYPE
};
tablesInfo.ActiveSet.sanitizationOptions = {
  defaultDate: new Date(0)
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

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
    //@ts-ignore
    this.#moduleData = undefined;
    //@ts-ignore
    this.#simulationContext = undefined;
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
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SET_SIMULATION_SETTINGS, value: this.#setSimulationSettings });
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SET_DEFAULT_SETTINGS_VALUE, value: this.#setSettingsDefaultValues });
  }

  /** Set Settings and Drivers */
  setDriversAndSettingsBeforeTheSimulationStarts () {
    this.#setActiveSettings();
  }

  /** Get info from TaskLocks, Settings and Drivers, and save them for later reuse */
  prepareDataForDailyModeling () {
    this.#setActiveSettings();
  }

  /**
   * Called daily, as first step of daily modeling.
   * @param {Object} p
   * @param {Date} p.today
   */
  beforeDailyModeling ({ today }) {
    this.#setActiveSettings();
  }

  /**
   * Called daily, after `beforeDailyModeling`
   * @param {Object} p
   * @param {Date} p.today
   */
  dailyModeling ({ today }) {
    this.#setActiveSettings();
  }

  /**
   * Called only one time, after the simulation ends.  */
  oneTimeAfterTheSimulationEnds () {
    this.#setActiveSettings();
  }

  /** Set Simulation Settings */
  #setSimulationSettings = () => {
    this.#setSettingsFromATable(tablesInfo.Set);
  };

  /** Set Settings Default Values, only if they don't have a value already defined */
  #setSettingsDefaultValues = () => {
    // loop `SettingsDefaultValues` keys and set a new Setting only if it doesn't exist
    for (const settingDefault_Key of Object.keys(SettingsDefaultValues)) {
      if (this.#simulationContext.getSetting({ name: settingDefault_Key }) != null) continue;

      this.#simulationContext.setSetting([{
        name: settingDefault_Key,
        value: SettingsDefaultValues[settingDefault_Key]
      }]);
    }
  };

  /** Set Active Settings */
  #setActiveSettings () {
    this.#setSettingsFromATable(tablesInfo.ActiveSet);
  }

  /** Set Settings from a table, sanitizing values
   * @param {{tableName: string, columns: { scenario: string, unit: string, name: string, date: string, value: string }}} table
   * */
  #setSettingsFromATable = (table) => {
    if (this.#moduleData?.tables == null) return;

    // loop all tables
    for (const _table of this.#moduleData.tables) {
      // if tableName == table.name, loop all rows and create a setting for each entry
      if (eq2(_table.tableName, table.tableName)) {
        for (const row of _table.table) {
          // read value from row (key match trim & case insensitive)
          // and sanitize setting value taking the sanitization settings from SettingsSchemas object (the setting name is the key of the object);
          // if the setting name is not found in SettingsSchemas, the sanitization is set to empty `{}` and the setting value is not sanitized
          let _value = sanitize({
            value: get2(row, table.columns.value),
            sanitization: get2(SettingsSchemas, get2(row, table.columns.name)) ?? {},
            options: SettingsSanitizationOptions
          });

          // create setting reading scenario, unit, name, date from row (key match trim & case insensitive)
          this.#simulationContext.setSetting([{
            scenario: get2(row, table.columns.scenario),
            unit: get2(row, table.columns.unit),
            name: get2(row, table.columns.name),
            date: get2(row, table.columns.date),
            value: _value
          }]);
        }
      }
    }
  };
}
