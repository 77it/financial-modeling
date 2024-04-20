// BEWARE: YAML object definition works only if key is separated form value by at least one space (key: value); doesn't work without space (key:value), as JSON5 does.
// see https://yaml.org/spec/1.2.2/#21-collections

import { localDateToUTC, assert, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';
import { parseYAML } from '../../src/lib/yaml.js';

Deno.test('YAML tests', (t) => {
  //#region parsing null and undefined
  // parsing undefined returns undefined
  assertEquals(parseYAML(undefined), undefined);
  // string 'undefined' is not converted to undefined but remains a string
  assertEquals(parseYAML('undefined'), 'undefined');

  // parsing null returns undefined
  assertEquals(parseYAML(null), undefined);
  // string 'null' is converted to null, and is no more a string
  assertEquals(parseYAML('null'), null);
  //#endregion

  //#region parsing object with key not separated from value, works only if the key is enclosed in "";
  // otherwise, returns `null` (converted to `undefined` in our library) as value
  let parsed_keys_not_separated_from_values = parseYAML('{"Main":999.159, "Main2":"abcd", Name:"Y88 x", mamma:ciao}');
  // test key definition
  assert("Main" in parsed_keys_not_separated_from_values);
  assert("Main2" in parsed_keys_not_separated_from_values);
  assertFalse("Name" in parsed_keys_not_separated_from_values);  // not defined
  assert("Name:\"Y88 x\"" in parsed_keys_not_separated_from_values);  // defined, key made of key+value
  assertFalse("mamma" in parsed_keys_not_separated_from_values);  // not defined
  assert("mamma:ciao" in parsed_keys_not_separated_from_values);  // defined, key made of key+value
  // test key values
  assertEquals(parsed_keys_not_separated_from_values.Main, 999.159);
  assertEquals(parsed_keys_not_separated_from_values.Main2, "abcd");
  assertEquals(parsed_keys_not_separated_from_values['Name'], undefined);  // undefined key
  assertEquals(parsed_keys_not_separated_from_values['Name:"Y88 x"'], null);  // key defined, null value
  assertEquals(parsed_keys_not_separated_from_values['mamma'], undefined);  // undefined key
  assertEquals(parsed_keys_not_separated_from_values['mamma:ciao'], null);  // key defined, null value
  //#endregion

  //#region parsing strings with and without quotes, returns the string
  assertEquals(parseYAML('"ciao"'), 'ciao');
  assertEquals(parseYAML('ciao'), 'ciao');
  //#endregion

  //#region parsing numbers returns the number
  assertEquals(parseYAML(999), 999);
  assertEquals(parseYAML(-1), -1);
  //#endregion

  //#region parsing dates (only to UTC date or string)
  assertEquals(parseYAML('2023-01-05T00:00:00.000Z'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  assertEquals(parseYAML('2023-01-05'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  assertEquals(parseYAML('2023-01'), '2023-01');  // YYYY-MM is converted to string
  assertEquals(parseYAML('2023'), 2023);  // YYYY is converted to number
  //#endregion

  //#region parsing range of dates
  assertEquals(parseYAML('2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z'), '2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z');  // left as string
  assertEquals(parseYAML('2023-01-05:2024-01-05'), '2023-01-05:2024-01-05');  // left as string
  assertEquals(parseYAML('2023-01:2024-01'), '2023-01:2024-01');  // left as string
  assertEquals(parseYAML('2023:2024'), '2023:2024');  // left as string
  //#endregion

  //#region parsing object (works with ' and ")
  const txt = '{\'Main\':999.159, Name: \'Y88 x\', num: -1, mamma : ciao}';
  let parsed = parseYAML(txt);
  assertEquals(parsed.Main, 999.159);
  assertEquals(parsed.Name, 'Y88 x');
  assertEquals(parsed.num, -1);
  assertEquals(parsed.mamma, 'ciao');

  const txtB = '{"Main":999.159, Name: "Y88 x", num: -1, mamma : ciao}';
  let parsedB = parseYAML(txtB);
  assertEquals(parsedB.Main, 999.159);
  assertEquals(parsedB.Name, 'Y88 x');
  assertEquals(parsed.num, -1);
  assertEquals(parsedB.mamma, 'ciao');
  //#endregion

  //#region parsing array of something, strings also without quotes
  const txt2 = '[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start: \'2024-06-01\', NP: 2, npy: 2}]';
  let parsed2 = parseYAML(txt2);
  assertEquals(parsed2[0], ['2023-01-05', 155343.53]);
  assertEquals(parsed2[2].NP, 2);

  const txt3 = '[a,b,c]';
  let parsed3 = parseYAML(txt3);
  assertEquals(parsed3, ['a', 'b', 'c']);

  const txt3b = '[amm  CIO giò kjkk  , b9988,b9989, 999 ,dlkjdlkjdlsdkjjdkl, d l k j d l k j d l sdkjjdkl ,lkjlkjlkljlkj]';
  let parsed3b = parseYAML(txt3b);
  assertEquals(parsed3b, ['amm  CIO giò kjkk', 'b9988', 'b9989', 999, 'dlkjdlkjdlsdkjjdkl', 'd l k j d l k j d l sdkjjdkl', 'lkjlkjlkljlkj']);

  const txt4 = '[\'ciao\', "mamma"]';
  let parsed4 = parseYAML(txt4);
  assertEquals(parsed4, ['ciao', 'mamma']);
  //#endregion

  //#region parsing array of objects
  const txt5 = '[{ type: c/c, value: ISP, weight: 0.2}, {type: linea di business, value: cantina, weight: 0.3 }]';
  let parsed5 = parseYAML(txt5);
  assertEquals(parsed5[0].type, 'c/c');
  assertEquals(parsed5[1].value, 'cantina');
  assertEquals(parsed5[1].weight, 0.3);
  //#endregion
});
