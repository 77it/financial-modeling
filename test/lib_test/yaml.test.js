// BEWARE: YAML object definition works only if key is separated form value by at least one space (key: value); doesn't work without space (key:value), as JSON5 does.
// see https://yaml.org/spec/1.2.2/#21-collections

import { localDateToUTC } from '../deps.js';
import { parseYAML as pyml } from '../../src/lib/yaml.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

/** @type {any} */ const dpeq = assert.deepStrictEqual;
/** @type {any} */ const ndpeq = assert.notDeepStrictEqual;

t('YAML tests', () => {
  //#region parsing null and undefined
  // parsing undefined returns undefined
  dpeq(pyml(undefined), undefined);
  // string 'undefined' is not converted to undefined but remains a string
  dpeq(pyml('undefined'), 'undefined');

  // parsing null returns undefined
  dpeq(pyml(null), undefined);
  // string 'null' is converted to null, and is no more a string
  dpeq(pyml('null'), null);
  //#endregion

  // parsing a number with decimal separated by comma, returns a string.
  // is not a problem if later the string is converted to a number in some way
  dpeq(pyml('999,159'), '999,159');
  dpeq(pyml('999, 159'), '999, 159');

  // parsing an object without {} goes in error then is returned undefined
  dpeq(pyml('Main: 89, Ciao: 99'), undefined);

  // parsing a driver as a string (without {}) returns a string
  dpeq(pyml('Driver'), 'Driver');
  dpeq(pyml(' Driver '), 'Driver');
  dpeq(pyml(' UnitA!Driver '), 'UnitA!Driver');
  dpeq(pyml(' Driver[20240101] '), 'Driver[20240101]');
  dpeq(pyml(' UnitA!Driver[20240101] '), 'UnitA!Driver[20240101]');
  // parsing string starting with @ returns undefined only if it's the first char
  dpeq(pyml(' @UnitA!Driver '), undefined);
  dpeq(pyml('@UnitA!Driver[20240101]'), undefined);
  dpeq(pyml('Unit@A!Driver@[@]@'), 'Unit@A!Driver@[@]@');

  // parsing an object without key/value splitting as `{abc}` returns an object with a key with undefined value
  dpeq(pyml('{Driver}'), { Driver: null });
  dpeq(pyml('{ Driver }'), { Driver: null });
  dpeq(pyml('{ UnitA!Driver }'), { 'UnitA!Driver': null });
  // parsing an object with [] as key, returns undefined
  dpeq(pyml('{ Driver[20240101] }'), undefined);
  dpeq(pyml('{Driver[20240101]}'), undefined);
  dpeq(pyml('{ UnitA!Driver[20240101] }'), undefined);
  dpeq(pyml('{UnitA!Driver[20240101]}'), undefined);
  // parsing object starting with @ returns undefined only if it's the first char
  dpeq(pyml('{ @UnitA!Driver }'), undefined);
  dpeq(pyml('{@UnitA!Driver[20240101]}'), undefined);
  dpeq(pyml('{Unit@A!Driver@}'), { 'Unit@A!Driver@': null });

  // parsing an object with key/value without spaces is parsed correctly, with key and value split by the function `parseYAML`
  // also is not a standard YAML feature
  dpeq(pyml('{abc:value}'), { abc: 'value' });
  dpeq(pyml('{abc:999}'), { abc: 999 });
  // the split is NOT done for 'abc:999' because the key 'abc' already exists in the object
  dpeq(pyml('{abc: 888, abc:999}'), { abc: 888,  "abc:999": null });
  dpeq(pyml('{abc:888, abc:999}'), { abc: 888,  "abc:999": null });

  // parsing object with key not separated from value, works only if the key is enclosed in "";
  // otherwise, returns `null` (converted to `undefined` in our library) as value
  const parsed_keys_not_separated_from_values = pyml('{"Main":999.159, \'Main2\':"abcd", Name:"Y88:x", mamma:\'ciao\', mamma3 :99, mamma2:ciao2, mamma-ciao, :ciaociao, "UnitA!Driver[20240101]":ciao ciao}');
  dpeq(
    parsed_keys_not_separated_from_values,
    {
      Main: 999.159,
      Main2: 'abcd',
      Name: 'Y88:x',
      mamma: 'ciao',
      mamma3 :99,
      mamma2: 'ciao2',
      'mamma-ciao': null,
      ':ciaociao': null,
      'UnitA!Driver[20240101]':'ciao ciao'
    });

  //#region parsing strings with and without quotes, returns the string
  dpeq(pyml('"ciao"'), 'ciao');
  dpeq(pyml("'ciao'"), 'ciao');
  dpeq(pyml('ciao'), 'ciao');
  //#endregion

  //#region parsing numbers returns the number
  dpeq(pyml(999), 999);
  dpeq(pyml(-1), -1);
  //#endregion

  //#region parsing dates (only to UTC date or string)
  dpeq(pyml('2023-01-05T00:00:00.000Z'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  dpeq(pyml('2023-01-05'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  dpeq(pyml('2023-1-05'), '2023-1-05');  // YYYY-M-DD is not a date and left as string
  dpeq(pyml('2023-01-5'), '2023-01-5');  // YYYY-MM-D is not a date and left as string
  dpeq(pyml('2023-01'), '2023-01');  // YYYY-MM is not a date and left as string
  dpeq(pyml('2023'), 2023);  // YYYY is converted to number

  dpeq(pyml('2023/01/05'), '2023/01/05');  // YYYY-M-DD is not a YAML date and left as string
  dpeq(pyml('2023.01.05'), '2023.01.05');  // YYYY-M-DD is not a YAML date and left as string
  //#endregion

  //#region parsing range of dates
  dpeq(pyml('2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z'), '2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z');  // left as string
  dpeq(pyml('2023-01-05:2024-01-05'), '2023-01-05:2024-01-05');  // left as string
  dpeq(pyml('2023-01:2024-01'), '2023-01:2024-01');  // left as string
  dpeq(pyml('2023:2024'), '2023:2024');  // left as string
  //#endregion

  //#region parsing object (works with ' and ")
  const parsed = pyml('{\'Main\':999.159, Name: \'Y88 x\', num: -1, \'mamma\':\'ciao\', mamma2 : 99, mamma3 :88}');
  dpeq(parsed.Main, 999.159);
  dpeq(parsed.Name, 'Y88 x');
  dpeq(parsed.num, -1);
  dpeq(parsed.mamma, 'ciao');
  dpeq(parsed.mamma2, 99);
  dpeq(parsed.mamma3, 88);
  assert(!(parsed["mamma3 "] === 88));  // without sanitization, the key would be with space!

  const parsedB = pyml('{"Main":999.159, Name: "Y88 x", num: -1, "mamma":"ciao"}');
  dpeq(parsedB.Main, 999.159);
  dpeq(parsedB.Name, 'Y88 x');
  dpeq(parsed.num, -1);
  dpeq(parsedB.mamma, 'ciao');
  //#endregion

  //#region parsing array of something, strings also without quotes
  // parsing one or more numbers with decimal separated by comma in an array breaks them, splitting at every comma
  // (array with comma separated numbers in an array are not recognized as numbers nor string, but split at every ,)
  ndpeq(pyml('[1,1]'), ['1,1']);  // should be equal, but it's not
  dpeq(pyml('[1,1]'), [1, 1]);  // wrong, number is split at comma
  ndpeq(pyml('[1, 2, 1,1 , 2,2, 5,6,7]'), [1, 2, '1,1', '2,2', '5,6', 7]);  // should be equal, but it's not
  dpeq(pyml('[1, 2, 1,1 , 2,2, 5,6,7]'), [1, 2, 1, 1, 2, 2, 5, 6, 7]);  // wrong, number are split at comma

  // when numbers are quoted, they are correctly not split
  dpeq(pyml("[1, 2, '1,1' , '2,2']"), [1, 2, '1,1', '2,2']);

  const parsed2 = pyml('[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start: \'2024-06-01\', NP: 2, npy: 2}]');
  dpeq(parsed2[0], ['2023-01-05', 155343.53]);
  dpeq(parsed2[2].NP, 2);

  const parsed3 = pyml('[a,b,c]');
  dpeq(parsed3, ['a', 'b', 'c']);

  const parsed3b = pyml('[amm  CIO giò kjkk  , b9988,b9989, 999 ,dlkjdlkjdlsdkjjdkl, d l k j d l k j d l sdkjjdkl ,lkjlkjlkljlkj]');
  dpeq(parsed3b, ['amm  CIO giò kjkk', 'b9988', 'b9989', 999, 'dlkjdlkjdlsdkjjdkl', 'd l k j d l k j d l sdkjjdkl', 'lkjlkjlkljlkj']);

  const parsed4 = pyml('[\'ciao\', "mamma"]');
  dpeq(parsed4, ['ciao', 'mamma']);
  //#endregion

  //#region parsing array of objects
  const parsed5 = pyml('[{ type: c/c, value: ISP, weight: 0.2}, {type: linea di business, value: cantina, weight: 0.3 }]');
  dpeq(parsed5[0].type, 'c/c');
  dpeq(parsed5[1].value, 'cantina');
  dpeq(parsed5[1].weight, 0.3);
  //#endregion
});
