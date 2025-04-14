import { sortValuesAndDatesByDate } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('obj utils sortNumbersAndDatesByDate() test - array-sort on content of another array, ascending and descending', () => {
  const numbers = [10, 20, 30, 40];
  const dates= [ new Date('2024-01-05'), new Date('2023-11-18'), new Date('2024-03-10'), new Date('2023-08-22')];

  const exp_numbers = [40, 20, 10, 30];
  const exp_dates= [ new Date('2023-08-22'), new Date('2023-11-18'), new Date('2024-01-05'), new Date('2024-03-10') ]

  // test ascending
  {
    const { sortedValues, sortedDates } = sortValuesAndDatesByDate({values: numbers, dates: dates});
    assert.deepStrictEqual(sortedValues, exp_numbers);
    assert.deepStrictEqual(sortedDates, exp_dates);
  }

  // test descending
  {
    const { sortedValues, sortedDates } = sortValuesAndDatesByDate({values: numbers, dates: dates, ascending:false});
    assert.deepStrictEqual(sortedValues, exp_numbers.toReversed());
    assert.deepStrictEqual(sortedDates, exp_dates.toReversed());
  }
});

t('obj utils sortNumbersAndDatesByDate() test - test with BigInt instead of numbers', () => {
  const numbers = [10n, 20n, 30n, 40n];
  const dates= [ new Date('2024-01-05'), new Date('2023-11-18'), new Date('2024-03-10'), new Date('2023-08-22')];

  const exp_numbers = [40n, 20n, 10n, 30n];
  const exp_dates= [ new Date('2023-08-22'), new Date('2023-11-18'), new Date('2024-01-05'), new Date('2024-03-10') ]

  // test ascending
  {
    const { sortedValues, sortedDates } = sortValuesAndDatesByDate({values: numbers, dates: dates});
    assert.deepStrictEqual(sortedValues, exp_numbers);
    assert.deepStrictEqual(sortedDates, exp_dates);
  }

  // test descending
  {
    const { sortedValues, sortedDates } = sortValuesAndDatesByDate({values: numbers, dates: dates, ascending: false});
    assert.deepStrictEqual(sortedValues, exp_numbers.toReversed());
    assert.deepStrictEqual(sortedDates, exp_dates.toReversed());
  }
});

t('obj utils sortNumbersAndDatesByDate() test - - test throw if array are of different length', () => {
  const numbers = [10, 20, 30];
  const dates= [ new Date('2024-01-05'), new Date('2023-11-18'), new Date('2024-03-10'), new Date('2023-08-22')];

  assert.throws(() => sortValuesAndDatesByDate({values: numbers, dates: dates}));
});
