import { binarySearch_position_atOrBefore } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('obj utils binarySearch_position_atOrBefore() test', () => {
  // should return -1 for an empty array
  {
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: [], target: 5 }),
      -1);
  }

  // should return 0 for a single-element array when target matches
  {
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: [5], target: 5 }),
      0);
  }

  // should return -1 for a single-element array when target does not match
  {
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: [10], target: 5 }),
      -1);
  }

  // should return the correct index for a target found in a sorted array
  {
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: [1, 3, 5, 7], target: 5 }),
      2);
  }

  // should return the position at or before the target when target is not found
  {
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: [1, 3, 5, 7], target: 6 }),
      2);
  }

  // should return the position at or before the target when target is not found but is bigger than all
  {
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: [1, 3, 5, 7], target: 10 }),
      3);
  }

  // should return -1 when target is smaller than all elements
  {
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: [10, 20, 30], target: 5 }),
      -1);
  }

  // should handle date arrays correctly
  {
    const dates = [new Date('2023-01-01'), new Date('2023-02-01'), new Date('2023-03-01')];
    const target = new Date('2023-02-15').getTime();
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array: dates, target, dateArray: true }),
      1);
  }

  // should handle objects with a key correctly
  {
    const array = [
      { key: 1 },
      { key: 3 },
      { key: 5 },
      { key: 7 }
    ];
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array, target: 4, keyName: 'key' }),
      1);
  }

  // should return -1 when keyName is invalid
  {
    const array = [
      { key: 1 },
      { key: 3 },
      { key: 5 },
      { key: 7 }
    ];
    assert.deepStrictEqual(
      binarySearch_position_atOrBefore({ array, target: 4, keyName: 'invalidKey' }),
      -1);
  }
});
