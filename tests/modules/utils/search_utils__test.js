import { assert, assertFalse, assertEquals, assertNotEquals } from '../../deps.js';
import { sanitization } from '../../deps.js';

import { xlookup } from '../../../src/modules/_utils/search_utils.js';

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
  const lookup_array = [999, 1, 'two', 3, 'four', 999, 'five', 6, 'seven'];
  const return_array = ['nineninenine', 'one', 2, 'three', 4, 'NINENINENINE', 5, 'six', 7];

  /** @type {*} */
  let p = null;

  // {lookup_value: *, lookup_array: *[], return_array: *[], return_first_match: boolean, sanitization?: string, sanitizationOptions?: Object }

  p = { lookup_value: 999, lookup_array, return_array };
  assertEquals(xlookup(p), 'nineninenine');  // return_first_match default = true;
  p = { lookup_value: 999, lookup_array, return_array, return_first_match: true };
  assertEquals(xlookup(p), 'nineninenine');
  p = { lookup_value: 999, lookup_array, return_array, return_first_match: false };
  assertEquals(xlookup(p), 'NINENINENINE');

  p = { lookup_value: 'five', lookup_array, return_array, return_first_match: false };
  assertEquals(xlookup(p), 5);
  p = { lookup_value: 6, lookup_array, return_array, return_first_match: false };
  assertEquals(xlookup(p), 'six');

  // with sanitization
  p = { lookup_value: 'five', lookup_array, return_array, return_first_match: false, sanitization: sanitization.STRING_TYPE };
  assertEquals(xlookup(p), '5');
  p = { lookup_value: 6, lookup_array, return_array, return_first_match: false, sanitization: sanitization.NUMBER_TYPE };
  assertEquals(xlookup(p), 0);

  // with sanitization and sanitizationOptions
  p = { lookup_value: 6, lookup_array, return_array, return_first_match: false, sanitization: sanitization.NUMBER_TYPE, sanitizationOptions: {defaultNumber: 123} };
  assertEquals(xlookup(p), 123);
});
