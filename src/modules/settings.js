export { ModuleInfo };

import { SettingsSanitization, SettingsSanitizationOptions } from '../config/settings_names.js';
import { deepFreeze, sanitization, ModuleData, SimulationContextDaily, SimulationContextStart } from '../deps.js';
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

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
    this.#moduleData = undefined;
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
    // save moduleData, after sanitizing it
    this.#moduleData = sanitizeModuleData({moduleData, moduleSanitization: Object.values(tablesInfo)});

    // loop all tables
    for (const table in this.#moduleData.tables) {
      // if tableName == tablesInfo.Set.name, loop all rows and create a setting for each entry
      if (table === tablesInfo.Set.tableName) {
        for (const row of table) {
          // sanitize setting value
          const _value = sanitization.sanitize({
            value: row[tablesInfo.Set.columns.value],
            sanitization: SettingsSanitization[row[tablesInfo.Set.columns.name]],
            options: SettingsSanitizationOptions
          });

          // create setting
          simulationContextStart.setSetting([{
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
}
