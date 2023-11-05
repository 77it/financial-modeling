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

import * as SETTINGS_NAMES from '../config/settings_names.js';
import { tablesInfo } from '../config/modules/ismovements.js';
import * as CFG from '../config/engine.js';
import { Agenda } from './_utils/Agenda.js';
import { sanitizeModuleData } from './_utils/sanitization_utils.js';
import { moduleDataLookup, searchDateKeys } from './_utils/search_utils.js';
import { deepFreeze, ModuleData, SimulationContext, schema, sanitize, eq2, get2, isNullOrWhiteSpace } from '../deps.js';

const MODULE_NAME = 'genericmovements';
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
  /** @type {Agenda} */
  #agenda;
  /** @type {string} */
  #ACTIVE_UNIT;

  //#region data from modules
  /** @type {undefined|string} */
  #accounting_type__default;
  #accounting_type__default__moduleDataLookup = {
    lookup_value: 'type',
    sanitization: schema.STRINGUPPERCASETRIMMED_TYPE,
    tableName: tablesInfo.Settings.tableName,
    lookup_key: tablesInfo.Settings.columns.name,
    return_key: tablesInfo.Settings.columns.value
  };
  /** @type {undefined|string} */
  #accounting_opposite_type__default;
  #accounting_opposite_type__default__moduleDataLookup = {
    lookup_value: 'vs type',
    sanitization: schema.STRINGUPPERCASETRIMMED_TYPE,
    tableName: tablesInfo.Settings.tableName,
    lookup_key: tablesInfo.Settings.columns.name,
    return_key: tablesInfo.Settings.columns.value
  };
  //#endregion data from modules

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
    this.#ACTIVE_UNIT = '';
    //@ts-ignore
    this.#moduleData = undefined;
    //@ts-ignore
    this.#simulationContext = undefined;
    //@ts-ignore
    this.#agenda = undefined;
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
    // save moduleData, after sanitizing it (call it with 'Object.values' to generate an array of all sanitizations)
    this.#moduleData = sanitizeModuleData({ moduleData, moduleSanitization: Object.values(tablesInfo) });
    // save simulationContext
    this.#simulationContext = simulationContext;
  }

  /** Get info from TaskLocks, Settings and Drivers, and save them for later reuse */
  prepareDataForDailyModeling () {
    if (this.#moduleData?.tables == null) return;

    // read from Settings Unit Historical end and save the value
    this.#ACTIVE_UNIT = this.#simulationContext.getSetting({ name: SETTINGS_NAMES.Simulation.ACTIVE_UNIT });

    this.#agenda = new Agenda({simulationStartDate: this.#simulationContext.getSetting({ unit: this.#ACTIVE_UNIT, name: SETTINGS_NAMES.Unit.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE })});

    this.#accounting_type__default = moduleDataLookup(this.#moduleData, this.#accounting_type__default__moduleDataLookup);
    this.#accounting_opposite_type__default = moduleDataLookup(this.#moduleData, this.#accounting_opposite_type__default__moduleDataLookup);
    if (isNullOrWhiteSpace(this.#accounting_opposite_type__default))
      this.#accounting_opposite_type__default = this.#simulationContext.getSetting({ name: SETTINGS_NAMES.Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE });

    // loop all tables
    for (const _currTab of this.#moduleData.tables) {
      const _tSet = tablesInfo.Set;
      if (eq2(_currTab.tableName, _tSet.tableName)) {
        // search data column keys named as dates in _currTab.table[0]
        const _simulationColumns = searchDateKeys({ obj: _currTab.table[0], prefix: _tSet.simulationColumnPrefix });
        const _historicalColumns = searchDateKeys({ obj: _currTab.table[0], prefix: _tSet.historicalColumnPrefix });

        for (const row of _currTab.table) {
          // TODO loop table and save data to agenda

          const _accounting_type = get2(row, _tSet.columns.accounting_type) ?? this.#accounting_type__default;
          const _accounting_opposite_type = get2(row, _tSet.columns.accounting_opposite_type) ?? this.#accounting_opposite_type__default;
          const _simObject_name = get2(row, _tSet.columns.simObject_name) ?? '';

          if (isNullOrWhiteSpace(_accounting_type) || isNullOrWhiteSpace(_accounting_opposite_type)) continue;

          // loop `_historicalColumns`
          for (const _column of _historicalColumns) {
            const _value = sanitize({ value: row[_column.key], sanitization: schema.NUMBER_TYPE, options: { defaultNumber: undefined } });
            if (_value == null) continue;

            this.#agenda.set({
              date: _column.date,
              isSimulation: false,
              data: new set_data({value: _value, accounting_type: _accounting_type, accounting_opposite_type: _accounting_opposite_type, simObject_name: _simObject_name})
            });
          }

          // loop `_simulationColumns`
          for (const _column of _simulationColumns) {
            const _value = sanitize({ value: row[_column.key], sanitization: schema.NUMBER_TYPE, options: { defaultNumber: undefined } });
            if (_value == null) continue;

            this.#agenda.set({
              date: _column.date,
              isSimulation: true,
              data: new set_data({value: _value, accounting_type: _accounting_type, accounting_opposite_type: _accounting_opposite_type, simObject_name: _simObject_name})
            });
          }
        }
      }
    }

    this.#startDate = this.#agenda.getFirstDate();
  }

  /**
   * Called daily, after `beforeDailyModeling`
   * @param {Object} p
   * @param {Date} p.today
   */
  dailyModeling ({ today }) {
    // TODO loop agenda and create SimObjects

    // if 'accounting_opposite_type' is 'SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT',
    // use the utility function 'squareTrnWithCash'
  }
}

// internal class used to store data in the agenda
class set_data {
  /**
   * @param {{value: number, accounting_type: string, accounting_opposite_type: string, simObject_name: string}} p
   */
  constructor({value, accounting_type, accounting_opposite_type, simObject_name}) {
    this.value = value;
    this.accounting_type = accounting_type;
    this.accounting_opposite_type = accounting_opposite_type;
    this.simObject_name = simObject_name;
  }
}
