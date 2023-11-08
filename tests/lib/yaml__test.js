// BEWARE: YAML object definition works only if key is separated form value by at least one space (key: value); doesn't work without space (key:value), as JSON5 does.
// see https://yaml.org/spec/1.2.2/#21-collections

import { assert as assertDeno, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';
import { parseYAML } from '../../src/lib/yaml.js';

Deno.test('YAML tests', (t) => {
  //#region parsing null and undefined
  // parsing undefined returns undefined
  assertEquals(parseYAML(undefined), undefined);

  // parsing null returns null
  assertEquals(parseYAML(null), undefined);
  //#endregion

  //#region parsing object with key not separated from value, returns `null` (converted to `undefined` in our library) as value
  let parsed_undefined_value = parseYAML('{"Main":999.159, Name:"Y88 x", mamma:ciao}');
  assertEquals(parsed_undefined_value.Main, 999.159);
  assertEquals(parsed_undefined_value['Name:"Y88 x"'], null);
  assertEquals(parsed_undefined_value['mamma:ciao'], null);
  //#endregion

  //#region parsing strings with and without quotes
  // parsing a with quotes returns the string
  assertEquals(parseYAML('"ciao"'), 'ciao');

  // parsing a without quotes returns undefined
  assertEquals(parseYAML('ciao'), 'ciao');
  //#endregion

  //#region parsing numbers returns the number
  assertEquals(parseYAML(999), 999);
  //#endregion

  //#region parsing object (works with ' and ")
  const txt = '{\'Main\':999.159, Name: \'Y88 x\', mamma : ciao}';
  let parsed = parseYAML(txt);
  assertEquals(parsed.Main, 999.159);
  assertEquals(parsed.Name, 'Y88 x');
  assertEquals(parsed.mamma, 'ciao');

  const txtB = '{"Main":999.159, Name: "Y88 x", mamma : ciao}';
  let parsedB = parseYAML(txt);
  assertEquals(parsedB.Main, 999.159);
  assertEquals(parsedB.Name, 'Y88 x');
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
