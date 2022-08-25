// @ts-nocheck

// tests to be run without type checking

import {
  assert,
  assertFalse,
  assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';

import { isInvalidDate, isPositive, validate } from './validation_utils.js';

Deno.test('test positive number', () => {
  assert(isPositive(1));
  assertFalse(isPositive(-1));
  assertFalse(isPositive('mamma'));
});
