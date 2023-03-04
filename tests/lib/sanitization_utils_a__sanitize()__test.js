import { Big } from '../../src/deps.js';
import * as S from '../../src/lib/sanitization_utils.js';

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from '../deps.js';

Deno.test('test sanitize()', async (t) => {
  // set sanitization option to UTC date
  S.OPTIONS.DATE_UTC = true;

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
    assertEquals('abc', S.sanitize({ value: 'abc', sanitization: t }));
    assertEquals('2022-12-24T23:00:00.000Z', S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals('', S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals('999', S.sanitize({ value: 999, sanitization: t2 }));
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

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(999, S.sanitize({ value: 999, sanitization: t2 }));

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

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(true, S.sanitize({ value: 999, sanitization: t2 }));
  });

  await t.step('date type with default option number To UTC Date (OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
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

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(new Date(Date.UTC(2022, 11, 25)), S.sanitize({ value: 44920, sanitization: t2 }));
  });

  await t.step('date type with default option number To local Date (OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE)', async () => {
    // set sanitization option to local date
    S.OPTIONS.DATE_UTC = false;

    const t = S.DATE_TYPE;
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: 44920, sanitization: t }));
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: new Date(2022, 11, 25), sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25T00:00:00.000Z', sanitization: t }));
    assertEquals(new Date(2022, 11, 25, 0, 0, 0), S.sanitize({ value: '2022-12-25', sanitization: t }));
    assertEquals(new Date(0), S.sanitize({ value: new Date(NaN), sanitization: t }));

    const t2 = t + '?';
    assertEquals(new Date(2022, 11, 25), S.sanitize({ value: 44920, sanitization: t2 }));

    // reset sanitization option to UTC date
    S.OPTIONS.DATE_UTC = true;
  });

  await t.step('date type with option number To Date OPTION__NUMBER_TO_DATE__JS_SERIAL_DATE', async () => {
    S.OPTIONS.NUMBER_TO_DATE = S.NUMBER_TO_DATE_OPTS.JS_SERIAL_DATE;

    const t = S.DATE_TYPE;
    assertEquals(new Date(44920), S.sanitize({ value: 44920, sanitization: t }));

    const t2 = t + '?';
    assertEquals(new Date(44920), S.sanitize({ value: 44920, sanitization: t2 }));
  });

  await t.step('date type with option number To Date OPTION__NUMBER_TO_DATE__NO_CONVERSION', async () => {
    S.OPTIONS.NUMBER_TO_DATE = S.NUMBER_TO_DATE_OPTS.NO_CONVERSION;

    const t = S.DATE_TYPE;
    assertEquals(new Date(0), S.sanitize({ value: 44920, sanitization: t }));

    const t2 = t + '?';
    assertEquals(new Date(0), S.sanitize({ value: 44920, sanitization: t2 }));
  });

  await t.step('resetting option number To Date to OPTION__NUMBER_TO_DATE__EXCEL_1900_SERIAL_DATE', async () => {
    S.OPTIONS.NUMBER_TO_DATE = S.NUMBER_TO_DATE_OPTS.EXCEL_1900_SERIAL_DATE;
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
    const t = S.ARRAY_OF_DATES_TYPE;
    assertEquals(
      [new Date(2022, 11, 25), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))],
      S.sanitize({
        value: [new Date(2022, 11, 25), '2022-12-25T00:00:00.000Z', '2022-12-25'],
        sanitization: t
      }));
    assertEquals([new Date(Date.UTC(2022, 11, 25)), new Date(Date.UTC(1975, 0, 1)), new Date(0)], S.sanitize({ value: [44920, 27395, 'a'], sanitization: t }));
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

  await t.step('big.js type + validation', async () => {
    const t = S.BIGJS_TYPE;
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: '999', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: '0', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: new Date(NaN), sanitization: t })));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: 999, sanitization: t2 })));

    // sanitize + validate
    S.sanitize({ value: 0, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('big.js number type + validation', async () => {
    const t = S.BIGJS_NUMBER_TYPE;
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: '999', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: '0', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify(new Big(0)), JSON.stringify(S.sanitize({ value: new Date(NaN), sanitization: t })));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(JSON.stringify(new Big(999)), JSON.stringify(S.sanitize({ value: 999, sanitization: t2 })));

    // sanitize + validate
    S.sanitize({ value: 0, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('array of big.js type + validation', async () => {
    const t = S.ARRAY_OF_BIGJS_TYPE;
    assertEquals(JSON.stringify([new Big(1), new Big(2), new Big(0)]), JSON.stringify(S.sanitize({ value: [1, 2, 'a'], sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify([new Big(999)]), JSON.stringify(S.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: new Date(NaN), sanitization: t })));

    const t2 = t + '?';
    assertEquals(JSON.stringify([new Big(0), new Big(2), new Big(0)]), JSON.stringify(S.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 })));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(JSON.stringify([new Big(999)]), JSON.stringify(S.sanitize({ value: 999, sanitization: t2 })));

    // sanitize + validate
    S.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
    S.sanitize({ value: undefined, sanitization: t, validate: true });
    S.sanitize({ value: null, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });

  await t.step('array of big.js number type + validation', async () => {
    const t = S.ARRAY_OF_BIGJS_NUMBER_TYPE;
    assertEquals(JSON.stringify([new Big(1), new Big(2), new Big(0)]), JSON.stringify(S.sanitize({ value: [1, 2, 'a'], sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: undefined, sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: null, sanitization: t })));
    assertEquals(JSON.stringify([new Big(999)]), JSON.stringify(S.sanitize({ value: 999, sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: '', sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: 'abc', sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: new Date(2022, 11, 25), sanitization: t })));
    assertEquals(JSON.stringify([new Big(0)]), JSON.stringify(S.sanitize({ value: new Date(NaN), sanitization: t })));

    const t2 = t + '?';
    assertEquals(JSON.stringify([new Big(0), new Big(2), new Big(0)]), JSON.stringify(S.sanitize({ value: [undefined, 2, 'a'], sanitization: t2 })));
    assertEquals(undefined, S.sanitize({ value: undefined, sanitization: t2 }));
    assertEquals(null, S.sanitize({ value: null, sanitization: t2 }));
    assertEquals(JSON.stringify([new Big(999)]), JSON.stringify(S.sanitize({ value: 999, sanitization: t2 })));

    // sanitize + validate
    S.sanitize({ value: [undefined, 2, 'a'], sanitization: t, validate: true });
    S.sanitize({ value: undefined, sanitization: t, validate: true });
    S.sanitize({ value: null, sanitization: t, validate: true });
    S.sanitize({ value: 999, sanitization: t, validate: true });
    S.sanitize({ value: 'aaa', sanitization: t, validate: true });
  });
});
