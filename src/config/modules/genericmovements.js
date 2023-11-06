export { MODULE_NAME, tablesInfo };

import * as CFG from '../engine.js';
import { schema, deepFreeze } from '../../deps.js';

//#region names of module, tables and columns in the external source file (excel, json, etc.)
const MODULE_NAME = 'genericmovements';

const SETTINGS = 'settings';
const SETTINGS_NAME = 'name';
const SETTINGS_VALUE = 'value';

const SET = 'set';
const SET_SIMULATION_INPUT = 'simulation input';
const SET_ACCOUNTING_TYPE = 'type';
const SET_ACCOUNTING_OPPOSITE_TYPE = 'vs type';
const SET_SIMOBJECT_NAME = 'name';
//#endregion names

const tablesInfo = {
  Settings: {
    tableName: SETTINGS,
    columns: {
      name: SETTINGS_NAME,
      value: SETTINGS_VALUE
    },
    sanitization: {
      [SETTINGS_NAME]: schema.STRING_TYPE,
      [SETTINGS_VALUE]: schema.ANY_TYPE
    }
  },
  Set: {
    tableName: SET,
    columns: {
      simulation_input: SET_SIMULATION_INPUT,
      accounting_type: SET_ACCOUNTING_TYPE,
      accounting_opposite_type: SET_ACCOUNTING_OPPOSITE_TYPE,
      simObject_name: SET_SIMOBJECT_NAME
    },
    sanitization: {
      [SET_SIMULATION_INPUT]: schema.ANY_TYPE,
      [SET_ACCOUNTING_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [SET_ACCOUNTING_OPPOSITE_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [SET_SIMOBJECT_NAME]: schema.STRINGUPPERCASETRIMMED_TYPE,
    },
    simulationColumnPrefix: CFG.SIMULATION_COLUMN_PREFIX,
    historicalColumnPrefix: CFG.HISTORICAL_COLUMN_PREFIX
  }
};
deepFreeze(tablesInfo);
