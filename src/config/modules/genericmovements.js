export { tablesInfo };

import { schema, deepFreeze, tablesInfoValidation } from '../../modules/deps.js';

// for tablesInfo schema and validation see function `tablesInfoValidation` in `src/modules/_utils/tablesinfo_validation.js`
const tablesInfo = {
  SETTINGS: {
    tableName: 'settings',
    description: 'Settings table for storing various configurations about this module',
    columns: {
      NAME: {
        name: 'name',
        sanitization: schema.STRING_TYPE,
        values: {
          ACCOUNTING_TYPE: 'type',
          ACCOUNTING_VS_TYPE: 'vs type'
        }
      },
      VALUE: {
        name: 'value',
        sanitization: schema.ANY_TYPE,
      }
    }
  },
  SET: {
    tableName: 'set',
    description: 'Set table to define accounting writings',
    columns: {
      INACTIVE: {
        name: 'inactive',
        description: 'boolean flag to mark a row for execution or not',
        sanitization: schema.BOOLEAN_TYPE,
      },
      SIMULATION_INPUT: {
        name: 'simulation input',
        description: 'input for the simulation (loan description, etc.)',
        sanitization: schema.ANY_TYPE,
      },
      ACCOUNTING_TYPE: {
        name: 'type',
        sanitization: schema.STRINGUPPERCASETRIMMED_TYPE,
      },
      ACCOUNTING_OPPOSITE_TYPE: {
        name: 'vs type',
        sanitization: schema.STRINGUPPERCASETRIMMED_TYPE,
      },
      SIMOBJECT_NAME: {
        name: 'name',
        description: 'SimObject name',
        sanitization: schema.STRINGUPPERCASETRIMMED_TYPE,
      }
    }
  }
};

tablesInfoValidation(tablesInfo);
deepFreeze(tablesInfo);
