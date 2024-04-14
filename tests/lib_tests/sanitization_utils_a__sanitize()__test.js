import * as S from '../../src/lib/schema.js';
import * as s from '../../src/lib/schema_sanitization_utils.js';

// from https://github.com/MikeMcl/big.js/ & https://www.npmjs.com/package/big.js   // backup in https://github.com/77it/big.js
// @deno-types="https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/big.js/index.d.ts"
import { Big } from 'https://cdn.jsdelivr.net/npm/big.js@6.2.1/big.min.mjs';

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from '../deps.js';

Deno.test('test sanitize()', async (t) => {
  await t.step('test wrong/unknown options', async () => {
    assertThrows(() => s.sanitize({ value: 'aaaX', sanitization: 'wrong sanitization type' }));
  });

  await t.step('any type', async () => {
    const t = S.ANY_TYPE;
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t }));
    assertEquals([999], s.sanitize({ value: [999], sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([999], s.sanitize({ value: [999], sanitization: t2 }));
  });

  await t.step('string type', async () => {
    const t = S.STRING_TYPE;
    assertEquals('', s.sanitize({ value: undefined, sanitization: t }));
    assertEquals('', s.sanitize({ value: null, sanitization: t }));
    assertEquals('0', s.sanitize({ value: 0, sanitization: t }));
    assertEquals('999', s.sanitize({ value: 999, sanitization: t }));
    assertEquals('', s.sanitize({ value: '', sanitization: t }));
    assertEquals('', s.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed if the string is empty
    assertEquals('abc', s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals('  abc  ', s.sanitize({ value: '  abc  ', sanitization: t }));    // whitespaces are not trimmed if the string is not empty
    assertEquals('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals('', s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals('true', s.sanitize({ value: true, sanitization: t }));
    assertEquals('false', s.sanitize({ value: false, sanitization: t }));

    // string sanitization with UTC `dateUTC` option = true
    const opt = { dateUTC: true };
    assertEquals('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(Date.UTC(2022, 11, 25)), sanitization: t, options: opt }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals('999', s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals('', s.sanitize({ value: '    ', sanitization: t2 }));  // whitespaces are trimmed
    assertEquals('true', s.sanitize({ value: true, sanitization: t2 }));
    assertEquals('false', s.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('string lowercase trimmed type', async () => {
    const t = S.STRINGLOWERCASETRIMMED_TYPE;
    assertEquals('', s.sanitize({ value: undefined, sanitization: t }));
    assertEquals('', s.sanitize({ value: null, sanitization: t }));
    assertEquals('0', s.sanitize({ value: 0, sanitization: t }));
    assertEquals('999', s.sanitize({ value: 999, sanitization: t }));
    assertEquals('', s.sanitize({ value: '', sanitization: t }));
    assertEquals('', s.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed if the string is empty
    assertEquals('abc', s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals('abc', s.sanitize({ value: '  abc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
    assertEquals('abc', s.sanitize({ value: 'aBc', sanitization: t }));
    assertEquals('abc', s.sanitize({ value: '  aBc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
    assertEquals('2022-12-25t00:00:00.000z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals('', s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals('true', s.sanitize({ value: true, sanitization: t }));
    assertEquals('false', s.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals('999', s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals('', s.sanitize({ value: '    ', sanitization: t2 }));  // whitespaces are trimmed
    assertEquals('true', s.sanitize({ value: true, sanitization: t2 }));
    assertEquals('false', s.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('string uppercase trimmed type', async () => {
    const t = S.STRINGUPPERCASETRIMMED_TYPE;
    assertEquals('', s.sanitize({ value: undefined, sanitization: t }));
    assertEquals('', s.sanitize({ value: null, sanitization: t }));
    assertEquals('0', s.sanitize({ value: 0, sanitization: t }));
    assertEquals('999', s.sanitize({ value: 999, sanitization: t }));
    assertEquals('', s.sanitize({ value: '', sanitization: t }));
    assertEquals('', s.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed if the string is empty
    assertEquals('ABC', s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals('ABC', s.sanitize({ value: '  abc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
    assertEquals('ABC', s.sanitize({ value: 'aBc', sanitization: t }));
    assertEquals('ABC', s.sanitize({ value: '  aBc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
    assertEquals('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals('', s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals('TRUE', s.sanitize({ value: true, sanitization: t }));
    assertEquals('FALSE', s.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals('999', s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals('', s.sanitize({ value: '    ', sanitization: t2 }));  // whitespaces are trimmed
    assertEquals('TRUE', s.sanitize({ value: true, sanitization: t2 }));
    assertEquals('FALSE', s.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('number type + validation', async () => {
    const t = S.NUMBER_TYPE;
    assertEquals(0, s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(0, s.sanitize({ value: null, sanitization: t }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t }));
    assertEquals(0, s.sanitize({ value: '', sanitization: t }));
    assertEquals(0, s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(1671922800000, s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(0, s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(1, s.sanitize({ value: true, sanitization: t }));
    assertEquals(0, s.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals(1, s.sanitize({ value: true, sanitization: t2 }));
    assertEquals(0, s.sanitize({ value: false, sanitization: t2 }));

    assertEquals(s.sanitize({ value: '999', sanitization: S.NUMBER_TYPE, validate: true }), 999);
    assertEquals(s.sanitize({ value: '999', sanitization: S.NUMBER_TYPE + '?', validate: true }), 999);
    assertEquals(s.sanitize({ value: undefined, sanitization: S.NUMBER_TYPE + '?', validate: true }), undefined);
  });

  await t.step('boolean type', async () => {
    const t = S.BOOLEAN_TYPE;
    assertEquals(false, s.sanitize({ value: 'false', sanitization: t }));  // string 'false' = false
    assertEquals(false, s.sanitize({ value: '', sanitization: t }));  // string '' = false
    assertEquals(false, s.sanitize({ value: '     ', sanitization: t }));  // whitespace = false
    assertEquals(false, s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(false, s.sanitize({ value: null, sanitization: t }));
    assertEquals(false, s.sanitize({ value: -0, sanitization: t }));
    assertEquals(false, s.sanitize({ value: 0, sanitization: t }));
    assertEquals(true, s.sanitize({ value: 1, sanitization: t }));
    assertEquals(true, s.sanitize({ value: -1, sanitization: t }));
    assertEquals(true, s.sanitize({ value: 999, sanitization: t }));
    assertEquals(true, s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(true, s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(true, s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(true, s.sanitize({ value: true, sanitization: t }));
    assertEquals(false, s.sanitize({ value: false, sanitization: t }));
    assertEquals(true, s.sanitize({ value: 'true', sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(true, s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals(true, s.sanitize({ value: true, sanitization: t2 }));
    assertEquals(false, s.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('date type, with OPTIONS.DATE_UTC = true (UTC Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
    const options = { dateUTC: true};

    const t = S.DATE_TYPE;
    assertEquals(new Date(0), s.sanitize({ value: undefined, sanitization: t, options }));
    assertEquals(new Date(0), s.sanitize({ value: null, sanitization: t, options }));
    assertEquals(new Date(Date.UTC(2022, 11, 25)), s.sanitize({ value: 44920, sanitization: t, options }));
    assertEquals(new Date(0), s.sanitize({ value: '', sanitization: t, options }));
    assertEquals(new Date(0), s.sanitize({ value: 'abc', sanitization: t, options }));
    assertEquals(new Date(2022, 11, 25), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t, options }));
    assertEquals(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), s.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t, options }));
    assertEquals(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), s.sanitize({ value: '2022-12-25', sanitization: t, options }));
    assertEquals(new Date(0), s.sanitize({ value: new Date(NaN), sanitization: t, options }));
    assertEquals(new Date(1), s.sanitize({ value: true, sanitization: t, options }));
    assertEquals(new Date(0), s.sanitize({ value: false, sanitization: t, options }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2, options }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2, options }));
    assertEquals(new Date(Date.UTC(2022, 11, 25)), s.sanitize({ value: 44920, sanitization: t2, options }));
    assertEquals(new Date(1), s.sanitize({ value: true, sanitization: t2, options }));
    assertEquals(new Date(0), s.sanitize({ value: false, sanitization: t2, options }));
  });

  await t.step('date type, with default OPTIONS.DATE_UTC = false (local Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
    const t = S.DATE_TYPE;
    assertEquals(new Date(2022, 11, 25), s.sanitize({ value: 44920, sanitization: t }));
    assertEquals(new Date(2022, 11, 25), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), s.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), s.sanitize({ value: '2022-12-25', sanitization: t }));
    assertEquals(new Date(0), s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(new Date(1), s.sanitize({ value: true, sanitization: t }));
    assertEquals(new Date(0), s.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2, }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(new Date(2022, 11, 25), s.sanitize({ value: 44920, sanitization: t2 }));
    assertEquals(new Date(1), s.sanitize({ value: true, sanitization: t2 }));
    assertEquals(new Date(0), s.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('date type with option number To Date OPTION__NUMBER_TO_DATE__JS_SERIAL_DATE', async () => {
    const options = { numberToDate: S.NUMBER_TO_DATE_OPTS__JS_SERIAL_DATE};

    const t = S.DATE_TYPE;
    assertEquals(new Date(44920), s.sanitize({ value: 44920, sanitization: t, options }));

    const t2 = t + '?';
    assertEquals(new Date(44920), s.sanitize({ value: 44920, sanitization: t2, options }));
  });

  await t.step('date type with option number To Date OPTION__NUMBER_TO_DATE__NO_CONVERSION', async () => {
    const options = { numberToDate: S.NUMBER_TO_DATE_OPTS__NO_CONVERSION, defaultDate: undefined};

    const t = S.DATE_TYPE;
    assertEquals(undefined, s.sanitize({ value: 44920, sanitization: t, options }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: 44920, sanitization: t2, options }));
  });

  await t.step('array (enum) type + validation', async () => {
    assertEquals(999, s.sanitize({ value: 999, sanitization: [] }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: [11, 22, 999, 55] }));
    assertEquals('aaa', s.sanitize({ value: 'aaa', sanitization: [11, 'aa', 'aaa', 55] }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: [11, undefined, 'aa', 'aaa', 55], validate: true }));
    assertThrows(() => s.sanitize({ value: 'aaaX', sanitization: [11, 'aa', 'aaa', 55], validate: true }));
  });

  await t.step('array type', async () => {
    const t = S.ARRAY_TYPE;
    assertEquals([1, 2, 'a'], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([undefined], s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([null], s.sanitize({ value: null, sanitization: t }));
    assertEquals([999], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([''], s.sanitize({ value: '', sanitization: t }));
    assertEquals(['abc'], s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([new Date(2022, 11, 25)], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([new Date(NaN)], s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals([{a: 999}], s.sanitize({ value: {a: 999}, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals([999], s.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('array of strings type', async () => {
    const t = S.ARRAY_OF_STRINGS_TYPE;
    assertEquals(['1', '2', 'a'], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([''], s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([''], s.sanitize({ value: null, sanitization: t }));
    assertEquals(['999'], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([''], s.sanitize({ value: '', sanitization: t }));
    assertEquals(['abc'], s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(['2022-12-25T00:00:00.000Z'], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([''], s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals([''], s.sanitize({ value: [[]], sanitization: t }));
    assertEquals([''], s.sanitize({ value: { }, sanitization: t }));
    assertEquals([''], s.sanitize({ value: { a: 999}, sanitization: t }));
    assertEquals([''], s.sanitize({ value: Symbol(), sanitization: t }));

    const t2 = t + '?';
    assertEquals(['', '2', 'a'], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(['999'], s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: '', sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: [[]], sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: { }, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: { a: 999}, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: Symbol(), sanitization: t2 }));
  });

  await t.step('array of strings lowercase trimmed type', async () => {
    const t = S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE;
    assertEquals(['1', '2', 'a'], s.sanitize({ value: [1, 2, '   a   '], sanitization: t }));
    assertEquals([''], s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([''], s.sanitize({ value: null, sanitization: t }));
    assertEquals(['999'], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([''], s.sanitize({ value: '', sanitization: t }));
    assertEquals(['abc'], s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(['2022-12-25t00:00:00.000z'], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([''], s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals([''], s.sanitize({ value: [[]], sanitization: t }));
    assertEquals([''], s.sanitize({ value: { }, sanitization: t }));
    assertEquals([''], s.sanitize({ value: { a: 999}, sanitization: t }));
    assertEquals([''], s.sanitize({ value: Symbol(), sanitization: t }));

    const t2 = t + '?';
    assertEquals(['', '2', 'a'], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(['999'], s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: '', sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: [[]], sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: { }, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: { a: 999}, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: Symbol(), sanitization: t2 }));
  });

  await t.step('array of strings uppercase trimmed type', async () => {
    const t = S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE;
    assertEquals(['1', '2', 'A'], s.sanitize({ value: [1, 2, '   a   '], sanitization: t }));
    assertEquals([''], s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([''], s.sanitize({ value: null, sanitization: t }));
    assertEquals(['999'], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([''], s.sanitize({ value: '', sanitization: t }));
    assertEquals(['ABC'], s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(['2022-12-25T00:00:00.000Z'], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([''], s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals([''], s.sanitize({ value: [[]], sanitization: t }));
    assertEquals([''], s.sanitize({ value: { }, sanitization: t }));
    assertEquals([''], s.sanitize({ value: { a: 999}, sanitization: t }));
    assertEquals([''], s.sanitize({ value: Symbol(), sanitization: t }));

    const t2 = t + '?';
    assertEquals(['', '2', 'A'], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(['999'], s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: '', sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: [[]], sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: { }, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: { a: 999}, sanitization: t2 }));
    assertEquals([''], s.sanitize({ value: Symbol(), sanitization: t2 }));
  });

  await t.step('array of numbers type', async () => {
    const t = S.ARRAY_OF_NUMBERS_TYPE;
    assertEquals([1, 2, 0], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([0], s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([0], s.sanitize({ value: null, sanitization: t }));
    assertEquals([999], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([0], s.sanitize({ value: '', sanitization: t }));
    assertEquals([0], s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([1671922800000], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([0], s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals([0], s.sanitize({ value: [[]], sanitization: t }));
    assertEquals([0], s.sanitize({ value: { }, sanitization: t }));
    assertEquals([0], s.sanitize({ value: { a: 999}, sanitization: t }));
    assertEquals([0], s.sanitize({ value: Symbol(), sanitization: t }));

    const t2 = t + '?';
    assertEquals([0, 2, 0], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals([999], s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([0], s.sanitize({ value: [[]], sanitization: t2 }));
    assertEquals([0], s.sanitize({ value: { }, sanitization: t2 }));
    assertEquals([0], s.sanitize({ value: { a: 999}, sanitization: t2 }));
    assertEquals([0], s.sanitize({ value: Symbol(), sanitization: t2 }));
  });

  await t.step('array of booleans type', async () => {
    const t = S.ARRAY_OF_BOOLEANS_TYPE;
    assertEquals([true, true, true], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([false], s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([false], s.sanitize({ value: null, sanitization: t }));
    assertEquals([true], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([false], s.sanitize({ value: '', sanitization: t }));
    assertEquals([true], s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([true], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([true], s.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals([true], s.sanitize({ value: [[]], sanitization: t }));
    assertEquals([true], s.sanitize({ value: { }, sanitization: t }));
    assertEquals([true], s.sanitize({ value: { a: 999}, sanitization: t }));
    assertEquals([true], s.sanitize({ value: Symbol(), sanitization: t }));

    const t2 = t + '?';
    assertEquals([false, true, true], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals([true], s.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([true], s.sanitize({ value: [[]], sanitization: t2 }));
    assertEquals([true], s.sanitize({ value: { }, sanitization: t2 }));
    assertEquals([true], s.sanitize({ value: { a: 999}, sanitization: t2 }));
    assertEquals([true], s.sanitize({ value: Symbol(), sanitization: t2 }));
  });

  await t.step('array of dates type', async () => {
    const options = { dateUTC: true};

    const t = S.ARRAY_OF_DATES_TYPE;
    assertEquals(
      [new Date(2022, 11, 25), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))],
      s.sanitize({
        value: [new Date(2022, 11, 25), '2022-12-25T00:00:00.000Z', '2022-12-25'],
        sanitization: t,
        options
      }));
    assertEquals([new Date(Date.UTC(2022, 11, 25)), new Date(Date.UTC(1975, 0, 1)), new Date(0)], s.sanitize({
      value: [44920, 27395, 'a'],
      sanitization: t,
      options
    }));
    assertEquals([new Date(0)], s.sanitize({ value: undefined, sanitization: t, options }));
    assertEquals([new Date(0)], s.sanitize({ value: null, sanitization: t, options }));
    assertEquals([new Date(Date.UTC(2022, 11, 25))], s.sanitize({ value: 44920, sanitization: t, options }));
    assertEquals([new Date(0)], s.sanitize({ value: '', sanitization: t, options }));
    assertEquals([new Date(0)], s.sanitize({ value: 'abc', sanitization: t, options }));
    assertEquals([new Date(2022, 11, 25)], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t, options }));
    assertEquals([new Date(0)], s.sanitize({ value: new Date(NaN), sanitization: t, options }));
    assertEquals([new Date(0)], s.sanitize({ value: [[]], sanitization: t }));
    assertEquals([new Date(0)], s.sanitize({ value: { }, sanitization: t }));
    assertEquals([new Date(0)], s.sanitize({ value: { a: 999}, sanitization: t }));
    assertEquals([new Date(0)], s.sanitize({ value: Symbol(), sanitization: t }));

    const t2 = t + '?';
    assertEquals([new Date(0), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))], s.sanitize({
      value: [undefined, '2022-12-25T00:00:00.000Z', '2022-12-25'],
      sanitization: t2,
      options
    }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2, options }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2, options }));
    assertEquals([new Date(Date.UTC(2022, 11, 25))], s.sanitize({ value: 44920, sanitization: t2, options }));
    assertEquals([new Date(2022, 11, 25)], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t2, options }));
    assertEquals([new Date(0)], s.sanitize({ value: [[]], sanitization: t2 }));
    assertEquals([new Date(0)], s.sanitize({ value: { }, sanitization: t2 }));
    assertEquals([new Date(0)], s.sanitize({ value: { a: 999}, sanitization: t2 }));
    assertEquals([new Date(0)], s.sanitize({ value: Symbol(), sanitization: t2 }));
  });

  await t.step('object type', async () => {
    const t = S.OBJECT_TYPE;
    const obj = { a: 1, b: 2, c: 'a' };
    assertEquals(obj, s.sanitize({ value: obj, sanitization: t }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t }));
    assertEquals('abc', s.sanitize({ value: 'abc', sanitization: t }));

    const t2 = t + '?';
    assertEquals(obj, s.sanitize({ value: obj, sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('function/class type', async () => {

    class TestClass {
      /**
       * @param {{value: string, value2: string}} p
       */
      constructor ({ value, value2 }) {
        this.value = value;
        this.value2 = value2;
      }
    }

    const t = S.FUNCTION_TYPE;
    const obj = TestClass;
    assertEquals(obj, s.sanitize({ value: obj, sanitization: t }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t }));
    assertEquals('abc', s.sanitize({ value: 'abc', sanitization: t }));

    const t2 = t + '?';
    assertEquals(obj, s.sanitize({ value: obj, sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('symbol type', async () => {
    const t = S.SYMBOL_TYPE;
    const obj = Symbol();
    assertEquals(obj, s.sanitize({ value: obj, sanitization: t }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t }));
    assertEquals('abc', s.sanitize({ value: 'abc', sanitization: t }));

    const t2 = t + '?';
    assertEquals(obj, s.sanitize({ value: obj, sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, s.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('bigint type + validation', async () => {
    const t = S.BIGINT_TYPE;
    assertEquals(BigInt(0), s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: null, sanitization: t }));
    assertEquals(BigInt(999), s.sanitize({ value: 999, sanitization: t }));
    assertEquals(BigInt(999), s.sanitize({ value: '999', sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: '0', sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: '', sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(BigInt(new Date(2022, 11, 25).getTime()), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(BigInt(999), s.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    s.sanitize({ value: 0, sanitization: t, validate: true });
    s.sanitize({ value: 999, sanitization: t, validate: true });
    s.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('bigint number type + validation', async () => {
    const t = S.BIGINT_NUMBER_TYPE;
    assertEquals(BigInt(0), s.sanitize({ value: undefined, sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: null, sanitization: t }));
    assertEquals(BigInt(999), s.sanitize({ value: 999, sanitization: t }));
    assertEquals(BigInt(999), s.sanitize({ value: '999', sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: '0', sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: '', sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(BigInt(new Date(2022, 11, 25).getTime()), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(BigInt(0), s.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals(BigInt(999), s.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    s.sanitize({ value: 0, sanitization: t, validate: true });
    s.sanitize({ value: 999, sanitization: t, validate: true });
    s.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('array of bigint type + validation', async () => {
    const t = S.ARRAY_OF_BIGINT_TYPE;
    assertEquals([BigInt(1), BigInt(2), BigInt(0)], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: null, sanitization: t }));
    assertEquals([BigInt(999)], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: '', sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([BigInt(new Date(2022, 11, 25).getTime())],   s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals([BigInt(0), BigInt(2), BigInt(0)], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals([BigInt(999)], s.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    s.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
    s.sanitize({ value: undefined, sanitization: t, validate: true });
    s.sanitize({ value: null, sanitization: t, validate: true });
    s.sanitize({ value: 999, sanitization: t, validate: true });
    s.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('array of bigint number type + validation', async () => {
    const t = S.ARRAY_OF_BIGINT_NUMBER_TYPE;
    assertEquals([BigInt(1), BigInt(2), BigInt(0)], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: undefined, sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: null, sanitization: t }));
    assertEquals([BigInt(999)], s.sanitize({ value: 999, sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: '', sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([BigInt(new Date(2022, 11, 25).getTime())],   s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([BigInt(0)],   s.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals([BigInt(0), BigInt(2), BigInt(0)], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, s.sanitize({ value: null, sanitization: t2 }));
    assertEquals([BigInt(999)], s.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    s.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
    s.sanitize({ value: undefined, sanitization: t, validate: true });
    s.sanitize({ value: null, sanitization: t, validate: true });
    s.sanitize({ value: 999, sanitization: t, validate: true });
    s.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('big.js type + validation (use the Big function to sanitize the value)', async () => {
    const t = Big;
    assertEquals(JSON.stringify(undefined), JSON.stringify(s.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify(null), JSON.stringify(s.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(s.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(s.sanitize({ value: '999', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(s.sanitize({ value: '0', sanitization: t })));
    assertEquals(JSON.stringify(''), JSON.stringify(s.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify('abc'), JSON.stringify(s.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify(new Date(2022, 11, 25)), JSON.stringify(s.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify(new Date(NaN)), JSON.stringify(s.sanitize({ value: new Date(NaN), sanitization: t })));

    // sanitize + validate
    s.sanitize({ value: 0, sanitization: t, validate: true });
    s.sanitize({ value: 999, sanitization: t, validate: true });
  });

  await t.step('array of big.js type + validation (use the Big function to sanitize the value)', async () => {
    const t = [Big];
    assertEquals(JSON.stringify([new Big(1), new Big(2), 'a']), JSON.stringify(s.sanitize({ value: [1, 2, 'a'], sanitization: t })));
    assertEquals(JSON.stringify([undefined]), JSON.stringify(s.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify([null]), JSON.stringify(s.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify([new Big(999)]), JSON.stringify(s.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify(['']), JSON.stringify(s.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify(['abc']), JSON.stringify(s.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify([new Date(2022, 11, 25)]), JSON.stringify(s.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify([new Date(NaN)]), JSON.stringify(s.sanitize({ value: new Date(NaN), sanitization: t })));

    // sanitize + validate
    s.sanitize({ value: 999, sanitization: t, validate: true });
    s.sanitize({ value: '999', sanitization: t, validate: true });
  });
});
