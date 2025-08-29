import * as S from '../../src/lib/schema.js';
import * as s from '../../src/lib/schema_sanitization_utils.js';

import { validateSanitizeFunction_TestAsset } from './validateSanitizeFunction_TestAsset.js';
import { isValidDate } from '../../src/lib/date_utils.js';
import { Decimal } from '../../vendor/decimal/decimal.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

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
  assert.deepStrictEqual('999', s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual('999', s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
  assert.deepStrictEqual('', s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed if the string is empty
  assert.deepStrictEqual('abc', s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual('  abc  ', s.sanitize({ value: '  abc  ', sanitization: t }));    // whitespaces are not trimmed if the string is not empty
  assert.deepStrictEqual('', s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual('true', s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual('false', s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual('', s.sanitize({ value: [], sanitization: t }));
  assert.deepStrictEqual('a', s.sanitize({ value: ['a'], sanitization: t }));
  assert.deepStrictEqual('  a,  b ,c', s.sanitize({ value: ['  a', '  b ', 'c'], sanitization: t }));
  // if `_DATE_UTC` is false or omitted, the date is presumed to be in local time
  // then is generated a UTC date with the date components (ignoring the time zone) and then the date is converted to ISO string
  const opt1 = { dateUTC: false };
  assert.deepStrictEqual('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t, options: opt1 }));
  assert.deepStrictEqual('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));

  // if `_DATE_UTC` is true, the date is presumed to be in UTC
  // then the date is directly converted to ISO string
  const opt2 = { dateUTC: true };
  assert.deepStrictEqual('2022-12-25T00:00:00.000Z', s.sanitize({ value: new Date(Date.UTC(2022, 11, 25)), sanitization: t, options: opt2 }));

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
  assert.deepStrictEqual('999', s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual('999', s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual('999', s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual('999', s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual(999, s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(-999, s.sanitize({ value: -999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(999, s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
  assert.deepStrictEqual(-999, s.sanitize({ value: new Decimal(-999), sanitization: t }));  // Decimal
  assert.deepStrictEqual(0, s.sanitize({ value: '', sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(1671922800000, s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: new Date(NaN), sanitization: t }));
  assert.deepStrictEqual(1, s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual(0, s.sanitize({ value: [], sanitization: t }));
  // nested array of one element -> take the first element
  assert.deepStrictEqual(2, s.sanitize({ value: [2], sanitization: t }));
  assert.deepStrictEqual(9, s.sanitize({ value: [9], sanitization: t }));
  // nested array of more than one element -> force to default value 0
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
  assert.deepStrictEqual(false, s.sanitize({ value: false, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: 'false', sanitization: t }));  // string 'false' = false
  assert.deepStrictEqual(false, s.sanitize({ value: 'FaLsE', sanitization: t }));  // string 'false' = false
  assert.deepStrictEqual(false, s.sanitize({ value: '  FaLsE  ', sanitization: t }));  // string 'false' = false
  assert.deepStrictEqual(false, s.sanitize({ value: '', sanitization: t }));  // string '' = false
  assert.deepStrictEqual(false, s.sanitize({ value: '     ', sanitization: t }));  // whitespace = false
  assert.deepStrictEqual(false, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: -0, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: 0, sanitization: t }));
  assert.deepStrictEqual(false, s.sanitize({ value: 0n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(false, s.sanitize({ value: new Decimal(0), sanitization: t }));  // Decimal

  assert.deepStrictEqual(true, s.sanitize({ value: true, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 1n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(true, s.sanitize({ value: new Decimal(1), sanitization: t }));  // Decimal
  assert.deepStrictEqual(true, s.sanitize({ value: 1, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: -1, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
  assert.deepStrictEqual(true, s.sanitize({ value: new Date(NaN), sanitization: t }));
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

t('test sanitize() - date type, with OPTIONS.DATE_UTC = true (dates are presumed to be UTC Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
  const options = { dateUTC: true };

  const t = S.DATE_TYPE;
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: undefined, sanitization: t, options }));
  assert.deepStrictEqual(new Date(0), s.sanitize({ value: null, sanitization: t, options }));
  assert.deepStrictEqual(new Date(Date.UTC(2022, 11, 25)), s.sanitize({ value: 44920, sanitization: t, options }));
  assert.deepStrictEqual(new Date(Date.UTC(2022, 11, 25)), s.sanitize({ value: 44920n, sanitization: t, options }));  // BigInt
  assert.deepStrictEqual(new Date(Date.UTC(2022, 11, 25)), s.sanitize({ value: new Decimal(44920), sanitization: t, options }));  // Decimal
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

t('test sanitize() - date type, with default option AND explicit OPTIONS.DATE_UTC = false (dates are presumed to be local Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
  const optionsArray = [{ dateUTC: false }, {}];

  // loop all options
  for (const options of optionsArray) {
    const t = S.DATE_TYPE;
    assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: 44920, sanitization: t , options }));
    assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: new Date(2022, 11, 25), sanitization: t , options }));
    assert.deepStrictEqual(new Date(2022, 11, 25, 0, 0, 0), s.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t , options }));
    assert.deepStrictEqual(new Date(2022, 11, 25, 0, 0, 0), s.sanitize({ value: '2022-12-25', sanitization: t , options }));
    assert.deepStrictEqual(new Date(0), s.sanitize({ value: new Date(NaN), sanitization: t , options }));
    assert.deepStrictEqual(new Date(1), s.sanitize({ value: true, sanitization: t , options }));
    assert.deepStrictEqual(new Date(0), s.sanitize({ value: false, sanitization: t , options }));

    const t2 = t + '?';
    assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2, options }));
    assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 , options }));
    assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: 44920, sanitization: t2 , options }));
    assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: 44920n, sanitization: t2 , options }));  // BigInt
    assert.deepStrictEqual(new Date(2022, 11, 25), s.sanitize({ value: new Decimal(44920), sanitization: t2 , options }));  // Decimal
    assert.deepStrictEqual(new Date(1), s.sanitize({ value: true, sanitization: t2 , options }));
    assert.deepStrictEqual(new Date(0), s.sanitize({ value: false, sanitization: t2 , options }));
  }
});

t('test sanitize() - date type with option number To Date OPTION__NUMBER_TO_DATE__JS_SERIAL_DATE', async () => {
  const options = { numberToDate: S.NUMBER_TO_DATE_OPTS.NUMBER_TO_DATE__JS_SERIAL_DATE };

  const t = S.DATE_TYPE;
  assert.deepStrictEqual(new Date(44920), s.sanitize({ value: 44920, sanitization: t, options }));

  const t2 = t + '?';
  assert.deepStrictEqual(new Date(44920), s.sanitize({ value: 44920, sanitization: t2, options }));
});

t('test sanitize() - date type with option number To Date OPTION__NUMBER_TO_DATE__NO_CONVERSION', async () => {
  const options = { numberToDate: S.NUMBER_TO_DATE_OPTS.NUMBER_TO_DATE__NO_CONVERSION, defaultDate: undefined };

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
  assert.deepStrictEqual(55n, s.sanitize({ value: 55n, sanitization: [11, undefined, 'aa', 'aaa', 55n], validate: true }));  // BigInt
  assert.deepStrictEqual(new Decimal(55), s.sanitize({ value: new Decimal(55), sanitization: [11, undefined, 'aa', 'aaa', new Decimal(55)], validate: true }));  // Decimal
  assert.throws(() => s.sanitize({ value: 'aaaX', sanitization: [11, 'aa', 'aaa', 55], validate: true }));
});

t('test sanitize() - array type', async () => {
  const t = S.ARRAY_TYPE;
  assert.deepStrictEqual([1, 2, 'a'], s.sanitize({ value: [1, 2, 'a'], sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([999], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([999n], s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual([new Decimal(999)], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(['999'], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(['999'], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999n, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: '', sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: [[]], sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: {}, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: { a: 999 }, sanitization: t2 }));
  assert.deepStrictEqual([''], s.sanitize({ value: Symbol(), sanitization: t2 }));
});

t('test sanitize() - array of strings uppercase trimmed type', async () => {
  const t = S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE;
  assert.deepStrictEqual(['1', '2', 'A'], s.sanitize({ value: [1, 2, '   a   '], sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual(['999'], s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(['999'], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([999], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([999], s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual([999], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([true], s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual([true], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t, options }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t, options }));
  assert.deepStrictEqual([new Date(Date.UTC(2022, 11, 25))], s.sanitize({ value: 44920, sanitization: t, options }));
  assert.deepStrictEqual([new Date(Date.UTC(2022, 11, 25))], s.sanitize({ value: 44920n, sanitization: t, options }));  // BigInt
  assert.deepStrictEqual([new Date(Date.UTC(2022, 11, 25))], s.sanitize({ value: new Decimal(44920), sanitization: t, options }));  // Decimal
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
  assert.deepStrictEqual({}, s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual({}, s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual({}, s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual({}, s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(new Decimal(999), s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
  assert.deepStrictEqual({}, s.sanitize({ value: 'abc', sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: [], sanitization: t }));
  assert.deepStrictEqual([null], s.sanitize({ value: [null], sanitization: t }));
  assert.deepStrictEqual([undefined], s.sanitize({ value: [undefined], sanitization: t }));
  assert.deepStrictEqual([999], s.sanitize({ value: [999], sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual(obj, s.sanitize({ value: obj, sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual({}, s.sanitize({ value: 999, sanitization: t2 }));
});

t('test sanitize() - array of objects type', async () => {
  const t = S.ARRAY_OF_OBJECTS_TYPE;
  const obj = { a: 1, b: 2, c: 'a' };
  assert.deepStrictEqual([obj], s.sanitize({ value: obj, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual( [], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([{}], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([{}], s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual([new Decimal(999)], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
  assert.deepStrictEqual([{}], s.sanitize({ value: 'abc', sanitization: t }));

  const t2 = t + '?';
  assert.deepStrictEqual([obj], s.sanitize({ value: obj, sanitization: t2 }));
  assert.deepStrictEqual(undefined, s.sanitize({ value: undefined, sanitization: t2 }));
  assert.deepStrictEqual(null, s.sanitize({ value: null, sanitization: t2 }));
  assert.deepStrictEqual([{}], s.sanitize({ value: 999, sanitization: t2 }));
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
  assert.deepStrictEqual(999n, s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(new Decimal(999), s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual(999n, s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(new Decimal(999), s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: 999n, sanitization: t }));  // BigInt
  assert.deepStrictEqual(BigInt(999), s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([BigInt(999)], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([BigInt(999n)], s.sanitize({ value: 999, sanitization: t }));  // BigInt
  assert.deepStrictEqual([BigInt(999n)], s.sanitize({ value: new Decimal(999), sanitization: t }));  // Decimal
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
  assert.deepStrictEqual([], s.sanitize({ value: undefined, sanitization: t }));
  assert.deepStrictEqual([], s.sanitize({ value: null, sanitization: t }));
  assert.deepStrictEqual([BigInt(999)], s.sanitize({ value: 999, sanitization: t }));
  assert.deepStrictEqual([BigInt(999)], s.sanitize({ value: 999n, sanitization: t }));
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

t('test sanitize() - decimal type', async () => {
  const tDec = S.DECIMAL_TYPE;

  // undefined/null/empty -> Decimal(0)
  {
    assert(isDecimalEqualTo(0, s.sanitize({ value: undefined, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: null, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: '', sanitization: tDec })));
  }

  // invalid string -> Decimal(0)
  {
    assert(isDecimalEqualTo(0, s.sanitize({ value: 'abc', sanitization: tDec })));
  }

  // strings and numbers -> Decimal(value)
  {
    assert(isDecimalEqualTo(0, s.sanitize({ value: '', sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: '  ', sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: 0, sanitization: tDec })));
    assert(isDecimalEqualTo(999, s.sanitize({ value: 999, sanitization: tDec })));
    assert(isDecimalEqualTo('123.45', s.sanitize({ value: '123.45', sanitization: tDec })));
    assert(isDecimalEqualTo('123.45', s.sanitize({ value: '    123.45', sanitization: tDec })));
    assert(isDecimalEqualTo('123.45', s.sanitize({ value: '123.45    ', sanitization: tDec })));
    assert(isDecimalEqualTo('123.45', s.sanitize({ value: '    123.45    ', sanitization: tDec })));
    assert(isDecimalEqualTo('123.45', s.sanitize({ value: 123.45, sanitization: tDec })));

    // not a number (infinity, NaN, overflow) -> Decimal(0)
    assert(isDecimalEqualTo(0, s.sanitize({ value: 1 / 0, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: -1 / 0, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: Number.MAX_VALUE * 2, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: -Number.MAX_VALUE * 2, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: 0 / 0, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: NaN, sanitization: tDec })));
  }

  // bigInt
  {
    assert(isDecimalEqualTo(1, s.sanitize({ value: 1n, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: 0n, sanitization: tDec })));
    assert(isDecimalEqualTo('1e+1000000', s.sanitize({ value: 10n ** 1000000n, sanitization: tDec })));
    assert(isDecimalEqualTo('-1e+1000000', s.sanitize({ value: -(10n ** 1000000n), sanitization: tDec })));
  }

  // booleans -> 1 / 0
  {
    assert(isDecimalEqualTo(1, s.sanitize({ value: true, sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: false, sanitization: tDec })));
  }

  // Decimal instance is returned as Decimal unchanged in value
  {
    assert(isDecimalEqualTo('42.0001', s.sanitize({ value: new Decimal('42.0001'), sanitization: tDec })));
  }

  // Date
  {
    assert(isDecimalEqualTo(1671922800000, s.sanitize({ value: new Date(2022, 11, 25), sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: new Date(NaN), sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: new Date(0), sanitization: tDec })));
  }

  // Array
  {
    assert(isDecimalEqualTo(0, s.sanitize({ value: [], sanitization: tDec })));
    assert(isDecimalEqualTo(2, s.sanitize({ value: [2], sanitization: tDec })));
    assert(isDecimalEqualTo(2, s.sanitize({ value: ['2'], sanitization: tDec })));
    assert(isDecimalEqualTo(0, s.sanitize({ value: [1, 2], sanitization: tDec })));
  }

  // optional
  {
    const tDecOpt = tDec + S.OPTIONAL;

    assert.strictEqual(s.sanitize({ value: undefined, sanitization: tDecOpt }), undefined);
    assert.strictEqual(s.sanitize({ value: null, sanitization: tDecOpt }), null);
    assert(isDecimalEqualTo('7.5', s.sanitize({ value: '7.5', sanitization: tDecOpt })));
  }

  /**
   * function that returns true if the value is of decimal type and equal to the passed value; otherwise print error on console and return false
   * @param {*} expected
   * @param {*} value
   * @return {boolean}
   */
  function isDecimalEqualTo (expected, value) {
    if (!(value instanceof Decimal)) {
      console.error('NOT Decimal instance:', value);
      return false;
    }
    if (!value.eq(expected)) {
      console.error(`Decimal value ${value.toString()} is not equal to expected ${expected}`);
      return false;
    }
    return true;
  }
});

t('test sanitize() - array of decimals type', async () => {
  const tArr = S.ARRAY_OF_DECIMAL_TYPE;

  // array coercion and per-item sanitization
  {
    const out = s.sanitize({ value: [
        1,
        '2.5',
        'a',
        999n,
        '',
        new Date(2022, 11, 25),
        new Date(NaN),
        [],
        {},
        { a: 999 },
        Symbol(),
        [2, undefined, 2, 'a'],
        [2]
      ]
      , sanitization: tArr });
    assert(Array.isArray(out));
    assert.deepStrictEqual(out.map(/** @type {any} */ d => (d instanceof Decimal ? d.toString() : 'ERROR, NOT A DECIMAL')), [
      '1',
      '2.5',
      '0',
      '999',
      '0',
      '1671922800000',
      '0',  // invalid date
      '0',  // []
      '0',  // {}
      '0',  // { a: 999 }
      '0',  // Symbol()
      '0',  // nested array of more than one element -> force to default value 0
      '2'  // nested array of one element -> take the first element
    ]);
  }

  // scalar -> single-element array
  {
    const out = s.sanitize({ value: 999, sanitization: tArr });
    // @ts-ignore ignore missing type
    assert.deepStrictEqual(out.map(/** @type {any} */ d => (d instanceof Decimal ? d.toString() : 'ERROR, NOT A DECIMAL')), ['999']);
    const out2 = s.sanitize({ value: 'abc', sanitization: tArr });
    // @ts-ignore ignore missing type
    assert.deepStrictEqual(out2.map(/** @type {any} */ d => (d instanceof Decimal ? d.toString() : 'ERROR, NOT A DECIMAL')), ['0']);
  }

  // null/undefined -> []
  assert.deepStrictEqual(s.sanitize({ value: undefined, sanitization: tArr }), []);
  assert.deepStrictEqual(s.sanitize({ value: null, sanitization: tArr }), []);

  // optional
  {
    const tArrOpt = tArr + S.OPTIONAL;
    assert.strictEqual(s.sanitize({ value: undefined, sanitization: tArrOpt }), undefined);
    assert.strictEqual(s.sanitize({ value: null, sanitization: tArrOpt }), null);
    const out = s.sanitize({ value: '10', sanitization: tArrOpt });
    // @ts-ignore ignore missing type
    assert.deepStrictEqual(out.map(/** @type {any} */ d => (d instanceof Decimal ? d.toString() : 'ERROR, NOT A DECIMAL')), ['10']);
    const out2 = s.sanitize({ value: {}, sanitization: tArrOpt });
    // @ts-ignore ignore missing type
    assert.deepStrictEqual(out2.map(/** @type {any} */ d => (d instanceof Decimal ? d.toString() : 'ERROR, NOT A DECIMAL')), ['0']);
  }
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
  const t = validateSanitizeFunction_TestAsset;
  assert.deepStrictEqual((undefined), (s.sanitize({ value: undefined, sanitization: t })));
  assert.deepStrictEqual((null), (s.sanitize({ value: null, sanitization: t })));
  assert.deepStrictEqual((validateSanitizeFunction_TestAsset(999).sanitizedValue), (s.sanitize({ value: 999, sanitization: t })));
  assert.deepStrictEqual((validateSanitizeFunction_TestAsset(999).sanitizedValue), (s.sanitize({ value: '999', sanitization: t })));
  assert.deepStrictEqual((validateSanitizeFunction_TestAsset(0).sanitizedValue), (s.sanitize({ value: '0', sanitization: t })));
  assert.deepStrictEqual((10), (s.sanitize({ value: '', sanitization: t })));
  assert.deepStrictEqual(('abc'), (s.sanitize({ value: 'abc', sanitization: t })));
  assert.deepStrictEqual((new Date(2022, 11, 25)), (s.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));

  // sanitize + validate
  s.sanitize({ value: 0, sanitization: t, validate: true });
  s.sanitize({ value: 999, sanitization: t, validate: true });
});

t('test sanitize() - array of custom function type + validation (use the validateSanitizeFunction_TestTemp function to sanitize the value)', async () => {
  const t = [validateSanitizeFunction_TestAsset];
  assert.deepStrictEqual(([validateSanitizeFunction_TestAsset(1).sanitizedValue, validateSanitizeFunction_TestAsset(2).sanitizedValue, validateSanitizeFunction_TestAsset('a').sanitizedValue]), (s.sanitize({ value: [1, 2, 'a'], sanitization: t })));
  assert.deepStrictEqual(([]), (s.sanitize({ value: undefined, sanitization: t })));
  assert.deepStrictEqual(([]), (s.sanitize({ value: null, sanitization: t })));
  assert.deepStrictEqual(([validateSanitizeFunction_TestAsset(999).sanitizedValue]), (s.sanitize({ value: 999, sanitization: t })));
  assert.deepStrictEqual(([10]), (s.sanitize({ value: '', sanitization: t })));
  assert.deepStrictEqual((['abc']), (s.sanitize({ value: 'abc', sanitization: t })));
  assert.deepStrictEqual(([new Date(2022, 11, 25)]), (s.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));

  // sanitize + validate
  s.sanitize({ value: 999, sanitization: t, validate: true });
  s.sanitize({ value: '999', sanitization: t, validate: true });
});

