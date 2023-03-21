import * as JSON5 from '../../src/lib/json5.js';

import { assert as assertDeno, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';

Deno.test('JSON5 tests', (t) => {
  // parse will go in error (invalid string), then returns undefined
  assertEquals(JSON5.parse('[ciao, mamma]'), undefined);

  // parsing undefined returns undefined
  //@ts-ignore
  assertEquals(JSON5.parse(undefined), undefined);

  // parsing null returns null
  //@ts-ignore
  assertEquals(JSON5.parse(null), null);

  const txt = '{\'m\':999.159, n: \'y88 x\'}';
  let parsed = JSON5.parse(txt);
  assertEquals(parsed.m, 999.159);
  assertEquals(parsed.n, 'y88 x');
  // toUpperCase
  parsed = JSON5.parse(txt.toUpperCase());
  assertEquals(parsed.M, 999.159);
  assertEquals(parsed.N, 'Y88 X');

  const txt2 = '[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start:\'2024-06-01\', np:2, npy:2}]';
  let parsed2 = JSON5.parse(txt2);
  assertEquals(parsed2[0], ['2023-01-05', 155343.53]);
  assertEquals(parsed2[2].np, 2);
  // toUpperCase
  parsed2 = JSON5.parse(txt2.toUpperCase());
  assertEquals(parsed2[0], ['2023-01-05', 155343.53]);
  assertEquals(parsed2[2].NP, 2);

  const txt4 = '[\'ciao\', "mamma"]';
  let parsed4 = JSON5.parse(txt4);
  assertEquals(parsed4, ['ciao', 'mamma']);
});
