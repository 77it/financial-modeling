import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';
import { ensureArrayValuesAreUnique } from '../../src/lib/obj_utils.js';

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

