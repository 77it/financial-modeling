export { tablesInfo, moduleSanitization };

import * as CFG from '../engine.js';
import * as GLOBALS from '../globals.js';
import { schema, deepFreeze } from '../../modules/deps.js';

const tablesInfo = {
  SETTINGS: {
    tableName: 'settings',
    columns: {
      NAME: 'name',
      VALUE: 'value'
    },
    names: {
      TYPE: 'type',
      VS_TYPE: 'vs type',
    }
  },
  SET: {
    tableName: 'set',
    columns: {
      INACTIVE: 'inactive',  // boolean flag to mark a row for execution or not
      SIMULATION_INPUT: 'simulation input',  // input for the simulation (loan description, etc.)
      ACCOUNTING_TYPE: 'type',
      ACCOUNTING_OPPOSITE_TYPE: 'vs type',
      SIMOBJECT_NAME: 'name'  // SimObject name
    }
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
      [tablesInfo.SET.columns.INACTIVE]: schema.BOOLEAN_TYPE,
      [tablesInfo.SET.columns.SIMULATION_INPUT]: schema.ANY_TYPE,
      [tablesInfo.SET.columns.ACCOUNTING_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [tablesInfo.SET.columns.ACCOUNTING_OPPOSITE_TYPE]: schema.STRINGUPPERCASETRIMMED_TYPE,
      [tablesInfo.SET.columns.SIMOBJECT_NAME]: schema.STRINGUPPERCASETRIMMED_TYPE,
    },
  }
];

deepFreeze(tablesInfo);
deepFreeze(moduleSanitization);
