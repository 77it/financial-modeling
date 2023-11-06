// TODO to implement

export { MODULE_NAME, tablesInfo };

import { schema, deepFreeze } from '../../deps.js';

//#region names of module, tables and columns in the external source file (excel, json, etc.)
const MODULE_NAME = 'ismovements';

const SETTINGS = 'settings';
const SETTINGS_NAME = 'name';
const SETTINGS_VALUE = 'value';

const SET = 'set';
const SET_CATGORIA = 'categoria';
const SET_CATEGORY = 'category';
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
      categoria: SET_CATGORIA,
      category: SET_CATEGORY
    },
    sanitization: {
      [SET_CATGORIA]: schema.STRING_TYPE,
      [SET_CATEGORY]: schema.STRING_TYPE
    }
  }
};
deepFreeze(tablesInfo);
