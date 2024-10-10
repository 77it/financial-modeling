// for a more flexible parsing standard, see YAML tests "tests/lib_tests/yaml__test.js"

import { parseJSON5 } from '../../src/lib/json5.js';

import { test } from 'node:test';
import assert from 'node:assert';
import { parseYAML } from '../../src/lib/yaml.js';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('JSON5 tests', () => {
  // parse will go in error (invalid string), then returns undefined
  assert.deepStrictEqual(parseJSON5('[ciao, mamma]'), undefined);

  //#region parsing null and undefined
  // parsing undefined returns undefined
  assert.deepStrictEqual(parseJSON5(undefined), undefined);

  // parsing null returns null
  assert.deepStrictEqual(parseJSON5(null), undefined);
  //#endregion parsing null and undefined

  //#region parsing strings with and without quotes
  // parsing a with quotes returns the string
  assert.deepStrictEqual(parseJSON5('"ciao"'), 'ciao');

  // parsing a string without quotes returns undefined
  assert.deepStrictEqual(parseJSON5('ciao'), undefined);
  //#endregion parsing null and undefined

  //#region parsing a number with decimal separated by comma, returns undefined
  // because the number is not recognized as a number, but as an invalid string
  assert.deepStrictEqual(parseJSON5('999,159'), undefined);
  assert.deepStrictEqual(parseJSON5('999, 159'), undefined);
  //#endregion parsing a number with decimal separated by comma, returns a undefined

  //#region parsing numbers returns the number
  assert.deepStrictEqual(parseJSON5(999), 999);
  //#endregion parsing numbers returns the number

  //#region parsing object returns the object
  const obj = {Main:999.159, Name:'Y88 x'};
  let parsedObj = parseJSON5(obj);
  assert.deepStrictEqual(parsedObj.Main, 999.159);
  assert.deepStrictEqual(parsedObj.Name, 'Y88 x');
  //#endregion parsing object returns the object

  //#region parsing object serialized in string
  const txt = '{\'Main\':999.159, Name:\'Y88 x\'}';
  let parsed = parseJSON5(txt);
  assert.deepStrictEqual(parsed.Main, 999.159);
  assert.deepStrictEqual(parsed.Name, 'Y88 x');
  //#endregion parsing object serialized in string

  //#region parsing array of something
  // array with comma separated numbers in an array are not recognized as numbers nor string, but split at every ,
  const txt1 = '[1, 2, 1,1 , 2,2]';
  let parsed1 = parseJSON5(txt1);
  assert.deepStrictEqual(parsed1, [1, 2, 1, 1, 2, 2]);
  assert.notDeepStrictEqual(parsed1, [1, 2, '1,1', '2,2']);

  const txt2 = '[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start:\'2024-06-01\', NP:2, npy:2}]';
  let parsed2 = parseJSON5(txt2);
  assert.deepStrictEqual(parsed2[0], ['2023-01-05', 155343.53]);
  assert.deepStrictEqual(parsed2[2].NP, 2);

  const txt4 = '[\'ciao\', "mamma"]';
  let parsed4 = parseJSON5(txt4);
  assert.deepStrictEqual(parsed4, ['ciao', 'mamma']);
  //#endregion parsing array of something
});
