export { ModuleInfo };

import { TaskLocks_Names } from '../config/tasklocks_names.js';
import { SettingsSanitization, SettingsSanitizationOptions } from '../config/settings_names.js';
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
    this.#moduleData = sanitizeModuleData({ moduleData, moduleSanitization: Object.values(tablesInfo) });
    // save simulationContext
    this.#simulationContext = simulationContext;

    // set simulation lock
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SETTINGS, value: this.#setSimulationSettings });
  }

  /** Set Settings and Drivers */
  setBeforeTheSimulationStarts () {
    this.#setActiveSettings();
  }

  /** Get info from settings and drivers, and save them for later reuse */
  getBeforeTheSimulationStarts () {
    this.#setActiveSettings();
  }

  /** Set Simulation Settings */
  #setSimulationSettings () {
    // loop all tables
    for (const table in this.#moduleData.tables) {
      // if tableName == tablesInfo.Set.name, loop all rows and create a setting for each entry
      if (lowerCaseCompare(table, tablesInfo.Set.tableName)) {
        for (const row of table) {
          // sanitize setting value taking the sanitization settings from SettingsSanitization object (the setting name is the key of the object)
          const _value = sanitization.sanitize({
            value: row[tablesInfo.Set.columns.value],
            sanitization: SettingsSanitization[row[tablesInfo.Set.columns.name]],
            options: SettingsSanitizationOptions
          });

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

  /** Set Active Settings */
  #setActiveSettings () {
    // loop all tables
    for (const table in this.#moduleData.tables) {
      // if tableName == tablesInfo.ActiveSet.name, loop all rows and create a setting for each entry
      if (lowerCaseCompare(table, tablesInfo.ActiveSet.tableName)) {
        for (const row of table) {
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
