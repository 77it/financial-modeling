// TODO to implement

export { tablesNames, moduleSanitization };

import { schema, deepFreeze } from '../../modules/deps.js';

const tablesNames = {
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
    tableName: tablesNames.SETTINGS.tableName,
    sanitization: {
      [tablesNames.SETTINGS.columns.NAME]: schema.STRING_TYPE,
      [tablesNames.SETTINGS.columns.VALUE]: schema.ANY_TYPE
    }
  },
  {
    tableName: tablesNames.SET.tableName,
    sanitization: {
      [tablesNames.SET.columns.CATEGORIA]: schema.STRING_TYPE,
      [tablesNames.SET.columns.CATEGORY]: schema.STRING_TYPE
    }
  }
];

deepFreeze(tablesNames);
deepFreeze(moduleSanitization);
