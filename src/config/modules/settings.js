export { MODULE_NAME, tablesInfo, moduleSanitization };

import * as CONST from './_const.js';
import { schema, deepFreeze } from '../../deps.js';

const MODULE_NAME = 'settings';

const tablesInfo = {
  SET: {
    tableName: 'set',
    columns: {
      SCENARIO: 'scenario',
      UNIT: 'unit',
      NAME: 'name',
      DATE: 'date',
      VALUE: 'value'
    }
  },
  ACTIVESET: {
    tableName: 'activeset',
    columns: {
      SCENARIO: 'scenario',
      UNIT: 'unit',
      NAME: 'name',
      DATE: 'date',
      VALUE: 'value'
    }
  }
};

// array of objects, used by `sanitizeModuleData` function.
// keys explanation:
// - tableName: name of the table in the database
// - parse: [OPTIONAL] parse method for the column, done before sanitization
// - sanitization: [OPTIONAL] sanitization method for the columns; if not present, the column will not be sanitized
// - sanitizationOptions: [OPTIONAL] options for sanitization `sanitizeObj` function
/** @type {{tableName: string, parse?: *, sanitization?: *, sanitizationOptions?: *}[]} */
const moduleSanitization = [
  {
    tableName: tablesInfo.SET.tableName,
    parse: {
      [tablesInfo.SET.columns.VALUE]: CONST.YAML_PARSE
    },
    sanitization: {
      [tablesInfo.SET.columns.SCENARIO]: schema.STRING_TYPE,
      [tablesInfo.SET.columns.UNIT]: schema.STRING_TYPE,
      [tablesInfo.SET.columns.NAME]: schema.STRING_TYPE,
      [tablesInfo.SET.columns.DATE]: schema.DATE_TYPE,
      [tablesInfo.SET.columns.VALUE]: schema.ANY_TYPE
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  },
  {
    tableName: tablesInfo.ACTIVESET.tableName,
    parse: {
      [tablesInfo.SET.columns.VALUE]: CONST.YAML_PARSE
    },
    sanitization: {
      [tablesInfo.ACTIVESET.columns.SCENARIO]: schema.STRING_TYPE,
      [tablesInfo.ACTIVESET.columns.UNIT]: schema.STRING_TYPE,
      [tablesInfo.ACTIVESET.columns.NAME]: schema.STRING_TYPE,
      [tablesInfo.ACTIVESET.columns.DATE]: schema.DATE_TYPE,
      [tablesInfo.ACTIVESET.columns.VALUE]: schema.ANY_TYPE
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  }
];

deepFreeze(tablesInfo);
deepFreeze(moduleSanitization);
