export { ModuleInfo };

import { TaskLocks_Names } from '../config/tasklocks_names.js';
import { SettingsDefaultValues } from '../config/settings_default_values.js';
import { SettingsSanitization, SettingsSanitizationOptions } from '../config/settings_sanitization.js';
import { deepFreeze, sanitization, ModuleData, SimulationContext, lowerCaseCompare } from '../deps.js';
import { sanitizeModuleData } from './_utils/utils.js';

const MODULE_NAME = 'settings';
const tablesInfo = {};
tablesInfo.Set = {};
tablesInfo.Set.tableName = 'set';
tablesInfo.Set.columns = { scenario: 'scenario', unit: 'unit', name: 'name', date: 'date', value: 'value' };
tablesInfo.Set.sanitization = {
  [tablesInfo.Set.columns.scenario]: sanitization.STRING_TYPE,
  [tablesInfo.Set.columns.unit]: sanitization.STRING_TYPE,
  [tablesInfo.Set.columns.name]: sanitization.STRING_TYPE,
  [tablesInfo.Set.columns.date]: sanitization.DATE_TYPE,
  [tablesInfo.Set.columns.value]: sanitization.ANY_TYPE
};
tablesInfo.Set.sanitizationOptions = {
  defaultDate: new Date(0)
};
tablesInfo.ActiveSet = {};
tablesInfo.ActiveSet.tableName = 'activeset';
tablesInfo.ActiveSet.columns = { scenario: 'scenario', unit: 'unit', name: 'name', date: 'date', value: 'value' };
tablesInfo.ActiveSet.sanitization = {
  [tablesInfo.ActiveSet.columns.scenario]: sanitization.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.unit]: sanitization.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.name]: sanitization.STRING_TYPE,
  [tablesInfo.ActiveSet.columns.date]: sanitization.DATE_TYPE,
  [tablesInfo.ActiveSet.columns.value]: sanitization.ANY_TYPE
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
  /** @type {undefined|ModuleData} */
  #moduleData;
  /** @type {SimulationContext} */
  #simulationContext;

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
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
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SETTINGS, value: this.#setSimulationSettings });
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__DEFAULT_ACTIVE_SETTINGS, value: this.#setSettingsDefaultValues });
  }

  /** Set Settings and Drivers */
  setDriversAndSettingsBeforeTheSimulationStarts () {
    this.#setActiveSettings();
  }

  /** Get info from TaskLocks, Settings and Drivers, and save them for later reuse */
  getInfoBeforeTheSimulationStarts () {
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
    if (this.#moduleData?.tables == null) return;

    // loop all tables
    for (const _table of this.#moduleData.tables) {
      // if tableName == tablesInfo.Set.name, loop all rows and create a setting for each entry
      if (lowerCaseCompare(_table.tableName, tablesInfo.Set.tableName)) {
        for (const row of _table.table) {
          let _value = row[tablesInfo.Set.columns.value];

          // sanitize setting value taking the sanitization settings from SettingsSanitization object (the setting name is the key of the object)
          if (SettingsSanitization[row[tablesInfo.Set.columns.name]] != null) {
            _value = sanitization.sanitize({
              value: row[tablesInfo.Set.columns.value],
              sanitization: SettingsSanitization[row[tablesInfo.Set.columns.name]],
              options: SettingsSanitizationOptions
            });
          }

          // create setting
          this.#simulationContext.setSetting([{
            scenario: row[tablesInfo.Set.columns.scenario],
            unit: row[tablesInfo.Set.columns.unit],
            name: row[tablesInfo.Set.columns.name],
            date: row[tablesInfo.Set.columns.date],
            value: _value
          }]);
        }
      }
    }
  }

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
  }

  /** Set Active Settings */
  #setActiveSettings () {
    if (this.#moduleData?.tables == null) return;

    // loop all tables
    for (const _table of this.#moduleData.tables) {
      // if tableName == tablesInfo.ActiveSet.name, loop all rows and create a setting for each entry
      if (lowerCaseCompare(_table.tableName, tablesInfo.ActiveSet.tableName)) {
        for (const row of _table.table) {
          // sanitize setting value taking the sanitization settings from SettingsSanitization object (the setting name is the key of the object)
          const _value = sanitization.sanitize({
            value: row[tablesInfo.ActiveSet.columns.value],
            sanitization: SettingsSanitization[row[tablesInfo.ActiveSet.columns.name]],
            options: SettingsSanitizationOptions
          });

          // create setting
          this.#simulationContext.setSetting([{
            scenario: row[tablesInfo.ActiveSet.columns.scenario],
            unit: row[tablesInfo.ActiveSet.columns.unit],
            name: row[tablesInfo.ActiveSet.columns.name],
            date: row[tablesInfo.ActiveSet.columns.date],
            value: _value
          }]);
        }
      }
    }
  }
}
