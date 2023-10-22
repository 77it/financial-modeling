import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { schema } from '../../deps.js';
import { ModuleData } from '../../../src/engine/modules/module_data.js';

import { xlookup, moduleDataLookup, searchDateKeys } from '../../../src/modules/_utils/search_utils.js';

Deno.test('xlookup test: undefined', async () => {
  /** @type {*} */
  let p = null;

  // {lookup_value: *, lookup_array: *[], return_array: *[], return_first_match: boolean, sanitization?: string, sanitizationOptions?: Object }

  p = { lookup_value: null, lookup_array: [], return_array: [], return_first_match: false };
  assertEquals(xlookup(p), undefined);

  p = { lookup_value: undefined, lookup_array: [], return_array: [], return_first_match: true };
  assertEquals(xlookup(p), undefined);

  p = { lookup_value: undefined, lookup_array: [], return_array: [] };
  assertEquals(xlookup(p), undefined);

  p = { lookup_value: 'abc', lookup_array: [1], return_array: [], return_first_match: false };  // array of different length
  assertEquals(xlookup(p), undefined);

  p = { lookup_value: 'abc', lookup_array: [], return_array: ['a'], return_first_match: false };  // array of different length
  assertEquals(xlookup(p), undefined);
});

Deno.test('xlookup test: test search', async () => {
  const lookup_array = [99, 1, 'two', 3, 'four', 99, ' FiVe ', 6, 'seven'];
  const return_array = ['ninenine', 'one', 2, 'three', 4, 'NINENINE', 5, 'six', 7];

  /** @type {*} */
  let p = null;

  // {lookup_value: *, lookup_array: *[], return_array: *[], return_first_match: boolean, sanitization?: string, sanitizationOptions?: Object }

  p = { lookup_value: 99, lookup_array, return_array };
  assertEquals(xlookup(p), 'ninenine');  // return_first_match default = true;
  p = { lookup_value: 99, lookup_array, return_array, return_first_match: true };
  assertEquals(xlookup(p), 'ninenine');
  p = { lookup_value: 99, lookup_array, return_array, return_first_match: false };
  assertEquals(xlookup(p), 'NINENINE');

  p = { lookup_value: '   FIVE   ', lookup_array, return_array, return_first_match: false };  // automatic string conversion, trim and lowercase
  assertEquals(xlookup(p), 5);
  p = { lookup_value: '   FIVE   ', lookup_array, return_array, return_first_match: false, string_insensitive_match: false };  // DISABLING automatic string conversion, trim and lowercase
  assertEquals(xlookup(p), undefined);
  p = { lookup_value: ' FiVe ', lookup_array, return_array, return_first_match: false, string_insensitive_match: false };  // DISABLING automatic string conversion, trim and lowercase
  assertEquals(xlookup(p), 5);

  p = { lookup_value: 'five', lookup_array, return_array, return_first_match: false };  // automatic string conversion, trim and lowercase
  assertEquals(xlookup(p), 5);
  p = { lookup_value: '6', lookup_array, return_array, return_first_match: false };  // automatic string conversion, trim and lowercase
  assertEquals(xlookup(p), 'six');

  // with sanitization
  p = { lookup_value: 'five', lookup_array, return_array, return_first_match: false, sanitization: schema.STRING_TYPE };
  assertEquals(xlookup(p), '5');
  p = { lookup_value: 6, lookup_array, return_array, return_first_match: false, sanitization: schema.NUMBER_TYPE };
  assertEquals(xlookup(p), 0);

  // with sanitization and sanitizationOptions
  p = {
    lookup_value: 6,
    lookup_array,
    return_array,
    return_first_match: false,
    sanitization: schema.NUMBER_TYPE,
    sanitizationOptions: { defaultNumber: 123 }
  };
  assertEquals(xlookup(p), 123);
});

Deno.test('moduleDataLookup test: test search', async () => {
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
  ];

  const tableB_2_data = [
    { name: 99, value: 'ninenine2' },
    { name: 1, value: 'one' },
    { name: 'two', value: 2 },
    { name: 3, value: 'three' },
    { name: 'four', value: 4 },
    { name: 99, value: 'NINENINE2' },
    { name: ' FiVe ', value: 5 },
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
  p = { lookup_value: null, lookup_key: 'name', return_key: 'value', return_first_match: false };
  assertEquals(moduleDataLookup(moduleData, p), undefined);
  p = { lookup_value: undefined, lookup_key: 'name', return_key: 'value', return_first_match: false };
  assertEquals(moduleDataLookup(moduleData, p), undefined);

  p = { tableName: 'tabB', lookup_key: 'name', return_key: 'value' };

  //@ts-ignore
  assertEquals(moduleDataLookup(null, p), undefined);

  p.lookup_value = 99;
  assertEquals(moduleDataLookup(moduleData, p), 'ninenine');  // return_first_match default = true;
  p.return_first_match = true;
  assertEquals(moduleDataLookup(moduleData, p), 'ninenine');
  p.return_first_match = false;
  assertEquals(moduleDataLookup(moduleData, p), 'NINENINE2');  // last value is returned (from the second table)

  p.lookup_value = '   FIVE   ';
  p.return_first_match = false;
  assertEquals(moduleDataLookup(moduleData, p), 5);  // automatic string conversion, trim and lowercase
  p.string_insensitive_match = false;
  assertEquals(moduleDataLookup(moduleData, p), undefined);  // DISABLING automatic string conversion, trim and lowercase
  p.lookup_value = ' FiVe ';
  assertEquals(moduleDataLookup(moduleData, p), 5);  // DISABLING automatic string conversion, trim and lowercase

  p.lookup_value = 'five';
  p.string_insensitive_match = true;
  assertEquals(moduleDataLookup(moduleData, p), 5);  // automatic string conversion, trim and lowercase
  p.lookup_value = '6';
  assertEquals(moduleDataLookup(moduleData, p), 'six');  // automatic string conversion, trim and lowercase

  // with sanitization
  p.lookup_value = 'five';
  p.sanitization = schema.STRING_TYPE;
  assertEquals(moduleDataLookup(moduleData, p), '5');
  p.lookup_value = 6;
  p.sanitization = schema.NUMBER_TYPE;
  assertEquals(moduleDataLookup(moduleData, p), 0);

  // with sanitization and sanitizationOptions
  p.sanitizationOptions = { defaultNumber: 123 };
  assertEquals(moduleDataLookup(moduleData, p), 123);
});

Deno.test('searchDateKeys test', async () => {
  const obj = {
    '#2023-12-25T05:20:10': 1,  // time part is stripped
    b: 2,  // ignored, not starting with prefix
    99: 2,  // ignored, not starting with prefix
    '#2023/01/29': 3,
    '#2023/01/XX': 3,  // ignored, not parsable as a date
  }

  const exp = [
    {key: "#2023-12-25T05:20:10", date: new Date(2023, 11, 25)},
    {key: "#2023/01/29", date: new Date(2023, 0, 29)}
  ];

  const obj2 = {
    'h#2023-12-25': 1,
    b: 2,  // ignored, not starting with prefix
    99: 2,  // ignored, not starting with prefix
    'H#2023/01/29': 3,
    'H#2023/01/XX': 3,  // ignored, not parsable as a date
  }

  const exp2 = [
    {key: "h#2023-12-25", date: new Date(2023, 11, 25)},  // case insensitive
    {key: "H#2023/01/29", date: new Date(2023, 0, 29)}
  ];

  assertEquals(JSON.stringify(searchDateKeys({ obj, prefix: '#' })), JSON.stringify(exp));
  assertEquals(JSON.stringify(searchDateKeys({ obj: obj2, prefix: 'H#' })), JSON.stringify(exp2));
  assertEquals(JSON.stringify(searchDateKeys({ obj: obj2, prefix: 'h#' })), JSON.stringify(exp2));  // case insensitive
});
