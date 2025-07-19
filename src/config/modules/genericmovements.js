export { tablesNames, tablesEnums, moduleSanitization };

import { schema, deepFreeze } from '../../modules/deps.js';

const tablesNames = {
  SETTINGS: {
    tableName: 'settings',
    columns: {
      NAME: 'name',
      VALUE: 'value'
    }
  },
  SET: {
    tableName: 'set',
    columns: {
      INACTIVE: 'inactive',
      SIMULATION_INPUT: 'simulation input',
      ACCOUNTING_TYPE: 'type',
      ACCOUNTING_OPPOSITE_TYPE: 'vs type',
      SIMOBJECT_NAME: 'name'
    }
  }
};

const tablesEnums = {
  SETTINGS: {
    columns: {
      NAME: {
        ACCOUNTING_TYPE: 'type',
        ACCOUNTING_VS_TYPE: 'vs type'
      },
    }
  }
};

const tablesExplanations = {
  SET: {
    columns: {
      INACTIVE: 'boolean flag to mark a row for execution or not',
      SIMULATION_INPUT: 'input for the simulation (loan description, etc.)',
      SIMOBJECT_NAME: 'SimObject name'
    }
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
      [tablesNames.SET.columns.INACTIVE]: schema.BOOLEAN_TYPE,
      [tablesNames.SET.columns.SIMULATION_INPUT]: schema.ANY_TYPE,
      [tablesNames.SET.columns.ACCOUNTING_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [tablesNames.SET.columns.ACCOUNTING_OPPOSITE_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [tablesNames.SET.columns.SIMOBJECT_NAME]: schema.STRINGUPPERCASETRIMMED_TYPE,
    },
  }
];

deepFreeze(tablesNames);
deepFreeze(moduleSanitization);
