import * as S from './sanitization_utils.js';

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';


Deno.test('test sanitize()', async (t) => {
  await t.step("any type", async () => {
    const t = S.ANY_TYPE;
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t}));
    assertEquals(null, S.sanitize({value: null, sanitization: t}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t}));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("string type", async () => {
    const t = S.STRING_TYPE;
    assertEquals('', S.sanitize({value: undefined, sanitization: t}));
    assertEquals('', S.sanitize({value: null, sanitization: t}));
    assertEquals('999', S.sanitize({value: 999, sanitization: t}));
    assertEquals('', S.sanitize({value: '', sanitization: t}));
    assertEquals('abc', S.sanitize({value: 'abc', sanitization: t}));
    assertEquals('2022-12-24T23:00:00.000Z', S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals('', S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals('999', S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("number type", async () => {
    const t = S.NUMBER_TYPE;
    assertEquals(0, S.sanitize({value: undefined, sanitization: t}));
    assertEquals(0, S.sanitize({value: null, sanitization: t}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t}));
    assertEquals(0, S.sanitize({value: '', sanitization: t}));
    assertEquals(0, S.sanitize({value: 'abc', sanitization: t}));
    assertEquals(1671922800000, S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals(0, S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t2}));
  });

  // export const BOOLEAN_TYPE = 'boolean';
  // export const DATE_TYPE = 'date';
  // export const ARRAY_TYPE = 'array';
  // export const ARRAY_OF_STRINGS_TYPE = 'array[string]';
  // export const ARRAY_OF_NUMBERS_TYPE = 'array[number]';
  // export const ARRAY_OF_BOOLEANS_TYPE = 'array[boolean]';
  // export const ARRAY_OF_DATES_TYPE = 'array[date]';
  // export const OBJECT_TYPE = 'object';
  // export const FUNCTION_TYPE = 'function';
  // export const SYMBOL_TYPE = 'symbol';

});
