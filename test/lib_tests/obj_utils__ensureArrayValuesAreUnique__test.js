import { ensureArrayValuesAreUnique } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('test ensureArrayValuesAreUnique()', () => {
  // random array with unique values
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  ensureArrayValuesAreUnique(array);

  // test that the array is returned, unchanged
  assert.deepStrictEqual(ensureArrayValuesAreUnique(array), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

t('test ensureArrayValuesAreUnique() failing', () => {
  // random array with duplicate values
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9];

  // goes in error
  assert.throws(() => {
    ensureArrayValuesAreUnique(array);
  });
});

