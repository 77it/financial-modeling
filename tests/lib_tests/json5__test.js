// for a more flexible parsing standard, see YAML tests "tests/lib_tests/yaml__test.js"

import { assert as assertDeno, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';
import { parseJSON5 } from '../../src/lib/json5.js';

Deno.test('JSON5 tests', (t) => {
  // parse will go in error (invalid string), then returns undefined
  assertEquals(parseJSON5('[ciao, mamma]'), undefined);

  //#region parsing null and undefined
  // parsing undefined returns undefined
  assertEquals(parseJSON5(undefined), undefined);

  // parsing null returns null
  assertEquals(parseJSON5(null), undefined);
  //#endregion parsing null and undefined

  //#region parsing strings with and without quotes
  // parsing a with quotes returns the string
  assertEquals(parseJSON5('"ciao"'), 'ciao');

  // parsing a without quotes returns undefined
  assertEquals(parseJSON5('ciao'), undefined);
  //#endregion parsing null and undefined

  //#region parsing numbers returns the number
  assertEquals(parseJSON5(999), 999);
  //#endregion parsing numbers returns undefined

  //#region parsing object
  const txt = '{\'Main\':999.159, Name:\'Y88 x\'}';
  let parsed = parseJSON5(txt);
  assertEquals(parsed.Main, 999.159);
  assertEquals(parsed.Name, 'Y88 x');
  //#endregion parsing object

  //#region parsing array of something
  const txt2 = '[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start:\'2024-06-01\', NP:2, npy:2}]';
  let parsed2 = parseJSON5(txt2);
  assertEquals(parsed2[0], ['2023-01-05', 155343.53]);
  assertEquals(parsed2[2].NP, 2);

  const txt4 = '[\'ciao\', "mamma"]';
  let parsed4 = parseJSON5(txt4);
  assertEquals(parsed4, ['ciao', 'mamma']);
  //#endregion parsing array of something
});
