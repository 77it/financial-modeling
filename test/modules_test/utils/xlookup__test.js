import { xlookup } from '../../../src/modules/_utils/search/xlookup.js';

import { schema } from '../../deps.js';

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
