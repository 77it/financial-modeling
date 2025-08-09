import { roundHalfAwayFromZero, roundHalfAwayFromZeroWithPrecision, truncWithPrecision } from '../../src/lib/number_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('test roundHalfAwayFromZero()', () => {
  const testCases = [
    { input: 1.4, expected: 1 },
    { input: -1.4, expected: -1 },
    { input: 1.5, expected: 2 },
    { input: -1.5, expected: -2 },
    { input: 2.4, expected: 2 },
    { input: -2.4, expected: -2 },
    { input: 2.5, expected: 3 },
    { input: -2.5, expected: -3 },
    { input: 0.25, expected: 0 },
    { input: -0.25, expected: 0 },
    { input: 1.25, expected: 1 },
    { input: -1.25, expected: -1 }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = roundHalfAwayFromZero(input);
    assert(result === expected, `Expected roundHalfAwayFromZero(${input}) to be ${expected}, but got ${result}`);
  });
});

t('test Math.round()', () => {
  const testCases = [
    { input: 10.075, expected: 10 },
    { input: -10.075, expected: -10 },
    { input: 1.4, expected: 1 },
    { input: -1.4, expected: -1 },
    { input: 1.5, expected: 2 },
    { input: -1.5, expected: -1 },  // different behavior from roundHalfAwayFromZero
    { input: 2.4, expected: 2 },
    { input: -2.4, expected: -2 },
    { input: 2.5, expected: 3 },
    { input: -2.5, expected: -2 },  // different behavior from roundHalfAwayFromZero
    { input: 0.25, expected: 0 },
    { input: -0.25, expected: 0 },
    { input: 1.25, expected: 1 },
    { input: -1.25, expected: -1 }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = Math.round(input);
    assert(result === expected, `Expected Math(${input}) to be ${expected}, but got ${result}`);
  });
});

t('test roundHalfAwayFromZeroWithPrecision()', () => {
  const testCases = [
    { input: [10.075, 4], expected: 10.075 },
    { input: [-10.075, 4], expected: -10.075 },
    { input: [1.005, 2], expected: 1.01 },
    { input: [-1.005, 2], expected: -1.01 },
    { input: [1.4444, 2], expected: 1.44 },
    { input: [-1.4444, 2], expected: -1.44 },
    { input: [1.5555, 2], expected: 1.56 },
    { input: [-1.5555, 2], expected: -1.56 },
    { input: [2.4444, 2], expected: 2.44 },
    { input: [-2.4444, 2], expected: -2.44 },
    { input: [2.5555, 2], expected: 2.56 },
    { input: [-2.5555, 2], expected: -2.56 },
    { input: [0.2555, 3], expected: 0.256 },
    { input: [-0.2555, 3], expected: -0.256 },
    { input: [1.2555, 3], expected: 1.256 },
    { input: [-1.2555, 3], expected: -1.256 }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = roundHalfAwayFromZeroWithPrecision(input[0], input[1]);
    assert(result === expected, `Expected roundHalfAwayFromZeroWithPrecision(${input}) to be ${expected}, but got ${result}`);
  });
});

t('test truncWithPrecision()', () => {
  const testCases = [
    { input: [10.075, 4], expected: 10.075 },
    { input: [-10.075, 4], expected: -10.075 },
    { input: [10.075, 3], expected: 10.075 },
    { input: [-10.075, 3], expected: -10.075 },
    { input: [10.075, 2], expected: 10.07 },
    { input: [-10.075, 2], expected: -10.07 },
    { input: [10.075, 1], expected: 10 },
    { input: [-10.075, 1], expected: -10 },
    { input: [1.005, 2], expected: 1.00 },
    { input: [-1.005, 2], expected: -1.00 },
    { input: [1.4444, 2], expected: 1.44 },
    { input: [-1.4444, 2], expected: -1.44 },
    { input: [1.5555, 2], expected: 1.55 },
    { input: [-1.5555, 2], expected: -1.55 },
    { input: [2.4444, 2], expected: 2.44 },
    { input: [-2.4444, 2], expected: -2.44 },
    { input: [2.5555, 2], expected: 2.55 },
    { input: [-2.5555, 2], expected: -2.55 },
    { input: [0.2555, 3], expected: 0.255 },
    { input: [-0.2555, 3], expected: -0.255 },
    { input: [1.2555, 3], expected: 1.255 },
    { input: [-1.2555, 3], expected: -1.255 }
  ];

  testCases.forEach(({ input, expected }) => {
    const result = truncWithPrecision(input[0], input[1]);
    assert(result === expected, `Expected truncWithPrecision(${input}) to be ${expected}, but got ${result}`);
  });
});