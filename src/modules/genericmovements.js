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
import { tablesInfo, moduleSanitization } from '../config/modules/genericmovements.js';
import { Agenda } from './_utils/Agenda.js';
import { sanitizeModuleData } from './_utils/sanitize_module_data.js';
import { moduleDataLookup } from './_utils/search/module_data_lookup.js';
import { searchDateKeys } from './_utils/search/search_date_keys.js';
import { SimObject_Metadata } from '../engine/simobject/parts/simobject_metadata.js';
import { YAMLtoSimObject_Metadata } from './_utils/yaml_to_simobject_metadata.js';
import { ModuleData, SimulationContext, schema, sanitize, eq2, get2, isNullOrWhiteSpace, mergeNewKeys } from '../deps.js';

export class Module {
  //#region private fields
  /** @type {boolean} */
  #alive;
  /** @type {undefined|Date} */
  #startDate;
  /** @type {ModuleData} */
  #moduleData;
  /** Simulation Context
   * @type {SimulationContext} */
  #ctx;
  /** @type {Agenda} */
  #agenda;
  /** @type {string} */
  #active_unit;
  /** @type {SimObject_Metadata} */
  #activeMetadata;

  //#region data from modules
  /** @type {undefined|string} */
  #accounting_type__default;
  #accounting_type__default__moduleDataLookup = {
    lookup_value: tablesInfo.SETTINGS.names.TYPE,
    sanitization: schema.STRINGUPPERCASETRIMMED_TYPE,
    tableName: tablesInfo.SETTINGS.tableName,
    lookup_column: tablesInfo.SETTINGS.columns.NAME,
    return_column: tablesInfo.SETTINGS.columns.VALUE
  };
  /** @type {undefined|string} */
  #accounting_opposite_type__default;
  #accounting_opposite_type__default__moduleDataLookup = {
    lookup_value: tablesInfo.SETTINGS.names.VS_TYPE,
    sanitization: schema.STRINGUPPERCASETRIMMED_TYPE,
    tableName: tablesInfo.SETTINGS.tableName,
    lookup_column: tablesInfo.SETTINGS.columns.NAME,
    return_column: tablesInfo.SETTINGS.columns.VALUE
  };
  //#endregion data from modules

  //#endregion private fields

  constructor () {
    this.#alive = true;
    this.#startDate = undefined;
    this.#active_unit = '';
    //@ts-ignore  will be set later
    this.#activeMetadata = undefined;
    //@ts-ignore  will be set later
    this.#moduleData = undefined;
    //@ts-ignore  will be set later
    this.#ctx = undefined;
    //@ts-ignore  will be set later
    this.#agenda = undefined;
  }

  /** @returns {boolean} */
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
    this.#moduleData = sanitizeModuleData({ moduleData, moduleSanitization });
    // save simulationContext
    this.#ctx = simulationContext;
  }

  /** Get info from TaskLocks, Settings and Drivers, and save them for later reuse */
  prepareDataForDailyModeling () {
    if (this.#moduleData?.tables == null) return;

    // read from Settings ACTIVE_UNIT & ACTIVE_METADATA and save the values
    this.#active_unit = this.#ctx.getSetting({ name: SETTINGS_NAMES.Simulation.ACTIVE_UNIT });
    this.#activeMetadata = YAMLtoSimObject_Metadata(this.#ctx.getSetting({ unit: this.#active_unit, name: SETTINGS_NAMES.Simulation.ACTIVE_METADATA }));

    // init Agenda with #active_unit & reading from settings $$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE
    this.#agenda = new Agenda({ simulationStartDate: this.#ctx.getSetting({ unit: this.#active_unit, name: SETTINGS_NAMES.Unit.$$SIMULATION_START_DATE__LAST_HISTORICAL_DAY_IS_THE_DAY_BEFORE }) });

    this.#accounting_type__default = moduleDataLookup(this.#moduleData, this.#accounting_type__default__moduleDataLookup);
    this.#accounting_opposite_type__default = moduleDataLookup(this.#moduleData, this.#accounting_opposite_type__default__moduleDataLookup);
    if (isNullOrWhiteSpace(this.#accounting_opposite_type__default))
      this.#accounting_opposite_type__default = this.#ctx.getSetting({ name: SETTINGS_NAMES.Simulation.$$DEFAULT_ACCOUNTING_VS_TYPE });

    // loop all tables
    for (const currTab of this.#moduleData.tables) {
      const tSet = tablesInfo.SET.columns;
      if (eq2(currTab.tableName, tablesInfo.SET.tableName)) {
        // search data column keys named as dates in currTab.table[0]
        const simulationColumns = searchDateKeys({ obj: currTab.table[0], prefix: this.#ctx.getSetting({ name: SETTINGS_NAMES.Simulation.$$SIMULATION_COLUMN_PREFIX }) });
        const historicalColumns = searchDateKeys({ obj: currTab.table[0], prefix: this.#ctx.getSetting({ name: SETTINGS_NAMES.Simulation.$$HISTORICAL_COLUMN_PREFIX }) });

        for (const row of currTab.table) {
          // TODO loop table and save data to agenda;

          if (!get2(row, tSet.INACTIVE)) {
            const simulation_input = get2(row, tSet.SIMULATION_INPUT);
            const accounting_type = get2(row, tSet.ACCOUNTING_TYPE) ?? this.#accounting_type__default;
            const accounting_opposite_type = get2(row, tSet.ACCOUNTING_OPPOSITE_TYPE) ?? this.#accounting_opposite_type__default;
            const simObject_name = get2(row, tSet.SIMOBJECT_NAME) ?? '';

            const warning = [];
            if (isNullOrWhiteSpace(accounting_type))
              warning.push('Accounting type is missing');
            if (isNullOrWhiteSpace(accounting_opposite_type))
              warning.push('Accounting opposite type is missing');
            if (warning.length > 0){
              this.#ctx.warning(warning);
              continue;
            }

            // loop `historicalColumns`
            for (const column of historicalColumns) {
              const value = sanitize({ value: row[column.key], sanitization: schema.NUMBER_TYPE, options: { defaultNumber: undefined } });

              if (value == null) continue;
              this.#agenda.set({
                date: column.date,
                isSimulation: false,
                data: new AgendaData({ value, accounting_type, accounting_opposite_type, simObject_name, simulation_input })
              });
            }

            // loop `simulationColumns`
            for (const column of simulationColumns) {
              const value = sanitize({ value: row[column.key], sanitization: schema.NUMBER_TYPE, options: { defaultNumber: undefined } });

              if (value == null) continue;
              this.#agenda.set({
                date: column.date,
                isSimulation: true,
                data: new AgendaData({ value, accounting_type, accounting_opposite_type, simObject_name, simulation_input })
              });
            }
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

    // add activeMetadata to current SimObject with 'mergeNewKeys'

    // if 'accounting_opposite_type' is 'SimObjectTypes_enum.BS_CASH__BANKACCOUNT_FINANCIALACCOUNT',
    // use the utility function 'squareTrnWithCash'
  }
}

/**
 * Private class used to store data in the agenda
 * @private
 */
class AgendaData {
  /**
   * @param {{value: number, accounting_type: string, accounting_opposite_type: string, simObject_name: string, simulation_input?: * }} p
   */
  constructor ({ value, accounting_type, accounting_opposite_type, simObject_name, simulation_input }) {
    this.value = value;
    this.accounting_type = accounting_type;
    this.accounting_opposite_type = accounting_opposite_type;
    this.simObject_name = simObject_name;
    this.simulation_input = simulation_input;
  }
}
