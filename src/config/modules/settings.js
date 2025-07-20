export { MODULE_NAME, tablesInfo };

import * as CONST from './_const.js';
import { schema, deepFreeze, tablesInfoValidation } from '../../modules/deps.js';

const MODULE_NAME = 'settings';

// for tablesInfo schema and validation see function `tablesInfoValidation` in `src/modules/_utils/tablesinfo_validation.js`
const tablesInfo = {
  SET: {
    tableName: 'set',
    columns: {
      SCENARIO: {
        name: 'scenario',
        parse: CONST.YAML_PARSE,
        sanitization: schema.ARRAY_OF_STRINGS_TYPE
      },
      UNIT: {
        name: 'unit',
        sanitization: schema.ARRAY_OF_STRINGS_TYPE
      },
      NAME: {
        name: 'name',
        sanitization: schema.STRING_TYPE
      },
      DATE: {
        name: 'date',
        sanitization: schema.DATE_TYPE,
      },
      VALUE: {
        name: 'value',
        parse: CONST.YAML_PARSE,
        sanitization: schema.ANY_TYPE
      }
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  },
  ACTIVESET: {
    tableName: 'activeset',
    columns: {
      SCENARIO: {
        name: 'scenario',
        parse: CONST.YAML_PARSE,
        sanitization: schema.ARRAY_OF_STRINGS_TYPE
      },
      UNIT: {
        name: 'unit',
        sanitization: schema.ARRAY_OF_STRINGS_TYPE
      },
      NAME: {
        name: 'name',
        sanitization: schema.STRING_TYPE
      },
      DATE: {
        name: 'date',
        sanitization: schema.DATE_TYPE,
      },
      VALUE: {
        name: 'value',
        parse: CONST.YAML_PARSE,
        sanitization: schema.ANY_TYPE
      }
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  }
};

deepFreeze(tablesInfo);
tablesInfoValidation(tablesInfo);
