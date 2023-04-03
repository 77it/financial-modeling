import { Big } from '../../src/deps.js';
import * as S from '../../src/lib/sanitization_utils.js';
import * as V from '../../src/lib/validation_utils.js';

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from '../deps.js';

Deno.test('test sanitization lib const definition', async (t) => {
  assertEquals(S.ANY_TYPE, V.ANY_TYPE);
  assertEquals(S.STRING_TYPE, V.STRING_TYPE);
  assertEquals(S.NUMBER_TYPE, V.NUMBER_TYPE);
  assertEquals(S.BOOLEAN_TYPE, V.BOOLEAN_TYPE);
  assertEquals(S.DATE_TYPE, V.DATE_TYPE);
  assertEquals(S.ARRAY_TYPE, V.ARRAY_TYPE);
  assertEquals(S.ARRAY_OF_STRINGS_TYPE, V.ARRAY_OF_STRINGS_TYPE);
  assertEquals(S.ARRAY_OF_NUMBERS_TYPE, V.ARRAY_OF_NUMBERS_TYPE);
  assertEquals(S.ARRAY_OF_BOOLEANS_TYPE, V.ARRAY_OF_BOOLEANS_TYPE);
  assertEquals(S.ARRAY_OF_DATES_TYPE, V.ARRAY_OF_DATES_TYPE);
  assertEquals(S.ARRAY_OF_OBJECTS_TYPE, V.ARRAY_OF_OBJECTS_TYPE);
  assertEquals(S.OBJECT_TYPE, V.OBJECT_TYPE);
  assertEquals(S.FUNCTION_TYPE, V.FUNCTION_TYPE);
  assertEquals(S.SYMBOL_TYPE, V.SYMBOL_TYPE);
  assertEquals(S.BIGINT_TYPE, V.BIGINT_TYPE);
  assertEquals(S.BIGINT_NUMBER_TYPE, V.BIGINT_NUMBER_TYPE);
  assertEquals(S.ARRAY_OF_BIGINT_TYPE, V.ARRAY_OF_BIGINT_TYPE);
  assertEquals(S.ARRAY_OF_BIGINT_NUMBER_TYPE, V.ARRAY_OF_BIGINT_NUMBER_TYPE);
});

Deno.test('test sanitize()', async (t) => {
  await t.step('test default options', async () => {
    S.resetOptions();

    if (S.OPTIONS.DATE_UTC !== false)
      throw new Error('default S.OPTIONS.DATE_UTC must be false');

    if (S.OPTIONS.NUMBER_TO_DATE !== S.NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE)
      throw new Error('default S.OPTIONS.NUMBER_TO_DATE must be S.NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE');
  });

  await t.step('test wrong/unknown options', async () => {
    assertThrows(() => S.sanitize({ value: 'aaaX', sanitization: 'wrong sanitization type' }));
  });

  await t.step('any type', async () => {
    const t = S.ANY_TYPE;
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t }));
    assertEquals([999], S.sanitize({ value: [999], sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([999], S.sanitize({ value: [999], sanitization: t2 }));
  });

  await t.step('string type', async () => {
    const t = S.STRING_TYPE;
    assertEquals('', S.sanitize({ value: undefined, sanitization: t }));
    assertEquals('', S.sanitize({ value: null, sanitization: t }));
    assertEquals('0', S.sanitize({ value: 0, sanitization: t }));
    assertEquals('999', S.sanitize({ value: 999, sanitization: t }));
    assertEquals('', S.sanitize({ value: '', sanitization: t }));
    assertEquals('', S.sanitize({ value: '    ', sanitization: t }));  // whitespaces are trimmed
    assertEquals('abc', S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals('2022-12-24T23:00:00.000Z', S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals('', S.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals('true', S.sanitize({ value: true, sanitization: t }));
    assertEquals('false', S.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals('999', S.sanitize({ value: 999, sanitization: t2 }));
    assertEquals('', S.sanitize({ value: '    ', sanitization: t2 }));  // whitespaces are trimmed
    assertEquals('true', S.sanitize({ value: true, sanitization: t2 }));
    assertEquals('false', S.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('number type + validation', async () => {
    const t = S.NUMBER_TYPE;
    assertEquals(0, S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(0, S.sanitize({ value: null, sanitization: t }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t }));
    assertEquals(0, S.sanitize({ value: '', sanitization: t }));
    assertEquals(0, S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(1671922800000, S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(0, S.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(1, S.sanitize({ value: true, sanitization: t }));
    assertEquals(0, S.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t2 }));
    assertEquals(1, S.sanitize({ value: true, sanitization: t2 }));
    assertEquals(0, S.sanitize({ value: false, sanitization: t2 }));

    assertEquals(S.sanitize({ value: '999', sanitization: S.NUMBER_TYPE, validate: true }), 999);
    assertEquals(S.sanitize({ value: '999', sanitization: S.NUMBER_TYPE + '?', validate: true }), 999);
    assertEquals(S.sanitize({ value: undefined, sanitization: S.NUMBER_TYPE + '?', validate: true }), undefined);
  });

  await t.step('boolean type', async () => {
    const t = S.BOOLEAN_TYPE;
    assertEquals(false, S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(false, S.sanitize({ value: null, sanitization: t }));
    assertEquals(true, S.sanitize({ value: 999, sanitization: t }));
    assertEquals(false, S.sanitize({ value: '', sanitization: t }));
    assertEquals(true, S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(true, S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(true, S.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(true, S.sanitize({ value: true, sanitization: t }));
    assertEquals(false, S.sanitize({ value: false, sanitization: t }));
    assertEquals(true, S.sanitize({ value: 'true', sanitization: t }));
    assertEquals(true, S.sanitize({ value: 'false', sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(true, S.sanitize({ value: 999, sanitization: t2 }));
    assertEquals(true, S.sanitize({ value: true, sanitization: t2 }));
    assertEquals(false, S.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('date type, with OPTIONS.DATE_UTC = true (UTC Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
    S.OPTIONS.DATE_UTC = true;  // set sanitization option to UTC date

    const t = S.DATE_TYPE;
    assertEquals(new Date(0), S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: null, sanitization: t }));
    assertEquals(new Date(Date.UTC(2022, 11, 25)), S.sanitize({ value: 44920, sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: '', sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), S.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t }));
    assertEquals(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), S.sanitize({ value: '2022-12-25', sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(new Date(1), S.sanitize({ value: true, sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(new Date(Date.UTC(2022, 11, 25)), S.sanitize({ value: 44920, sanitization: t2 }));
    assertEquals(new Date(1), S.sanitize({ value: true, sanitization: t2 }));
    assertEquals(new Date(0), S.sanitize({ value: false, sanitization: t2 }));

    S.resetOptions();
  });

  await t.step('date type, with default OPTIONS.DATE_UTC = false (local Date), default OPTIONS.NUMBER_TO_DATE = OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
    S.resetOptions();

    const t = S.DATE_TYPE;
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: 44920, sanitization: t }));
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25', sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: new Date(NaN), sanitization: t }));
    assertEquals(new Date(1), S.sanitize({ value: true, sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: false, sanitization: t }));

    const t2 = t + '?';
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: 44920, sanitization: t2 }));
    assertEquals(new Date(1), S.sanitize({ value: true, sanitization: t2 }));
    assertEquals(new Date(0), S.sanitize({ value: false, sanitization: t2 }));
  });

  await t.step('date type with option number To Date OPTION__NUMBER_TO_DATE__JS_SERIAL_DATE', async () => {
    S.OPTIONS.NUMBER_TO_DATE = S.NUMBER_TO_DATE_OPTS.JS_SERIAL_DATE;

    const t = S.DATE_TYPE;
    assertEquals(new Date(44920), S.sanitize({ value: 44920, sanitization: t }));

    const t2 = t + '?';
    assertEquals(new Date(44920), S.sanitize({ value: 44920, sanitization: t2 }));

    S.resetOptions();
  });

  await t.step('date type with option number To Date OPTION__NUMBER_TO_DATE__NO_CONVERSION', async () => {
    S.OPTIONS.NUMBER_TO_DATE = S.NUMBER_TO_DATE_OPTS.NO_CONVERSION;

    const t = S.DATE_TYPE;
    assertEquals(new Date(0), S.sanitize({ value: 44920, sanitization: t }));

    const t2 = t + '?';
    assertEquals(new Date(0), S.sanitize({ value: 44920, sanitization: t2 }));

    S.resetOptions();
  });

  await t.step('array (enum) type + validation', async () => {
    assertEquals(999, S.sanitize({ value: 999, sanitization: [] }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: [11, 22, 999, 55] }));
    assertEquals('aaa', S.sanitize({ value: 'aaa', sanitization: [11, 'aa', 'aaa', 55] }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: [11, undefined, 'aa', 'aaa', 55], validate: true }));
    assertThrows(() => S.sanitize({ value: 'aaaX', sanitization: [11, 'aa', 'aaa', 55], validate: true }));
  });

  await t.step('array type', async () => {
    const t = S.ARRAY_TYPE;
    assertEquals([1, 2, 'a'], S.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([undefined], S.sanitize({ value: undefined, sanitization: t }));
    assertEquals([null], S.sanitize({ value: null, sanitization: t }));
    assertEquals([999], S.sanitize({ value: 999, sanitization: t }));
    assertEquals([''], S.sanitize({ value: '', sanitization: t }));
    assertEquals(['abc'], S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([new Date(2022, 11, 25)], S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([new Date(NaN)], S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals([999], S.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('array of strings type', async () => {
    const t = S.ARRAY_OF_STRINGS_TYPE;
    assertEquals(['1', '2', 'a'], S.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([''], S.sanitize({ value: undefined, sanitization: t }));
    assertEquals([''], S.sanitize({ value: null, sanitization: t }));
    assertEquals(['999'], S.sanitize({ value: 999, sanitization: t }));
    assertEquals([''], S.sanitize({ value: '', sanitization: t }));
    assertEquals(['abc'], S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(['2022-12-24T23:00:00.000Z'], S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([''], S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(['', '2', 'a'], S.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(['999'], S.sanitize({ value: 999, sanitization: t2 }));
    assertEquals([''], S.sanitize({ value: '', sanitization: t2 }));
  });

  await t.step('array of numbers type', async () => {
    const t = S.ARRAY_OF_NUMBERS_TYPE;
    assertEquals([1, 2, 0], S.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([0], S.sanitize({ value: undefined, sanitization: t }));
    assertEquals([0], S.sanitize({ value: null, sanitization: t }));
    assertEquals([999], S.sanitize({ value: 999, sanitization: t }));
    assertEquals([0], S.sanitize({ value: '', sanitization: t }));
    assertEquals([0], S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([1671922800000], S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([0], S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals([0, 2, 0], S.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals([999], S.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('array of booleans type', async () => {
    const t = S.ARRAY_OF_BOOLEANS_TYPE;
    assertEquals([true, true, true], S.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([false], S.sanitize({ value: undefined, sanitization: t }));
    assertEquals([false], S.sanitize({ value: null, sanitization: t }));
    assertEquals([true], S.sanitize({ value: 999, sanitization: t }));
    assertEquals([false], S.sanitize({ value: '', sanitization: t }));
    assertEquals([true], S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([true], S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([true], S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals([false, true, true], S.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals([true], S.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('array of dates type', async () => {
    S.OPTIONS.DATE_UTC = true;  // set sanitization option to UTC date

    const t = S.ARRAY_OF_DATES_TYPE;
    assertEquals(
      [new Date(2022, 11, 25), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))],
      S.sanitize({
        value: [new Date(2022, 11, 25), '2022-12-25T00:00:00.000Z', '2022-12-25'],
        sanitization: t
      }));
    assertEquals([new Date(Date.UTC(2022, 11, 25)), new Date(Date.UTC(1975, 0, 1)), new Date(0)], S.sanitize({
      value: [44920, 27395, 'a'],
      sanitization: t
    }));
    assertEquals([new Date(0)], S.sanitize({ value: undefined, sanitization: t }));
    assertEquals([new Date(0)], S.sanitize({ value: null, sanitization: t }));
    assertEquals([new Date(Date.UTC(2022, 11, 25))], S.sanitize({ value: 44920, sanitization: t }));
    assertEquals([new Date(0)], S.sanitize({ value: '', sanitization: t }));
    assertEquals([new Date(0)], S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([new Date(2022, 11, 25)], S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([new Date(0)], S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals([new Date(0), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))], S.sanitize({
      value: [undefined, '2022-12-25T00:00:00.000Z', '2022-12-25'],
      sanitization: t2
    }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals([new Date(Date.UTC(2022, 11, 25))], S.sanitize({ value: 44920, sanitization: t2 }));
    assertEquals([new Date(2022, 11, 25)], S.sanitize({ value: new Date(2022, 11, 25), sanitization: t2 }));

    S.resetOptions();
  });

  await t.step('object type', async () => {
    const t = S.OBJECT_TYPE;
    const obj = { a: 1, b: 2, c: 'a' };
    assertEquals(obj, S.sanitize({ value: obj, sanitization: t }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t }));
    assertEquals('abc', S.sanitize({ value: 'abc', sanitization: t }));

    const t2 = t + '?';
    assertEquals(obj, S.sanitize({ value: obj, sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t2 }));
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
    assertEquals(obj, S.sanitize({ value: obj, sanitization: t }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t }));
    assertEquals('abc', S.sanitize({ value: 'abc', sanitization: t }));

    const t2 = t + '?';
    assertEquals(obj, S.sanitize({ value: obj, sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('symbol type', async () => {
    const t = S.SYMBOL_TYPE;
    const obj = Symbol();
    assertEquals(obj, S.sanitize({ value: obj, sanitization: t }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t }));
    assertEquals('abc', S.sanitize({ value: 'abc', sanitization: t }));

    const t2 = t + '?';
    assertEquals(obj, S.sanitize({ value: obj, sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('bigint type + validation', async () => {
    const t = S.BIGINT_TYPE;
    assertEquals(BigInt(0), S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: null, sanitization: t }));
    assertEquals(BigInt(999), S.sanitize({ value: 999, sanitization: t }));
    assertEquals(BigInt(999), S.sanitize({ value: '999', sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: '0', sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: '', sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(BigInt(new Date(2022, 11, 25).getTime()), S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(BigInt(999), S.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    S.sanitize({ value: 0, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('bigint number type + validation', async () => {
    const t = S.BIGINT_NUMBER_TYPE;
    assertEquals(BigInt(0), S.sanitize({ value: undefined, sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: null, sanitization: t }));
    assertEquals(BigInt(999), S.sanitize({ value: 999, sanitization: t }));
    assertEquals(BigInt(999), S.sanitize({ value: '999', sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: '0', sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: '', sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals(BigInt(new Date(2022, 11, 25).getTime()), S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(BigInt(0), S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(BigInt(999), S.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    S.sanitize({ value: 0, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('array of bigint type + validation', async () => {
    const t = S.ARRAY_OF_BIGINT_TYPE;
    assertEquals([BigInt(1), BigInt(2), BigInt(0)], S.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: undefined, sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: null, sanitization: t }));
    assertEquals([BigInt(999)], S.sanitize({ value: 999, sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: '', sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([BigInt(new Date(2022, 11, 25).getTime())],   S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals([BigInt(0), BigInt(2), BigInt(0)], S.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals([BigInt(999)], S.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    S.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
    S.sanitize({ value: undefined, sanitization: t, validate: true });
    S.sanitize({ value: null, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('array of bigint number type + validation', async () => {
    const t = S.ARRAY_OF_BIGINT_NUMBER_TYPE;
    assertEquals([BigInt(1), BigInt(2), BigInt(0)], S.sanitize({ value: [1, 2, 'a'], sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: undefined, sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: null, sanitization: t }));
    assertEquals([BigInt(999)], S.sanitize({ value: 999, sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: '', sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals([BigInt(new Date(2022, 11, 25).getTime())],   S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals([BigInt(0)],   S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals([BigInt(0), BigInt(2), BigInt(0)], S.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 }));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals([BigInt(999)], S.sanitize({ value: 999, sanitization: t2 }));

    // sanitize + validate
    S.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
    S.sanitize({ value: undefined, sanitization: t, validate: true });
    S.sanitize({ value: null, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('big.js type + validation', async () => {
    const t = Big;
    assertEquals(JSON.stringify(undefined), JSON.stringify(S.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify(null), JSON.stringify(S.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: '999', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: '0', sanitization: t })));
    assertEquals(JSON.stringify(''), JSON.stringify(S.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify('abc'), JSON.stringify(S.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify(new Date(2022, 11, 25)), JSON.stringify(S.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify(new Date(NaN)), JSON.stringify(S.sanitize({ value: new Date(NaN), sanitization: t })));

    // sanitize + validate
    S.sanitize({ value: 0, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
  });

  await t.step('array of big.js type + validation', async () => {
    const t = [Big];
    assertEquals(JSON.stringify([new Big(1), new Big(2), 'a']), JSON.stringify(S.sanitize({ value: [1, 2, 'a'], sanitization: t })));
    assertEquals(JSON.stringify([undefined]), JSON.stringify(S.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify([null]), JSON.stringify(S.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify([new Big(999)]), JSON.stringify(S.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify(['']), JSON.stringify(S.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify(['abc']), JSON.stringify(S.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify([new Date(2022, 11, 25)]), JSON.stringify(S.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify([new Date(NaN)]), JSON.stringify(S.sanitize({ value: new Date(NaN), sanitization: t })));

    // sanitize + validate
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: '999', sanitization: t, validate: true });
  });
});
