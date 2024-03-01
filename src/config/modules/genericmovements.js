export { MODULE_NAME, tablesInfo, moduleSanitization };

import * as CFG from '../engine.js';
import { schema, deepFreeze } from '../../deps.js';

const MODULE_NAME = 'genericmovements';

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
      SIMULATION_INPUT: 'simulation input',
      ACCOUNTING_TYPE: 'type',
      ACCOUNTING_OPPOSITE_TYPE: 'vs type',
      SIMOBJECT_NAME: 'name'
    },
    simulationColumnPrefix: CFG.SIMULATION_COLUMN_PREFIX,
    historicalColumnPrefix: CFG.HISTORICAL_COLUMN_PREFIX
  }
};

/** @type {{tableName: string, parsing?: *, sanitization?: *, sanitizationOptions?: *}[]} */
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
      [tablesInfo.SET.columns.SIMULATION_INPUT]: schema.ANY_TYPE,
      [tablesInfo.SET.columns.ACCOUNTING_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [tablesInfo.SET.columns.ACCOUNTING_OPPOSITE_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [tablesInfo.SET.columns.SIMOBJECT_NAME]: schema.STRINGUPPERCASETRIMMED_TYPE,
    },
  }
];

deepFreeze(tablesInfo);
deepFreeze(moduleSanitization);
