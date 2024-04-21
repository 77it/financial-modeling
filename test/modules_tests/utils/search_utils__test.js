import { xlookup, moduleDataLookup, searchDateKeys } from '../../../src/modules/_utils/search_utils.js';

import { schema } from '../../../test2/deps.js';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

t('xlookup test: undefined', async () => {
  /** @type {*} */
  let p = null;

  // {lookup_value: *, lookup_array: *[], return_array: *[], return_first_match: boolean, sanitization?: string, sanitizationOptions?: Object }

  p = { lookup_value: null, lookup_array: [], return_array: [], return_first_match: false };
  assert.deepStrictEqual(xlookup(p), undefined);

  p = { lookup_value: undefined, lookup_array: [], return_array: [], return_first_match: true };
  assert.deepStrictEqual(xlookup(p), undefined);

  p = { lookup_value: undefined, lookup_array: [], return_array: [] };
  assert.deepStrictEqual(xlookup(p), undefined);

  p = { lookup_value: 'abc', lookup_array: [1], return_array: [], return_first_match: false };  // array of different length
  assert.deepStrictEqual(xlookup(p), undefined);

  p = { lookup_value: 'abc', lookup_array: [], return_array: ['a'], return_first_match: false };  // array of different length
  assert.deepStrictEqual(xlookup(p), undefined);
});

t('xlookup test: test search', async () => {
  const lookup_array = [99, 1, 'two', 3, 'four', 99, ' FiVe ', 6, 'seven', '9'];
  const return_array = ['ninenine', 'one', 2, 'three', 4, 'NINENINE', 5, 'six', 7, 'xxx'];
  const return_array_wrong_shorter = ['ninenine'];

  /** @type {*} */
  let p = null;

  // {lookup_value: *, lookup_array: *[], return_array: *[], return_first_match: boolean, sanitization?: string, sanitizationOptions?: Object }

  p = { lookup_value: 99, lookup_array, return_array };
  assert.deepStrictEqual(xlookup(p), 'ninenine');  // return_first_match default = true;
  p = { lookup_value: 99, lookup_array, return_array, return_first_match: true };
  assert.deepStrictEqual(xlookup(p), 'ninenine');
  p = { lookup_value: 99, lookup_array, return_array, return_first_match: false };
  assert.deepStrictEqual(xlookup(p), 'NINENINE');

  p = { lookup_value: '   FIVE   ', lookup_array, return_array, return_first_match: false };  // automatic string conversion, trim and lowercase
  assert.deepStrictEqual(xlookup(p), 5);
  p = { lookup_value: '   FIVE   ', lookup_array, return_array, return_first_match: false, string_insensitive_match: false };  // DISABLING automatic string conversion, trim and lowercase
  assert.deepStrictEqual(xlookup(p), undefined);
  p = { lookup_value: ' FiVe ', lookup_array, return_array, return_first_match: false, string_insensitive_match: false };  // DISABLING automatic string conversion, trim and lowercase
  assert.deepStrictEqual(xlookup(p), 5);

  p = { lookup_value: 'five', lookup_array, return_array, return_first_match: false };  // automatic string conversion, trim and lowercase
  assert.deepStrictEqual(xlookup(p), 5);
  p = { lookup_value: 6, lookup_array, return_array, return_first_match: false };
  assert.deepStrictEqual(xlookup(p), 'six');

  // with sanitization
  p = { lookup_value: 'five', lookup_array, return_array, return_first_match: false, sanitization: schema.STRING_TYPE };
  assert.deepStrictEqual(xlookup(p), '5');
  p = { lookup_value: 6, lookup_array, return_array, return_first_match: false, sanitization: schema.NUMBER_TYPE };
  assert.deepStrictEqual(xlookup(p), 0);

  // failing search of string where the value is number, and viceversa
  p = { lookup_value: 9, lookup_array, return_array, return_first_match: false };
  assert.deepStrictEqual(xlookup(p), undefined);
  p = { lookup_value: '1', lookup_array, return_array, return_first_match: false };
  assert.deepStrictEqual(xlookup(p), undefined);

  // return undefined the array length is different
  p = { lookup_value: 99, lookup_array, return_array_wrong_shorter, return_first_match: false };
  assert.deepStrictEqual(xlookup(p), undefined);

  // with sanitization and sanitizationOptions
  p = {
    lookup_value: 6,
    lookup_array,
    return_array,
    return_first_match: false,
    sanitization: schema.NUMBER_TYPE,
    sanitizationOptions: { defaultNumber: 123 }
  };
  assert.deepStrictEqual(xlookup(p), 123);
});

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
    { name: '9', value: 'xxx' },
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
    moduleName: 'xxx', moduleAlias: '', moduleEngineURI: '', moduleSourceLocation: '',
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

t('searchDateKeys test', async () => {
  const obj = {
    '#2023-12-25T05:20:10': 1,  // time part is stripped
    b: 2,  // ignored, not starting with prefix
    99: 2,  // ignored, not starting with prefix
    '#2023/01/29': 3,
    '#2023/01/XX': 3,  // ignored, not parsable as a date
  };

  const exp = [
    { key: '#2023-12-25T05:20:10', date: new Date(2023, 11, 25) },
    { key: '#2023/01/29', date: new Date(2023, 0, 29) }
  ];

  const obj2 = {
    'h#2023-12-25': 1,
    b: 2,  // ignored, not starting with prefix
    99: 2,  // ignored, not starting with prefix
    'H#2023/01/29': 3,
    'H#2023/01/XX': 3,  // ignored, not parsable as a date
  };

  const exp2 = [
    { key: 'h#2023-12-25', date: new Date(2023, 11, 25) },  // case insensitive
    { key: 'H#2023/01/29', date: new Date(2023, 0, 29) }
  ];

  assert.deepStrictEqual(JSON.stringify(searchDateKeys({ obj, prefix: '#' })), JSON.stringify(exp));
  assert.deepStrictEqual(JSON.stringify(searchDateKeys({ obj: obj2, prefix: 'H#' })), JSON.stringify(exp2));
  assert.deepStrictEqual(JSON.stringify(searchDateKeys({ obj: obj2, prefix: 'h#' })), JSON.stringify(exp2));  // case insensitive
});
