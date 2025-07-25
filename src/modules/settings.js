// here is not defined the YAML parsing, because parse option is set in the object 'tablesInfo'
// in the settings module config file `src/config/modules/settings.js`
// imported and used below
import { tablesInfo } from '../config/modules/settings.js';
import { TaskLocks_Names } from '../config/tasklocks_names.js';
import { SettingsSchemas, SettingsSanitizationOptions } from '../config/settings.schemas.js';
import { sanitizeModuleData } from './_utils/sanitize_module_data.js';
import { sanitize, validate, ModuleData, SimulationContext, eq2, get2 } from './deps.js';

export class Module {
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
    this.#moduleData = sanitizeModuleData({ moduleData: moduleData, tablesInfo: tablesInfo });
    // save simulationContext
    this.#simulationContext = simulationContext;
  }

  /** Set TaskLocks before the simulation starts (can be defined also during simulation, if needed) */
  setTaskLocksBeforeTheSimulationStarts () {
    // set tasks that will be executed later to set settings value
    this.#simulationContext.setTaskLock({ name: TaskLocks_Names.SIMULATION__SIMULATION_SETTINGS__SET, value: this.#taskLock_setSimulationSettings });
  }

  /** Set Settings and Drivers (can be defined also during simulation, if needed) */
  setDriversAndSettingsBeforeTheSimulationStarts () {
    this.#setActiveSettings();
  }

  /** Get info from TaskLocks, Settings and Drivers, and save them for later reuse; process moduleData before daily modeling */
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

  // is an arrow function because it is used as a callback
  /** Set Simulation Settings */
  #taskLock_setSimulationSettings = () => {
    this.#sanitizeValidateAndSetSettingsFromATable(tablesInfo.SET);
  };

  /** Set Active Settings */
  #setActiveSettings () {
    this.#sanitizeValidateAndSetSettingsFromATable(tablesInfo.ACTIVESET);
  }

  /**
   * Set Settings from a table, sanitizing values:
   * - loop all tables in `this.#moduleData.tables`
   * - if `tablesInfo.tableName` matches the table name from the parameter in a case-insensitive way, loop all rows
   * - for each row:
   *   - read the value from the row using the column name from `tablesInfo.columns.VALUE.name`
   *   - sanitize and validate the value using the sanitization settings from `SettingsSchemas` object (the match is done in a case-insensitive way)
   *   - if the sanitization is not found, simply set the value without sanitization
   * @param {{tableName: string, columns: { SCENARIO: {name: string}, UNIT: {name: string}, NAME: {name: string}, DATE: {name: string}, VALUE: {name: string} }}} tablesInfo
   */
  #sanitizeValidateAndSetSettingsFromATable = (tablesInfo) => {
    if (this.#moduleData?.tables == null) return;

    // loop all tables
    for (const _table of this.#moduleData.tables) {
      // if tableName == table.name, loop all rows and create a setting for each entry
      if (eq2(_table.tableName, tablesInfo.tableName)) {
        for (const row of _table.table) {
          // read value from row (key match trim & case insensitive)
          const _value = get2(row, tablesInfo.columns.VALUE.name);
          // takes the sanitization settings from SettingsSchemas object
          // (the setting name is the key of the object, the match is done in a case-insensitive way)
          // if the setting name is not found in SettingsSchemas, the sanitization is set to undefined and the setting value is not sanitized
          const _sanitization = get2(SettingsSchemas, get2(row, tablesInfo.columns.NAME.name));

          let _sanitizedValue = _value; // default value is not sanitized

          if (_sanitization != null) {
            _sanitizedValue = sanitize({
              value: _value,
              sanitization: _sanitization,
              options: SettingsSanitizationOptions,
              keyInsensitiveMatch: true,
            });

            validate({
              value: _sanitizedValue,
              validation: _sanitization
            });
          }

          // create setting reading scenario, unit, name, date from row (key match trim & case insensitive)
          this.#simulationContext.setSetting([{
            scenario: get2(row, tablesInfo.columns.SCENARIO.name),
            unit: get2(row, tablesInfo.columns.UNIT.name),
            name: get2(row, tablesInfo.columns.NAME.name),
            date: get2(row, tablesInfo.columns.DATE.name),
            value: _sanitizedValue
          }]);
        }
      }
    }
  };
}
