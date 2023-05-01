// TODO to implement

// IMPLEMENTATION NOTES
/*
# describe as JSON5 loan as start date, end date, tasso iniziale, tasso attuale + capitale residuo a fine periodo (es fine anno, 25 mln)

Calcola piano #1 con capitale 1.000.000 e precisione 4, tasso 1,5%
Calcola piano #2, es 25.000.000, tasso 2,3% impostando:
* Scadenze future con le rate dalla successiva alla data di bilancio alla fine
* Quota capitale nuove rate: capitale singola scadenza piano #1 / 1mln * 25mln
* Capitale residuo: ricalcolato rata per rata con la nuova quota capitale (capitale rata precedente - capitale calcolato al punto precedente)
* Interessi nuove rate: interessi singola scadenza piano #1 / 1,5 * 2,3 / capitale residuo #1 * capitale residuo #2

Useful because the plan don’t start at 31.12.XXXX but we have to regenerate a plan to split the dates
 */

import { deepFreeze, validation, ModuleData, SimulationContextDaily, SimulationContextStart, sanitization } from '../deps.js';
import { sanitizeModuleData } from './_utils/utils.js';

const MODULE_NAME = 'genericmovement';
const tablesInfo = {};
tablesInfo.Settings = {};
tablesInfo.Settings.tableName = 'settings';
tablesInfo.Settings.columns = { name: 'name', value: 'value' };
tablesInfo.Settings.sanitization = {
  [tablesInfo.Settings.columns.name]: sanitization.STRING_TYPE,
  [tablesInfo.Settings.columns.value]: sanitization.ANY_TYPE
};
tablesInfo.Set = {};
tablesInfo.Set.tableName = 'set';
tablesInfo.Set.columns = { categoria: 'categoria', category: 'category' };
tablesInfo.Set.sanitization = {
  [tablesInfo.Set.columns.categoria]: sanitization.STRING_TYPE,
  [tablesInfo.Set.columns.category]: sanitization.STRING_TYPE
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
  }

  // TODO oneTimeBeforeTheSimulationStartsGetInfo, with context with only
  //#getSetting;
  //#getDriver;
  //#getTaskLock;
  // legge da Settings Unit Historical end e ne salva il valore

  /**
   * Called daily, as first step of daily modeling.
   * @param {Object} p
   * @param {SimulationContextDaily} p.simulationContextDaily
   * @returns {void}
   */
  beforeDailyModeling ({ simulationContextDaily }) {
    // do something
  }

  /**
   * Called daily, after `beforeDailyModeling`
   * @param {Object} p
   * @param {SimulationContextDaily} p.simulationContextDaily
   * @returns {void}
   */
  dailyModeling ({ simulationContextDaily }) {
    // loop all tables
    for (const table in this.#moduleData?.tables) {
      // if tableName == tablesInfo.Set.name, loop all rows and create a setting for each entry
      if (table === tablesInfo.Set.tableName) {
        for (const row of table) {
          //TODO create ledger entry
          //in base al valore di Setting Unit Historical end, per capire se muovere vs cash o vs PN.
        }
      }
    }
  }

  /**
   * Called only one time, after the simulation ends.
   * @param {Object} p
   * @param {SimulationContextDaily} p.simulationContextDaily
   * @returns {void}
   */
  oneTimeAfterTheSimulationEnds ({ simulationContextDaily }) {
    // do something
  }
}
