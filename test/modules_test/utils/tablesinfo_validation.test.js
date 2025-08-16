// run with deno test --allow-import

import { tablesInfoValidation } from '../../../src/modules/_utils/tablesinfo_validation.js';
import * as CONST from '../../../src/config/modules/_const.js';

import { schema } from '../../deps.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const tablesInfo_wellDone = {
  TABLE_A: {
    tableName: 'tableA',
    description: 'Description for table A',  // optional
    columns: {
      COLUMN_A: {
        name: 'columnA',
        sanitization: schema.STRING_TYPE,
        description: 'Description for column A',  // optional
        parse: CONST.YAML_PARSE,  // optional
        values: {  // optional
          ACCOUNTING_TYPE: 'type',
          ACCOUNTING_VS_TYPE: 'vs type'
        }
      },
      COLUMN_B: {
        name: 'columnB',
        sanitization: schema.ANY_TYPE,
      }
    },
    sanitizationOptions: {  // optional
      defaultDate: new Date(0)
    }
  }
};

// clone tablesInfo_wellDone and add an empty table
const tablesInfo_withEmptyTable = structuredClone(tablesInfo_wellDone);
//@ts-ignore add empty table
tablesInfo_withEmptyTable['TAB_B'] = {};

// clone tablesInfo_wellDone to add errors
const tablesInfo_withErrors = structuredClone(tablesInfo_wellDone);
//@ts-ignore remove the table name
tablesInfo_withErrors.TABLE_A.tableName = '';
tablesInfo_withErrors.TABLE_A.columns.COLUMN_A.name = '';
//@ts-ignore add new field to TABLE_A
tablesInfo_withErrors.TABLE_A.NEW_FIELD_1 = 'aaa';
//@ts-ignore add new field to TABLE_A.columns.COLUMN_A
tablesInfo_withErrors.TABLE_A.columns.COLUMN_A.NEW_FIELD_2 = 'aaa';

t('tablesInfoValidation test: successful', async () => {
  tablesInfoValidation(tablesInfo_wellDone);
});

t('tablesInfoValidation test: null object', async () => {
  assert.throws(() => {
    tablesInfoValidation(null);
  },
  /tableInfo is null or undefined/
  );
});

t('tablesInfoValidation test: empty object', async () => {
  assert.throws(() => {
    tablesInfoValidation({});
  },
  /tableInfo is not a valid object: must be at least an object with a key/
  );
});

t('tablesInfoValidation test: empty table', async () => {
  assert.throws(() => {
    tablesInfoValidation(tablesInfo_withEmptyTable);
  },
  /TAB_B: Validation error: \["tableName is missing","columns is missing"] in {}/
  );
});

t('tablesInfoValidation test: table with various errors', async () => {
  let _error = '';

  try {
    tablesInfoValidation(tablesInfo_withErrors);
  } catch (error) {
    //@ts-ignore add error message
    _error = error.message;
  }

  assert(_error.includes('TABLE_A: Validation error: ["NEW_FIELD_1 is not a valid key, is missing from validation object","tableName = , must be a non-empty string"]'))
  assert(_error.includes('TABLE_A.COLUMN_A: Validation error: ["NEW_FIELD_2 is not a valid key, is missing from validation object","name = , must be a non-empty string"]'))
});
