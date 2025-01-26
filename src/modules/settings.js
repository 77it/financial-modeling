// here is not defined the YAML parsing, because parse option is set in the object 'moduleSanitization'
// in the settings module config file `src/config/modules/settings.js`
// imported and used below
import { tablesInfo, moduleSanitization } from '../config/modules/settings.js';
import { TaskLocks_Names } from '../config/tasklocks_names.js';
import { SettingsSchemas, SettingsSanitizationOptions } from '../config/settings.schemas.js';
import { sanitizeModuleData } from './_utils/sanitize_module_data.js';
import { sanitize, ModuleData, SimulationContext, eq2, get2 } from '../deps.js';

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
    this.#moduleData = sanitizeModuleData({ moduleData, moduleSanitization });
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
    this.#setSettingsFromATable(tablesInfo.SET);
  };

  /** Set Active Settings */
  #setActiveSettings () {
    this.#setSettingsFromATable(tablesInfo.ACTIVESET);
  }

  /** Set Settings from a table, sanitizing values
   * @param {{tableName: string, columns: { SCENARIO: string, UNIT: string, NAME: string, DATE: string, VALUE: string }}} table
   * */
  #setSettingsFromATable = (table) => {
    if (this.#moduleData?.tables == null) return;

    // loop all tables
    for (const _table of this.#moduleData.tables) {
      // if tableName == table.name, loop all rows and create a setting for each entry
      if (eq2(_table.tableName, table.tableName)) {
        for (const row of _table.table) {
          // read value from row (key match trim & case insensitive)
          const _value = get2(row, table.columns.VALUE);
          // takes the sanitization settings from SettingsSchemas object (the setting name is the key of the object);
          // if the setting name is not found in SettingsSchemas, the sanitization is set to empty string '' and the setting value is not sanitized
          const _sanitization = get2(SettingsSchemas, get2(row, table.columns.NAME)) ?? '';

          const _sanitizedValue = sanitize({
            value: _value,
            sanitization: _sanitization,
            options: SettingsSanitizationOptions,
            keyInsensitiveMatch: true
          });

          // create setting reading scenario, unit, name, date from row (key match trim & case insensitive)
          this.#simulationContext.setSetting([{
            scenario: get2(row, table.columns.SCENARIO),
            unit: get2(row, table.columns.UNIT),
            name: get2(row, table.columns.NAME),
            date: get2(row, table.columns.DATE),
            value: _sanitizedValue
          }]);
        }
      }
    }
  };
}
