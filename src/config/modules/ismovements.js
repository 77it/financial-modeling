// TODO to implement

export { tablesInfo, moduleSanitization };

import { schema, deepFreeze } from '../../deps.js';

const tablesInfo = {
  SETTINGS: {
    tableName: 'settings',
    columns: {
      NAME: 'name',
      VALUE: 'value'
    },
  },
  SET: {
    tableName: 'set',
    columns: {
      CATEGORIA: 'categoria',
      CATEGORY: 'category'
    },
  }
};

/** @type {{tableName: string, parse?: *, sanitization?: *, sanitizationOptions?: *}[]} */
const moduleSanitization = [
  {
    tableName: tablesInfo.SETTINGS.tableName,
    sanitization: {
      [tablesInfo.SETTINGS.columns.NAME]: schema.STRING_TYPE,
      [tablesInfo.SETTINGS.columns.VALUE]: schema.ANY_TYPE
    }
  },
  {
    tableName: tablesInfo.SET.tableName,
    sanitization: {
      [tablesInfo.SET.columns.CATEGORIA]: schema.STRING_TYPE,
      [tablesInfo.SET.columns.CATEGORY]: schema.STRING_TYPE
    }
  }
];

deepFreeze(tablesInfo);
deepFreeze(moduleSanitization);
