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
    assertEquals('0', S.sanitize({value: 0, sanitization: t}));
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


  await t.step("boolean type", async () => {
    const t = S.BOOLEAN_TYPE;
    assertEquals(false, S.sanitize({value: undefined, sanitization: t}));
    assertEquals(false, S.sanitize({value: null, sanitization: t}));
    assertEquals(true, S.sanitize({value: 999, sanitization: t}));
    assertEquals(false, S.sanitize({value: '', sanitization: t}));
    assertEquals(true, S.sanitize({value: 'abc', sanitization: t}));
    assertEquals(true, S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals(true, S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(true, S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("date type", async () => {
    const t = S.DATE_TYPE;
    assertEquals(new Date(0), S.sanitize({value: undefined, sanitization: t}));
    assertEquals(new Date(0), S.sanitize({value: null, sanitization: t}));
    assertEquals(new Date(Date.UTC(2022, 11, 25)), S.sanitize({value: 44920, sanitization: t}));
    assertEquals(new Date(0), S.sanitize({value: '', sanitization: t}));
    assertEquals(new Date(0), S.sanitize({value: 'abc', sanitization: t}));
    assertEquals(new Date(2022, 11, 25), S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), S.sanitize({value: '2022-12-25T00:00:00.000Z', sanitization: t}));
    assertEquals(new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), S.sanitize({value: '2022-12-25', sanitization: t}));
    assertEquals(new Date(0), S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(new Date(Date.UTC(2022, 11, 25)), S.sanitize({value: 44920, sanitization: t2}));
  });

  await t.step("array type", async () => {
    const t = S.ARRAY_TYPE;
    assertEquals([1,2,'a'], S.sanitize({value: [1,2,'a'], sanitization: t}));
    assertEquals([undefined], S.sanitize({value: undefined, sanitization: t}));
    assertEquals([null], S.sanitize({value: null, sanitization: t}));
    assertEquals([999], S.sanitize({value: 999, sanitization: t}));
    assertEquals([''], S.sanitize({value: '', sanitization: t}));
    assertEquals(['abc'], S.sanitize({value: 'abc', sanitization: t}));
    assertEquals([new Date(2022, 11, 25)], S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals([new Date(NaN)], S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals([999], S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("array of strings type", async () => {
    const t = S.ARRAY_OF_STRINGS_TYPE;
    assertEquals(['1','2','a'], S.sanitize({value: [1,2,'a'], sanitization: t}));
    assertEquals([''], S.sanitize({value: undefined, sanitization: t}));
    assertEquals([''], S.sanitize({value: null, sanitization: t}));
    assertEquals(['999'], S.sanitize({value: 999, sanitization: t}));
    assertEquals([''], S.sanitize({value: '', sanitization: t}));
    assertEquals(['abc'], S.sanitize({value: 'abc', sanitization: t}));
    assertEquals(['2022-12-24T23:00:00.000Z'], S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals([''], S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals(['','2','a'], S.sanitize({value: [undefined,2,'a'], sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(['999'], S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("array of numbers type", async () => {
    const t = S.ARRAY_OF_NUMBERS_TYPE;
    assertEquals([1,2,0], S.sanitize({value: [1,2,'a'], sanitization: t}));
    assertEquals([0], S.sanitize({value: undefined, sanitization: t}));
    assertEquals([0], S.sanitize({value: null, sanitization: t}));
    assertEquals([999], S.sanitize({value: 999, sanitization: t}));
    assertEquals([0], S.sanitize({value: '', sanitization: t}));
    assertEquals([0], S.sanitize({value: 'abc', sanitization: t}));
    assertEquals([1671922800000], S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals([0], S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals([0,2,0], S.sanitize({value: [undefined,2,'a'], sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals([999], S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("array of booleans type", async () => {
    const t = S.ARRAY_OF_BOOLEANS_TYPE;
    assertEquals([true,true,true], S.sanitize({value: [1,2,'a'], sanitization: t}));
    assertEquals([false], S.sanitize({value: undefined, sanitization: t}));
    assertEquals([false], S.sanitize({value: null, sanitization: t}));
    assertEquals([true], S.sanitize({value: 999, sanitization: t}));
    assertEquals([false], S.sanitize({value: '', sanitization: t}));
    assertEquals([true], S.sanitize({value: 'abc', sanitization: t}));
    assertEquals([true], S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals([true], S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals([false,true,true], S.sanitize({value: [undefined,2,'a'], sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals([true], S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("array of dates type", async () => {
    const t = S.ARRAY_OF_DATES_TYPE;
    assertEquals([new Date(2022, 11, 25), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))], S.sanitize({value: [new Date(2022, 11, 25),'2022-12-25T00:00:00.000Z','2022-12-25'], sanitization: t}));
    assertEquals([new Date(Date.UTC(2022, 11, 25)),new Date(Date.UTC(1975, 0, 1)),new Date(0)], S.sanitize({value: [44920, 27395,'a'], sanitization: t}));
    assertEquals([new Date(0)], S.sanitize({value: undefined, sanitization: t}));
    assertEquals([new Date(0)], S.sanitize({value: null, sanitization: t}));
    assertEquals([new Date(Date.UTC(2022, 11, 25))], S.sanitize({value: 44920, sanitization: t}));
    assertEquals([new Date(0)], S.sanitize({value: '', sanitization: t}));
    assertEquals([new Date(0)], S.sanitize({value: 'abc', sanitization: t}));
    assertEquals([new Date(2022, 11, 25)], S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
    assertEquals([new Date(0)], S.sanitize({value: new Date(NaN), sanitization: t}));

    const t2 = t + '?';
    assertEquals([new Date(0), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)), new Date(Date.UTC(2022, 11, 25, 0, 0, 0))], S.sanitize({value: [undefined,'2022-12-25T00:00:00.000Z','2022-12-25'], sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals([new Date(Date.UTC(2022, 11, 25))], S.sanitize({value: 44920, sanitization: t2}));
    assertEquals([new Date(2022, 11, 25)], S.sanitize({value: new Date(2022, 11, 25), sanitization: t}));
  });

  await t.step("object type", async () => {
    const t = S.OBJECT_TYPE;
    const obj = {a: 1, b: 2, c:'a'};
    assertEquals(obj, S.sanitize({value: obj, sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t}));
    assertEquals(null, S.sanitize({value: null, sanitization: t}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t}));
    assertEquals('abc', S.sanitize({value: 'abc', sanitization: t}));

    const t2 = t + '?';
    assertEquals(obj, S.sanitize({value: obj, sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("function/class type", async () => {

    class TestClass {
      /**
       * @param {{value: string, value2: string}} p
       */
      constructor({value, value2}) {
        this.value = value;
        this.value2 = value2;
      }
    }

    const t = S.FUNCTION_TYPE;
    const obj = TestClass;
    assertEquals(obj, S.sanitize({value: obj, sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t}));
    assertEquals(null, S.sanitize({value: null, sanitization: t}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t}));
    assertEquals('abc', S.sanitize({value: 'abc', sanitization: t}));

    const t2 = t + '?';
    assertEquals(obj, S.sanitize({value: obj, sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t2}));
  });

  await t.step("symbol type", async () => {
    const t = S.SYMBOL_TYPE;
    const obj = Symbol();
    assertEquals(obj, S.sanitize({value: obj, sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t}));
    assertEquals(null, S.sanitize({value: null, sanitization: t}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t}));
    assertEquals('abc', S.sanitize({value: 'abc', sanitization: t}));

    const t2 = t + '?';
    assertEquals(obj, S.sanitize({value: obj, sanitization: t}));
    assertEquals(undefined, S.sanitize({value: undefined, sanitization: t2}));
    assertEquals(null, S.sanitize({value: null, sanitization: t2}));
    assertEquals(999, S.sanitize({value: 999, sanitization: t2}));
  });
});
