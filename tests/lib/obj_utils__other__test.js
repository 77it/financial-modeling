import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';
import { ensureArrayValuesAreUnique, objectKeysToLowerCase } from '../../src/lib/obj_utils.js';
import { parseJSON5 } from '../../src/lib/json5.js';

Deno.test('test ensureArrayValuesAreUnique()', (t) => {
  // random array with unique values
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ensureArrayValuesAreUnique(array);

  // test that the array is returned, unchanged
  assertEquals(ensureArrayValuesAreUnique(array), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

Deno.test('test ensureArrayValuesAreUnique() failing', (t) => {
  // random array with duplicate values
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9];

  // goes in error
  assertThrows(() => {
    ensureArrayValuesAreUnique(array);
  });
});

Deno.test('objectKeysToLowerCase tests', (t) => {
  const txt = '{\'Main\':999.159, Name: \'Y88 x\'}';
  let parsed = objectKeysToLowerCase(parseJSON5(txt));
  assertEquals(parsed.main, 999.159);
  assertEquals(parsed.name, 'Y88 x');

  const txt2 = '[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start:\'2024-06-01\', NP:2, npy:2}]';
  let parsed2 = objectKeysToLowerCase(parseJSON5(txt2));
  assertEquals(parsed2[0], ['2023-01-05', 155343.53]);
  assertEquals(parsed2[2].np, 2);
});
