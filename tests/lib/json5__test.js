import { assert as assertDeno, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';
import { parseJSON5 } from '../../src/lib/json5.js';

Deno.test('JSON5 tests', (t) => {
  // parse will go in error (invalid string), then returns undefined
  assertEquals(parseJSON5('[ciao, mamma]'), undefined);

  // parsing undefined returns undefined
  //@ts-ignore
  assertEquals(parseJSON5(undefined), undefined);

  // parsing null returns null
  //@ts-ignore
  assertEquals(parseJSON5(null), null);

  const txt = '{\'Main\':999.159, Name: \'Y88 x\'}';
  let parsed = parseJSON5(txt);
  assertEquals(parsed.Main, 999.159);
  assertEquals(parsed.Name, 'Y88 x');

  const txt2 = '[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start:\'2024-06-01\', NP:2, npy:2}]';
  let parsed2 = parseJSON5(txt2);
  assertEquals(parsed2[0], ['2023-01-05', 155343.53]);
  assertEquals(parsed2[2].NP, 2);

  const txt4 = '[\'ciao\', "mamma"]';
  let parsed4 = parseJSON5(txt4);
  assertEquals(parsed4, ['ciao', 'mamma']);
});
