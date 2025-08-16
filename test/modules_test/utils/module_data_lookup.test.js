import { moduleDataLookup } from '../../../src/modules/_utils/search/module_data_lookup.js';

import { schema } from '../../deps.js';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('moduleDataLookup test: test search', async () => {
  const tableB_1_data = [
    { name: 99, value: 'ninenine' },
    { name: 1, value: 'one' },
    { name: 'two', value: 2 },
    { name: 3, value: 'three' },
    { name: 'four', value: 4 },
    { name: 99, value: 'NINENINE' },
    { name: ' FiVe ', value: 5 },
    { name: 6, value: 'six' },
    { name: 'seven', value: 7 },
    { name: '9', value: 'aaa' },
  ];

  const tableB_2_data = [
    { name: 99, value: 'ninenine2' },
    { name: 1, value: 'one' },
    { name: 'two', value: 2 },
    { name: 3, value: 'three' },
    { name: 'four', value: 4 },
    { name: 99, value: 'NINENINE2' },
    { name: ' FiVe ', value: 88 },
    { name: 6, value: 'six' },
    { name: 'seven', value: 7 },
  ];

  const moduleData = new ModuleData({
    moduleName: 'aaa', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
    tables: [
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_1_data },
      { tableName: 'tabA', table: [] },
      { tableName: 'tabB', table: tableB_2_data }
    ]
  });

  /** @type {*} */
  let p = null;

  // {lookup_value: *, lookup_array: *[], return_array: *[], return_first_match: boolean, sanitization?: string, sanitizationOptions?: Object }

  // rest undefined return
  p = { lookup_value: null, lookup_column: 'name', return_column: 'value', return_first_match: false };
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), undefined);
  p = { lookup_value: undefined, lookup_column: 'name', return_column: 'value', return_first_match: false };
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), undefined);

  p = {
    tableName: '   TABB   ',  // with default string_insensitive_match, automatic string conversion (trim and lowercase) of tableName
    lookup_column: 'name',
    return_column: 'value'
  };

  //@ts-ignore
  assert.deepStrictEqual(moduleDataLookup(null, p), undefined);

  p.lookup_value = 99;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 'ninenine');  // return_first_match default = true;

  p.return_first_match = true;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 'ninenine');

  p.return_first_match = false;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 'NINENINE2');  // last value is returned (from the second table)

  p.return_first_match = false;
  p.lookup_value = '   FIVE   ';
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 88);  // string_insensitive_match of value + return from the second table

  p.string_insensitive_match = false;
  p.tableName = '   TABB   ';
  p.lookup_value = ' FiVe ';
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), undefined);  // DISABLING string_insensitive_match, the table name is not matched anymore

  p.tableName = 'tabB';
  p.lookup_value = '   FIVE   ';
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), undefined);  // DISABLING string_insensitive_match, the value is not matched anymore

  p.lookup_value = ' FiVe ';
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 88);  // exact value match + return from the second table

  p.lookup_value = 'five';
  p.string_insensitive_match = true;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 88);  // string_insensitive_match of value + return from the second table
  p.lookup_value = 6;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 'six');

  // failing search of string where the value is number, and viceversa
  p.lookup_value = 9;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), undefined);
  p.lookup_value = '1';
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), undefined);

  // with sanitization
  p.lookup_value = 'five';
  p.sanitization = schema.STRING_TYPE;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), '88');  // return from the second table
  p.lookup_value = 6;
  p.sanitization = schema.NUMBER_TYPE;
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 0);

  // with sanitization and sanitizationOptions
  p.sanitizationOptions = { defaultNumber: 123 };
  assert.deepStrictEqual(moduleDataLookup(moduleData, p), 123);
});
