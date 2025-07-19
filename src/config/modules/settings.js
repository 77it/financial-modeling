export { MODULE_NAME, tablesNames, moduleSanitization };

import * as CONST from './_const.js';
import { schema, deepFreeze } from '../../modules/deps.js';

const MODULE_NAME = 'settings';

const tablesNames = {
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
// - tableName: name of the table to sanitize, used by `sanitizeModuleData` to match one of the input tables with the related sanitization settings
// - parse: [OPTIONAL] parse method for the column, done before sanitization
// - sanitization: [OPTIONAL] sanitization method for the columns; if not present, the column will not be sanitized
// - sanitizationOptions: [OPTIONAL] options for sanitization `sanitize()` function
/** @type {{tableName: string, parse?: *, sanitization?: *, sanitizationOptions?: *}[]} */
const moduleSanitization = [
  {
    tableName: tablesNames.SET.tableName,
    parse: {
      [tablesNames.SET.columns.SCENARIO]: CONST.YAML_PARSE,
      [tablesNames.SET.columns.VALUE]: CONST.YAML_PARSE
    },
    sanitization: {
      [tablesNames.SET.columns.SCENARIO]: schema.STRING_TYPE,
      [tablesNames.SET.columns.UNIT]: schema.STRING_TYPE,
      [tablesNames.SET.columns.NAME]: schema.STRING_TYPE,
      [tablesNames.SET.columns.DATE]: schema.DATE_TYPE,
      [tablesNames.SET.columns.VALUE]: schema.ANY_TYPE
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  },
  {
    tableName: tablesNames.ACTIVESET.tableName,
    parse: {
      [tablesNames.SET.columns.VALUE]: CONST.YAML_PARSE
    },
    sanitization: {
      [tablesNames.ACTIVESET.columns.SCENARIO]: schema.STRING_TYPE,
      [tablesNames.ACTIVESET.columns.UNIT]: schema.STRING_TYPE,
      [tablesNames.ACTIVESET.columns.NAME]: schema.STRING_TYPE,
      [tablesNames.ACTIVESET.columns.DATE]: schema.DATE_TYPE,
      [tablesNames.ACTIVESET.columns.VALUE]: schema.ANY_TYPE
    },
    sanitizationOptions: {
      defaultDate: new Date(0)
    }
  }
];

deepFreeze(tablesNames);
deepFreeze(moduleSanitization);
