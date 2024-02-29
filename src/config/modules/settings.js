export { MODULE_NAME, tablesInfo };

import * as CONST from './_const.js';
import { schema, deepFreeze } from '../../deps.js';

//#region names of module, tables and columns in the external source file (excel, json, etc.)
const MODULE_NAME = 'settings';

const SET = 'set';
const SET_SCENARIO = 'scenario';
const SET_UNIT = 'unit';
const SET_NAME = 'name';
const SET_DATE = 'date';
const SET_VALUE = 'value';

const ACTIVESET = 'activeset';
const ACTIVESET_SCENARIO = 'scenario';
const ACTIVESET_UNIT = 'unit';
const ACTIVESET_NAME = 'name';
const ACTIVESET_DATE = 'date';
const ACTIVESET_VALUE = 'value';
//#endregion names

// used by `sanitizeModuleData` function.
// keys explanation:
// - tableName: name of the table in the database
// - columns: names of the columns in the table
// - parsing: [OPTIONAL] parsing method for the column, done before sanitization
// - sanitization: [OPTIONAL] sanitization method for the columns; if not present, the column will not be sanitized
// - sanitizationOptions: [OPTIONAL] options for sanitization `sanitizeObj` function
const tablesInfo = {
  Set: {
    tableName: SET,
    columns: {
      scenario: SET_SCENARIO,
      unit: SET_UNIT,
      name: SET_NAME,
      date: SET_DATE,
      value: SET_VALUE
    },
    parsing: {
      [SET_VALUE]: CONST.YAML_PARSING
    },
    sanitization: {
      [SET_SCENARIO]: schema.STRING_TYPE,
      [SET_UNIT]: schema.STRING_TYPE,
      [SET_NAME]: schema.STRING_TYPE,
      [SET_DATE]: schema.DATE_TYPE,
      [SET_VALUE]: schema.ANY_TYPE
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  },
  ActiveSet: {
    tableName: ACTIVESET,
    columns: { scenario: ACTIVESET_SCENARIO, unit: ACTIVESET_UNIT, name: ACTIVESET_NAME, date: ACTIVESET_DATE, value: ACTIVESET_VALUE },
    sanitization: {
      [ACTIVESET_SCENARIO]: schema.STRING_TYPE,
      [ACTIVESET_UNIT]: schema.STRING_TYPE,
      [ACTIVESET_NAME]: schema.STRING_TYPE,
      [ACTIVESET_DATE]: schema.DATE_TYPE,
      [ACTIVESET_VALUE]: schema.ANY_TYPE
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  }
};
deepFreeze(tablesInfo);
