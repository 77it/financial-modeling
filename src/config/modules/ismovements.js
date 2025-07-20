// TODO to implement

export { tablesInfo };

import { schema, deepFreeze, tablesInfoValidation } from '../../modules/deps.js';

// for tablesInfo schema and validation see function `tablesInfoValidation` in `src/modules/_utils/tablesinfo_validation.js`
const tablesInfo = {
  SETTINGS: {
    tableName: 'settings',
    columns: {
      NAME: {
        name: 'name',
        sanitization: schema.STRING_TYPE
      },
      VALUE: {
        name: 'value',
        sanitization: schema.ANY_TYPE
      }
    },
  },
  SET: {
    tableName: 'set',
    columns: {
      CATEGORY: {
        name: 'category',
        sanitization: schema.STRING_TYPE
      }
    },
  }
};

deepFreeze(tablesInfo);
tablesInfoValidation(tablesInfo);
