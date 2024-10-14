// BEWARE: YAML object definition works only if key is separated form value by at least one space (key: value); doesn't work without space (key:value), as JSON5 does.
// see https://yaml.org/spec/1.2.2/#21-collections

import { localDateToUTC } from '../deps.js';
import { parseYAML } from '../../src/lib/yaml.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('YAML tests', () => {
  //#region parsing null and undefined
  // parsing undefined returns undefined
  assert.deepStrictEqual(parseYAML(undefined), undefined);
  // string 'undefined' is not converted to undefined but remains a string
  assert.deepStrictEqual(parseYAML('undefined'), 'undefined');

  // parsing null returns undefined
  assert.deepStrictEqual(parseYAML(null), undefined);
  // string 'null' is converted to null, and is no more a string
  assert.deepStrictEqual(parseYAML('null'), null);
  //#endregion

  // parsing a number with decimal separated by comma, returns a string.
  // is not a problem if later the string is converted to a number in some way
  assert.deepStrictEqual(parseYAML('999,159'), '999,159');
  assert.deepStrictEqual(parseYAML('999, 159'), '999, 159');

  // parsing an object without {} goes in error then is returned undefined
  assert.deepStrictEqual(parseYAML('Main: 89, Ciao: 99'), undefined);

  // parsing an object without key/value splitting as `{abc}` returns an object with a key with undefined value
  assert.deepStrictEqual(parseYAML('{abc}'), { abc: null });
  assert.deepStrictEqual(parseYAML('{ abc }'), { abc: null });

  // parsing an object with key/value splitting without spaces is parsed correctly
  assert.deepStrictEqual(parseYAML('{abc:value}'), { abc: 'value' });
  assert.deepStrictEqual(parseYAML('{abc:999}'), { abc: 999 });

  // parsing object with key not separated from value, works only if the key is enclosed in "";
  // otherwise, returns `null` (converted to `undefined` in our library) as value
  let parsed_keys_not_separated_from_values = parseYAML('{"Main":999.159, \'Main2\':"abcd", Name:"Y88:x", mamma:\'ciao\', mamma3 :99, mamma2:ciao2, mamma-ciao, :ciaociao}');
  assert.deepStrictEqual(
    parsed_keys_not_separated_from_values,
    {
      Main: 999.159,
      Main2: 'abcd',
      Name: 'Y88:x',
      mamma: 'ciao',
      mamma3 :99,
      mamma2: 'ciao2',
      'mamma-ciao': null,
      ':ciaociao': null
    });

  //#region parsing strings with and without quotes, returns the string
  assert.deepStrictEqual(parseYAML('"ciao"'), 'ciao');
  assert.deepStrictEqual(parseYAML("'ciao'"), 'ciao');
  assert.deepStrictEqual(parseYAML('ciao'), 'ciao');
  //#endregion

  //#region parsing numbers returns the number
  assert.deepStrictEqual(parseYAML(999), 999);
  assert.deepStrictEqual(parseYAML(-1), -1);
  //#endregion

  //#region parsing dates (only to UTC date or string)
  assert.deepStrictEqual(parseYAML('2023-01-05T00:00:00.000Z'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  assert.deepStrictEqual(parseYAML('2023-01-05'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  assert.deepStrictEqual(parseYAML('2023-01'), '2023-01');  // YYYY-MM is converted to string
  assert.deepStrictEqual(parseYAML('2023'), 2023);  // YYYY is converted to number
  //#endregion

  //#region parsing range of dates
  assert.deepStrictEqual(parseYAML('2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z'), '2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z');  // left as string
  assert.deepStrictEqual(parseYAML('2023-01-05:2024-01-05'), '2023-01-05:2024-01-05');  // left as string
  assert.deepStrictEqual(parseYAML('2023-01:2024-01'), '2023-01:2024-01');  // left as string
  assert.deepStrictEqual(parseYAML('2023:2024'), '2023:2024');  // left as string
  //#endregion

  //#region parsing object (works with ' and ")
  const txt = '{\'Main\':999.159, Name: \'Y88 x\', num: -1, \'mamma\':\'ciao\', mamma2 : 99, mamma3 :88}';
  let parsed = parseYAML(txt);
  assert.deepStrictEqual(parsed.Main, 999.159);
  assert.deepStrictEqual(parsed.Name, 'Y88 x');
  assert.deepStrictEqual(parsed.num, -1);
  assert.deepStrictEqual(parsed.mamma, 'ciao');
  assert.deepStrictEqual(parsed.mamma2, 99);
  assert.deepStrictEqual(parsed.mamma3, 88);
  assert(!(parsed["mamma3 "] === 88));  // without sanitization, the key would be with space!

  const txtB = '{"Main":999.159, Name: "Y88 x", num: -1, "mamma":"ciao"}';
  let parsedB = parseYAML(txtB);
  assert.deepStrictEqual(parsedB.Main, 999.159);
  assert.deepStrictEqual(parsedB.Name, 'Y88 x');
  assert.deepStrictEqual(parsed.num, -1);
  assert.deepStrictEqual(parsedB.mamma, 'ciao');
  //#endregion

  //#region parsing array of something, strings also without quotes
  // parsing one or more numbers with decimal separated by comma in an array breaks them, splitting at every comma
  // (array with comma separated numbers in an array are not recognized as numbers nor string, but split at every ,)
  const txt1a = '[1,1]';
  let parsed1a = parseYAML(txt1a);
  assert.notDeepStrictEqual(parsed1a, ['1,1']);  // should be in that way, but it's not
  assert.deepStrictEqual(parsed1a, [1, 1]);  // wrong, number is split at comma
  const txt1b = '[1, 2, 1,1 , 2,2]';
  let parsed1b = parseYAML(txt1b);
  assert.notDeepStrictEqual(parsed1b, [1, 2, '1,1', '2,2']);  // should be in that way, but it's not
  assert.deepStrictEqual(parsed1b, [1, 2, 1, 1, 2, 2]);  // wrong, number are split at comma

  // when numbers are quoted, they are correctly not split
  const txt1c = "[1, 2, '1,1' , '2,2']";
  let parsed1c = parseYAML(txt1c);
  assert.deepStrictEqual(parsed1c, [1, 2, '1,1', '2,2']);

  const txt2 = '[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start: \'2024-06-01\', NP: 2, npy: 2}]';
  let parsed2 = parseYAML(txt2);
  assert.deepStrictEqual(parsed2[0], ['2023-01-05', 155343.53]);
  assert.deepStrictEqual(parsed2[2].NP, 2);

  const txt3 = '[a,b,c]';
  let parsed3 = parseYAML(txt3);
  assert.deepStrictEqual(parsed3, ['a', 'b', 'c']);

  const txt3b = '[amm  CIO giò kjkk  , b9988,b9989, 999 ,dlkjdlkjdlsdkjjdkl, d l k j d l k j d l sdkjjdkl ,lkjlkjlkljlkj]';
  let parsed3b = parseYAML(txt3b);
  assert.deepStrictEqual(parsed3b, ['amm  CIO giò kjkk', 'b9988', 'b9989', 999, 'dlkjdlkjdlsdkjjdkl', 'd l k j d l k j d l sdkjjdkl', 'lkjlkjlkljlkj']);

  const txt4 = '[\'ciao\', "mamma"]';
  let parsed4 = parseYAML(txt4);
  assert.deepStrictEqual(parsed4, ['ciao', 'mamma']);
  //#endregion

  //#region parsing array of objects
  const txt5 = '[{ type: c/c, value: ISP, weight: 0.2}, {type: linea di business, value: cantina, weight: 0.3 }]';
  let parsed5 = parseYAML(txt5);
  assert.deepStrictEqual(parsed5[0].type, 'c/c');
  assert.deepStrictEqual(parsed5[1].value, 'cantina');
  assert.deepStrictEqual(parsed5[1].weight, 0.3);
  //#endregion
});
