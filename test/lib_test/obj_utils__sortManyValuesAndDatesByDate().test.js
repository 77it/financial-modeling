import { sortManyValuesAndDatesByDate } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('obj utils sortManyValuesAndDatesByDate() test - array-sort on content of another array, ascending and descending', () => {
  const arrays = [
    [10, 20, 30, 40],
    [1, 2, 3, 4]
  ];
  const dates = [new Date('2024-01-05'), new Date('2023-11-18'), new Date('2024-03-10'), new Date('2023-08-22')];

  const original_numbers = structuredClone(arrays);
  const original_dates = structuredClone(dates);

  const exp_numbers = [
    [40, 20, 10, 30],
    [4, 2, 1, 3]
  ];
  const exp_dates = [new Date('2023-08-22'), new Date('2023-11-18'), new Date('2024-01-05'), new Date('2024-03-10')];

  // test ascending
  {
    const { sortedArrays, sortedDates } = sortManyValuesAndDatesByDate({ arrays, dates });
    assert.deepStrictEqual(sortedArrays, exp_numbers);
    assert.deepStrictEqual(sortedDates, exp_dates);
    // test that original arrays are not changed
    assert.deepStrictEqual(arrays, original_numbers);
    assert.deepStrictEqual(dates, original_dates);
  }

  // test descending
  {
    const { sortedArrays, sortedDates } = sortManyValuesAndDatesByDate({ arrays, dates, ascending: false });
    assert.deepStrictEqual(sortedArrays, exp_numbers.map(inner => inner.reverse()));
    assert.deepStrictEqual(sortedDates, exp_dates.toReversed());
    // test that original arrays are not changed
    assert.deepStrictEqual(arrays, original_numbers);
    assert.deepStrictEqual(dates, original_dates);
  }
});

t('obj utils sortManyValuesAndDatesByDate() test - test with BigInt instead of numbers', () => {
  const arrays = [
    [10n, 20n, 30n, 40n],
    [1n, 2n, 3n, 4n]
  ];
  const dates = [new Date('2024-01-05'), new Date('2023-11-18'), new Date('2024-03-10'), new Date('2023-08-22')];

  const original_numbers = structuredClone(arrays);
  const original_dates = structuredClone(dates);

  const exp_numbers = [
    [40n, 20n, 10n, 30n],
    [4n, 2n, 1n, 3n]
  ];
  const exp_dates = [new Date('2023-08-22'), new Date('2023-11-18'), new Date('2024-01-05'), new Date('2024-03-10')];

  // test ascending
  {
    const { sortedArrays, sortedDates } = sortManyValuesAndDatesByDate({ arrays, dates });
    assert.deepStrictEqual(sortedArrays, exp_numbers);
    assert.deepStrictEqual(sortedDates, exp_dates);
    // test that original arrays are not changed
    assert.deepStrictEqual(arrays, original_numbers);
    assert.deepStrictEqual(dates, original_dates);
  }

  // test descending
  {
    const { sortedArrays, sortedDates } = sortManyValuesAndDatesByDate({ arrays, dates, ascending: false });
    assert.deepStrictEqual(sortedArrays, exp_numbers.map(inner => inner.reverse()));
    assert.deepStrictEqual(sortedDates, exp_dates.toReversed());
    // test that original arrays are not changed
    assert.deepStrictEqual(arrays, original_numbers);
    assert.deepStrictEqual(dates, original_dates);
  }
});

t('obj utils sortManyValuesAndDatesByDate() test - - test throw if array are of different length', () => {
  const arrays = [
    [10, 20, 30],
    [10, 20, 30, 40]
  ];
  const dates = [new Date('2024-01-05'), new Date('2023-11-18'), new Date('2024-03-10'), new Date('2023-08-22')];

  assert.throws(() => sortManyValuesAndDatesByDate({ arrays, dates }));
});
