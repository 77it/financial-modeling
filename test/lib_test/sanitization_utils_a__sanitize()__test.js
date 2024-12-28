import * as S from '../../src/lib/schema.js';
import * as s from '../../src/lib/schema_sanitization_utils.js';

import { validateSanitizeFunction_TestTemp } from './validateSanitizeFunction_TestTemp.js';
import { isValidDate } from '../../src/lib/date_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('test sanitize() - test wrong/unknown options', async () => {
  assert.throws(() => s.sanitize({ value: 'aaaX', sanitization: 'wrong sanitization type' }));
});

t('test sanitize() - any type', async () => {
  const t = S.ANY_TYPE;
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([999], s.sanitize({ value: [999], sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual([999], s.sanitize({ value: [999], sanitization: t2 }));
});

t('test sanitize() - string type', async () => {
  const t = S.STRING_TYPE;
  assert.deepStrictEqual('', s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual('0', s.sanitize({ value: 0, sanitization: t }));
  assert.deepStrictEqual('999', s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed if the string is empty
  assert.deepStrictEqual('abc', s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual('  abc  ', s.sanitize({ value: '  abc  ', sanitization: t }));    // whitespaces are not trimmed if the string is not empty
  assert.deepStrictEqual('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual('true', s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual('false', s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: [], sanitization: t }));
  assert.deepStrictEqual('a', s.sanitize({ value: ['a'], sanitization: t }));
  assert.deepStrictEqual('  a,  b ,c', s.sanitize({ value: ['  a', '  b ', 'c'], sanitization: t }));

  // string sanitization with UTC `dateUTC` option = true
  const opt = { dateUTC: true };
  assert.deepStrictEqual('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(Date.UTC(2022, 11, 25)), sanitization: t, options: opt }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual('999', s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual('', s.sanitize({ value: '    ', sanitization: t2 }));  // whitespaces are trimmed
  assert.deepStrictEqual('true', s.sanitize({ value: true, sanitization: t2 }));
  assert.deepStrictEqual('false', s.sanitize({ value: false, sanitization: t2 }));
});

t('test sanitize() - string lowercase trimmed type', async () => {
  const t = S.STRINGLOWERCASETRIMMED_TYPE;
  assert.deepStrictEqual('', s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual('0', s.sanitize({ value: 0, sanitization: t }));
  assert.deepStrictEqual('999', s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed if the string is empty
  assert.deepStrictEqual('abc', s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual('abc', s.sanitize({ value: '  abc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
  assert.deepStrictEqual('abc', s.sanitize({ value: 'aBc', sanitization: t }));
  assert.deepStrictEqual('abc', s.sanitize({ value: '  aBc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
  assert.deepStrictEqual('2022-12-25t00:00:00.000z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual('true', s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual('false', s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: [], sanitization: t }));
  assert.deepStrictEqual('a', s.sanitize({ value: ['A'], sanitization: t }));
  assert.deepStrictEqual('a,  b ,c', s.sanitize({ value: ['  a', '  B ', 'c'], sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual('999', s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual('', s.sanitize({ value: '    ', sanitization: t2 }));  // whitespaces are trimmed
  assert.deepStrictEqual('true', s.sanitize({ value: true, sanitization: t2 }));
  assert.deepStrictEqual('false', s.sanitize({ value: false, sanitization: t2 }));
});

t('test sanitize() - string uppercase trimmed type', async () => {
  const t = S.STRINGUPPERCASETRIMMED_TYPE;
  assert.deepStrictEqual('', s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual('0', s.sanitize({ value: 0, sanitization: t }));
  assert.deepStrictEqual('999', s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed if the string is empty
  assert.deepStrictEqual('ABC', s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual('ABC', s.sanitize({ value: '  abc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
  assert.deepStrictEqual('ABC', s.sanitize({ value: 'aBc', sanitization: t }));
  assert.deepStrictEqual('ABC', s.sanitize({ value: '  aBc  ', sanitization: t }));    // whitespaces are trimmed if the string is not empty
  assert.deepStrictEqual('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual('TRUE', s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual('FALSE', s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: [], sanitization: t }));
  assert.deepStrictEqual('A', s.sanitize({ value: ['A'], sanitization: t }));
  assert.deepStrictEqual('A,  B ,C', s.sanitize({ value: ['  a', '  B ', 'c'], sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual('999', s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual('', s.sanitize({ value: '    ', sanitization: t2 }));  // whitespaces are trimmed
  assert.deepStrictEqual('TRUE', s.sanitize({ value: true, sanitization: t2 }));
  assert.deepStrictEqual('FALSE', s.sanitize({ value: false, sanitization: t2 }));
});

t('test sanitize() - number type + validation', async () => {
  const t = S.NUMBER_TYPE;
  assert.deepStrictEqual(0, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(1671922800000, s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual(1, s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: [], sanitization: t }));
  assert.deepStrictEqual(2, s.sanitize({ value: [2], sanitization: t }));
  assert.deepStrictEqual(9, s.sanitize({ value: [9], sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: [1, 2], sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual(1, s.sanitize({ value: true, sanitization: t2 }));
  assert.deepStrictEqual(0, s.sanitize({ value: false, sanitization: t2 }));

  assert.deepStrictEqual(s.sanitize({ value: '999', sanitization: S.NUMBER_TYPE, validate: true }), 999);
  assert.deepStrictEqual(s.sanitize({ value: '999', sanitization: S.NUMBER_TYPE + '?', validate: true }), 999);
  assert.deepStrictEqual(s.sanitize({ value: undefined, sanitization: S.NUMBER_TYPE + '?', validate: true }), undefined);
});

t('test sanitize() - boolean type', async () => {
  const t = S.BOOLEAN_TYPE;
  assert.deepStrictEqual(false, s.sanitize({ value: 'false', sanitization: t }));  // string 'false' = false
  assert.deepStrictEqual(false, s.sanitize({ value: 'FaLsE', sanitization: t }));  // string 'false' = false
  assert.deepStrictEqual(false, s.sanitize({ value: '  FaLsE  ', sanitization: t }));  // string 'false' = false
  assert.deepStrictEqual(false, s.sanitize({ value: '', sanitization: t }));  // string '' = false
  assert.deepStrictEqual(false, s.sanitize({ value: '     ', sanitization: t }));  // whitespace = false
  assert.deepStrictEqual(false, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: -0, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: 0, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 1, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: -1, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 'true', sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 'TrUe', sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: '  TrUe   ', sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(true, s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual(true, s.sanitize({ value: true, sanitization: t2 }));
  assert.deepStrictEqual(false, s.sanitize({ value: false, sanitization: t2 }));
});

t('test sanitize() - date type, with OPTIONS.DATE_UTC = true (UTC Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
  const options = { dateUTC: true };

  const t = S.DATE_TYPE;
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: undefined, sanitization: t, options }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: null, sanitization: t, options }));
  assert.deepStrictEqual(new Date(Date.UTC(2022, 11, 25)), s.sanitize({ value: 44920, sanitization: t, options }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: '', sanitization: t, options }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: 'abc', sanitization: t, options }));
  assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t, options }));
  assert.deepStrictEqual(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), s.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t, options }));
  assert.deepStrictEqual(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), s.sanitize({ value: '2022-12-25', sanitization: t, options }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: new Date(NaN), sanitization: t, options }));
  assert.deepStrictEqual(new Date(1), s.sanitize({ value: true, sanitization: t, options }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: false, sanitization: t, options }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2, options }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2, options }));
  assert.deepStrictEqual(new Date(Date.UTC(2022, 11, 25)), s.sanitize({ value: 44920, sanitization: t2, options }));
  assert.deepStrictEqual(new Date(1), s.sanitize({ value: true, sanitization: t2, options }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: false, sanitization: t2, options }));
});

t('test sanitize() - date type, with default OPTIONS.DATE_UTC = false (local Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
  const t = S.DATE_TYPE;
  assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: 44920, sanitization: t }));
  assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual(new Date(2022, 11, 25, 0, 0, 0), s.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t }));
  assert.deepStrictEqual(new Date(2022, 11, 25, 0, 0, 0), s.sanitize({ value: '2022-12-25', sanitization: t }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual(new Date(1), s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: false, sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2, }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: 44920, sanitization: t2 }));
  assert.deepStrictEqual(new Date(1), s.sanitize({ value: true, sanitization: t2 }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: false, sanitization: t2 }));
});

t('test sanitize() - date type with option number To Date OPTION__NUMBER_TO_DATE__JS_SERIAL_DATE', async () => {
  const options = { numberToDate: S.NUMBER_TO_DATE_OPTS__JS_SERIAL_DATE };

  const t = S.DATE_TYPE;
  assert.deepStrictEqual(new Date(44920), s.sanitize({ value: 44920, sanitization: t, options }));

  const t2 = t + '?';
  assert.deepStrictEqual(new Date(44920), s.sanitize({ value: 44920, sanitization: t2, options }));
});

t('test sanitize() - date type with option number To Date OPTION__NUMBER_TO_DATE__NO_CONVERSION', async () => {
  const options = { numberToDate: S.NUMBER_TO_DATE_OPTS__NO_CONVERSION, defaultDate: undefined };

  const t = S.DATE_TYPE;
  assert.deepStrictEqual(undefined, s.sanitize({ value: 44920, sanitization: t, options }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: 44920, sanitization: t2, options }));
});

t('test sanitize() - array (enum) type + validation', async () => {
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: [] }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: [11, 22, 999, 55] }));
  assert.deepStrictEqual('aaa', s.sanitize({ value: 'aaa', sanitization: [11, 'aa', 'aaa', 55] }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: [11, undefined, 'aa', 'aaa', 55], validate: true }));
  assert.throws(() => s.sanitize({ value: 'aaaX', sanitization: [11, 'aa', 'aaa', 55], validate: true }));
});

t('test sanitize() - array type', async () => {
  const t = S.ARRAY_TYPE;
  assert.deepStrictEqual([1, 2, 'a'], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
  assert.deepStrictEqual([undefined], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([null], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([999], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(['abc'], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual([new Date(2022, 11, 25)], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert(!isValidDate(s.sanitize({ value: new Date(NaN), sanitization: t })));
  assert.deepStrictEqual([{ a: 999 }], s.sanitize({ value: { a: 999 }, sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual([999], s.sanitize({ value: 999, sanitization: t2 }));
});

t('test sanitize() - array of strings type', async () => {
  const t = S.ARRAY_OF_STRINGS_TYPE;
  assert.deepStrictEqual(['1', '2', 'a'], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(['abc'], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(['2022-12-25T00:00:00.000Z'], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: [[]], sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: {}, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: { a: 999 }, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: Symbol(), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(['', '2', 'a'], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: [[]], sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: {}, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: { a: 999 }, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: Symbol(), sanitization: t2 }));
});

t('test sanitize() - array of strings lowercase trimmed type', async () => {
  const t = S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE;
  assert.deepStrictEqual(['1', '2', 'a'], s.sanitize({ value: [1, 2, '   a   '], sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(['abc'], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(['2022-12-25t00:00:00.000z'], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: [[]], sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: {}, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: { a: 999 }, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: Symbol(), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(['', '2', 'a'], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: [[]], sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: {}, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: { a: 999 }, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: Symbol(), sanitization: t2 }));
});

t('test sanitize() - array of strings uppercase trimmed type', async () => {
  const t = S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE;
  assert.deepStrictEqual(['1', '2', 'A'], s.sanitize({ value: [1, 2, '   a   '], sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(['ABC'], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(['2022-12-25T00:00:00.000Z'], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: [[]], sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: {}, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: { a: 999 }, sanitization: t }));
  assert.deepStrictEqual([''], s.sanitize({ value: Symbol(), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(['', '2', 'A'], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: [[]], sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: {}, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: { a: 999 }, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: Symbol(), sanitization: t2 }));
});

t('test sanitize() - array of numbers type', async () => {
  const t = S.ARRAY_OF_NUMBERS_TYPE;
  assert.deepStrictEqual([1, 2, 0], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([999], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual([1671922800000], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: [[]], sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: {}, sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: { a: 999 }, sanitization: t }));
  assert.deepStrictEqual([0], s.sanitize({ value: Symbol(), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual([0, 2, 0], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual([999], s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual([0], s.sanitize({ value: [[]], sanitization: t2 }));
  assert.deepStrictEqual([0], s.sanitize({ value: {}, sanitization: t2 }));
  assert.deepStrictEqual([0], s.sanitize({ value: { a: 999 }, sanitization: t2 }));
  assert.deepStrictEqual([0], s.sanitize({ value: Symbol(), sanitization: t2 }));
});

t('test sanitize() - array of booleans type', async () => {
  const t = S.ARRAY_OF_BOOLEANS_TYPE;
  assert.deepStrictEqual([true, true, true], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
  assert.deepStrictEqual([false], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([false], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([false], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: [[]], sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: {}, sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: { a: 999 }, sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: Symbol(), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual([false, true, true], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual([true], s.sanitize({ value: 999, sanitization: t2 }));
  assert.deepStrictEqual([true], s.sanitize({ value: [[]], sanitization: t2 }));
  assert.deepStrictEqual([true], s.sanitize({ value: {}, sanitization: t2 }));
  assert.deepStrictEqual([true], s.sanitize({ value: { a: 999 }, sanitization: t2 }));
  assert.deepStrictEqual([true], s.sanitize({ value: Symbol(), sanitization: t2 }));
});

t('test sanitize() - array of dates type', async () => {
  const options = { dateUTC: true };

  const t = S.ARRAY_OF_DATES_TYPE;
  assert.deepStrictEqual(
    [new Date(2022, 11, 25), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))],
    s.sanitize({
      value: [new Date(2022, 11, 25), '2022-12-25T00:00:00.000Z', '2022-12-25'],
      sanitization: t,
      options
    }));
  assert.deepStrictEqual([new Date(Date.UTC(2022, 11, 25)), new Date(Date.UTC(1975, 0, 1)), new Date(0)], s.sanitize({
    value: [44920, 27395, 'a'],
    sanitization: t,
    options
  }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: undefined, sanitization: t, options }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: null, sanitization: t, options }));
  assert.deepStrictEqual([new Date(Date.UTC(2022, 11, 25))], s.sanitize({ value: 44920, sanitization: t, options }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: '', sanitization: t, options }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: 'abc', sanitization: t, options }));
  assert.deepStrictEqual([new Date(2022, 11, 25)], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t, options }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: new Date(NaN), sanitization: t, options }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: [[]], sanitization: t }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: {}, sanitization: t }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: { a: 999 }, sanitization: t }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: Symbol(), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual([new Date(0), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))], s.sanitize({
    value: [undefined, '2022-12-25T00:00:00.000Z', '2022-12-25'],
    sanitization: t2,
    options
  }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2, options }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2, options }));
  assert.deepStrictEqual([new Date(Date.UTC(2022, 11, 25))], s.sanitize({ value: 44920, sanitization: t2, options }));
  assert.deepStrictEqual([new Date(2022, 11, 25)], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t2, options }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: [[]], sanitization: t2 }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: {}, sanitization: t2 }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: { a: 999 }, sanitization: t2 }));
  assert.deepStrictEqual([new Date(0)], s.sanitize({ value: Symbol(), sanitization: t2 }));
});

t('test sanitize() - object type', async () => {
  const t = S.OBJECT_TYPE;
  const obj = { a: 1, b: 2, c: 'a' };
  assert.deepStrictEqual(obj, s.sanitize({ value: obj, sanitization: t }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual('abc', s.sanitize({ value: 'abc', sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(obj, s.sanitize({ value: obj, sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t2 }));
});

t('test sanitize() - function/class type', async () => {

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
  assert.deepStrictEqual(obj, s.sanitize({ value: obj, sanitization: t }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual('abc', s.sanitize({ value: 'abc', sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(obj, s.sanitize({ value: obj, sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t2 }));
});

t('test sanitize() - symbol type', async () => {
  const t = S.SYMBOL_TYPE;
  const obj = Symbol();
  assert.deepStrictEqual(obj, s.sanitize({ value: obj, sanitization: t }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual('abc', s.sanitize({ value: 'abc', sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(obj, s.sanitize({ value: obj, sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(999, s.sanitize({ value: 999, sanitization: t2 }));
});

t('test sanitize() - bigint type + validation', async () => {
  const t = S.BIGINT_TYPE;
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: '999', sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: '0', sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(BigInt(new Date(2022, 11, 25).getTime()), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: new Date(NaN), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: 999, sanitization: t2 }));

  // sanitize + validate
  s.sanitize({ value: 0, sanitization: t, validate: true });
  s.sanitize({ value: 999, sanitization: t, validate: true });
  s.sanitize({ value: 'aaa', sanitization: t, validate: true });
});

t('test sanitize() - bigint number type + validation', async () => {
  const t = S.BIGINT_NUMBER_TYPE;
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: '999', sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: '0', sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(BigInt(new Date(2022, 11, 25).getTime()), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual(BigInt(0), s.sanitize({ value: new Date(NaN), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: 999, sanitization: t2 }));

  // sanitize + validate
  s.sanitize({ value: 0, sanitization: t, validate: true });
  s.sanitize({ value: 999, sanitization: t, validate: true });
  s.sanitize({ value: 'aaa', sanitization: t, validate: true });
});

t('test sanitize() - array of bigint type + validation', async () => {
  const t = S.ARRAY_OF_BIGINT_TYPE;
  assert.deepStrictEqual([BigInt(1), BigInt(2), BigInt(0)], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([BigInt(999)], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual([BigInt(new Date(2022, 11, 25).getTime())], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: new Date(NaN), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual([BigInt(0), BigInt(2), BigInt(0)], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual([BigInt(999)], s.sanitize({ value: 999, sanitization: t2 }));

  // sanitize + validate
  s.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
  s.sanitize({ value: undefined, sanitization: t, validate: true });
  s.sanitize({ value: null, sanitization: t, validate: true });
  s.sanitize({ value: 999, sanitization: t, validate: true });
  s.sanitize({ value: 'aaa', sanitization: t, validate: true });
});

t('test sanitize() - array of bigint number type + validation', async () => {
  const t = S.ARRAY_OF_BIGINT_NUMBER_TYPE;
  assert.deepStrictEqual([BigInt(1), BigInt(2), BigInt(0)], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([BigInt(999)], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual([BigInt(new Date(2022, 11, 25).getTime())], s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual([BigInt(0)], s.sanitize({ value: new Date(NaN), sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual([BigInt(0), BigInt(2), BigInt(0)], s.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual([BigInt(999)], s.sanitize({ value: 999, sanitization: t2 }));

  // sanitize + validate
  s.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
  s.sanitize({ value: undefined, sanitization: t, validate: true });
  s.sanitize({ value: null, sanitization: t, validate: true });
  s.sanitize({ value: 999, sanitization: t, validate: true });
  s.sanitize({ value: 'aaa', sanitization: t, validate: true });
});

t('test sanitize() - test throw when a sanitization function doesn\'t return `ValidateSanitizeResult` type', async () => {
  // WRONG sanitization function that doesn't return `ValidateSanitizeResult` type
  const t = /** @param {*} value */ (value) => { return 0 };

  try {
    s.sanitize({ value: 'aaaX', sanitization: t });
  } catch (err) {
    //@ts-ignore err.message unknown type
    assert.deepStrictEqual('sanitization function must return a `ValidateSanitizeResult` object', err.message);
  }
});

t('test sanitize() - custom function type + validation (use the validateSanitizeFunction_TestTemp function to sanitize the value)', async () => {
  const t = validateSanitizeFunction_TestTemp;
  assert.deepStrictEqual((undefined), (s.sanitize({ value: undefined, sanitization: t })));
  assert.deepStrictEqual((null), (s.sanitize({ value: null, sanitization: t })));
  assert.deepStrictEqual((validateSanitizeFunction_TestTemp(999).sanitizedValue), (s.sanitize({ value: 999, sanitization: t })));
  assert.deepStrictEqual((validateSanitizeFunction_TestTemp(999).sanitizedValue), (s.sanitize({ value: '999', sanitization: t })));
  assert.deepStrictEqual((validateSanitizeFunction_TestTemp(0).sanitizedValue), (s.sanitize({ value: '0', sanitization: t })));
  assert.deepStrictEqual((10), (s.sanitize({ value: '', sanitization: t })));
  assert.deepStrictEqual(('abc'), (s.sanitize({ value: 'abc', sanitization: t })));
  assert.deepStrictEqual((new Date(2022, 11, 25)), (s.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));

  // sanitize + validate
  s.sanitize({ value: 0, sanitization: t, validate: true });
  s.sanitize({ value: 999, sanitization: t, validate: true });
});

t('test sanitize() - array of custom function type + validation (use the validateSanitizeFunction_TestTemp function to sanitize the value)', async () => {
  const t = [validateSanitizeFunction_TestTemp];
  assert.deepStrictEqual(([validateSanitizeFunction_TestTemp(1).sanitizedValue, validateSanitizeFunction_TestTemp(2).sanitizedValue, validateSanitizeFunction_TestTemp('a').sanitizedValue]), (s.sanitize({ value: [1, 2, 'a'], sanitization: t })));
  assert.deepStrictEqual(([undefined]), (s.sanitize({ value: undefined, sanitization: t })));
  assert.deepStrictEqual(([null]), (s.sanitize({ value: null, sanitization: t })));
  assert.deepStrictEqual(([validateSanitizeFunction_TestTemp(999).sanitizedValue]), (s.sanitize({ value: 999, sanitization: t })));
  assert.deepStrictEqual(([10]), (s.sanitize({ value: '', sanitization: t })));
  assert.deepStrictEqual((['abc']), (s.sanitize({ value: 'abc', sanitization: t })));
  assert.deepStrictEqual(([new Date(2022, 11, 25)]), (s.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));

  // sanitize + validate
  s.sanitize({ value: 999, sanitization: t, validate: true });
  s.sanitize({ value: '999', sanitization: t, validate: true });
});

