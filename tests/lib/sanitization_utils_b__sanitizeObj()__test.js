import * as S from '../../src/lib/sanitization_utils.js';
import { parseJsonDate, excelSerialDateToUTCDate, excelSerialDateToDate } from '../../src/lib/date_utils.js';

// from https://github.com/MikeMcl/big.js/ & https://www.npmjs.com/package/big.js   // backup in https://github.com/77it/big.js
// @deno-types="https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/big.js/index.d.ts"
import { Big } from 'https://cdn.jsdelivr.net/npm/big.js@6.2.1/big.min.mjs';

import {
  assert,
  assertEquals,
  assertNotEquals,
  assertFalse,
  assertThrows,
} from '../deps.js';

Deno.test('test sanitizeObj()', async (t) => {
  await t.step('null, undefined and other non-objects are coerced to {}', async () => {
    const sanitization = { a: S.STRING_TYPE, b: S.NUMBER_TYPE };
    assertEquals(S.sanitizeObj({ obj: null, sanitization: sanitization }), {});
    assertEquals(S.sanitizeObj({ obj: undefined, sanitization: sanitization }), {});
    assertEquals(S.sanitizeObj({ obj: 999, sanitization: sanitization }), {});
    assertEquals(S.sanitizeObj({ obj: Symbol(), sanitization: sanitization }), {});
  });

  await t.step('class: class Type is coerced to {}, class instance is object and sanitized normally', async () => {
    class TestClass {
      /**
       * @param {{a: string, b: string}} p
       */
      constructor ({ a, b }) {
        this.a = a;
        this.b = b;
      }
    }

    const testClassInstance = new TestClass({ a: '0', b: '99' });
    const sanitization = { a: S.STRING_TYPE, b: S.NUMBER_TYPE };

    // class Type is coerced to {}
    assertEquals(S.sanitizeObj({ obj: TestClass, sanitization: sanitization }), {});

    // class instance is object and sanitized normally
    assertEquals(
      JSON.stringify(S.sanitizeObj({ obj: testClassInstance, sanitization: sanitization, validate: true })),
      JSON.stringify({ a: '0', b: 99 })
    );
  });

  await t.step('FAILING can\'t sanitize single part of an object, only the entire object (can\'t sanitize a deconstructed object)', async () => {
    const a = '0';
    const b = '99';
    const expObj = { a: 0, b: 99 };
    const sanitization = { a: S.NUMBER_TYPE, b: S.NUMBER_TYPE };
    /* `a` `b` are not sanitized */
    S.sanitizeObj({ obj: { a, b }, sanitization: sanitization });
    /* FAILS */
    // @ts-ignore
    assertNotEquals({ a, b }, expObj);

    // to sanitize object parameters, there are two ways, construct another object or save the returned object
    //
    // 1. construct another object
    const _p1 = { a, b };
    S.sanitizeObj({ obj: _p1, sanitization: sanitization });
    // @ts-ignore
    assertEquals(_p1, expObj);
    // 2. save the returned object
    const _p2 = S.sanitizeObj({ obj: { a, b }, sanitization: sanitization });
    assertEquals(_p2, expObj);

  });

  await t.step('simple object', async () => {
    const objToSanitize = { a: 'mamma', b: 99 };
    const expObj = { a: 'mamma', b: 99 };
    const sanitization = { a: S.STRING_TYPE, b: S.NUMBER_TYPE };
    assertEquals(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization }), expObj);
  });

  await t.step('`any` type', async () => {
    const objToSanitize = { a: undefined, b: null, c: 99 };
    const expObj = { a: undefined, b: null, c: 99 };
    const sanitization = { a: S.ANY_TYPE, b: S.ANY_TYPE, c: S.NUMBER_TYPE };
    assertEquals(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization }), expObj);
  });

  await t.step('complex type, local date', async () => {
    const objToSanitize = {
      date: '1999-12-31T23:59:59',
      date2: '1999-12-31',
      date3: '2022-12-25T00:00:00.000Z',
      date4_fromExcelSerialDate: 44920,
      arrDate: ['1999-12-31T23:59:59', new Date('2020-12-31T23:59:59')],
      arrDate2: '1999-12-31T23:59:59',
    };

    const expObj = {
      date: parseJsonDate('1999-12-31T23:59:59', { asUTC: false }),
      date2: parseJsonDate('1999-12-31', { asUTC: false }),
      date3: parseJsonDate('2022-12-25T00:00:00.000Z', { asUTC: false }),
      date4_fromExcelSerialDate: excelSerialDateToDate(44920),
      arrDate: [parseJsonDate('1999-12-31T23:59:59', { asUTC: false }), new Date('2020-12-31T23:59:59')],
      arrDate2: [parseJsonDate('1999-12-31T23:59:59', { asUTC: false })],
      extraValueMissingRequiredDate: new Date(0),
    };

    const sanitization = {
      date: S.DATE_TYPE,
      date2: S.DATE_TYPE,
      date3: S.DATE_TYPE,
      date4_fromExcelSerialDate: S.DATE_TYPE,
      arrDate: S.ARRAY_OF_DATES_TYPE,
      arrDate2: S.ARRAY_OF_DATES_TYPE,
      extraValueMissingRequiredDate: S.DATE_TYPE,
    };

    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization })), JSON.stringify(expObj));

    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, validate: true })), JSON.stringify(expObj));
  });

  await t.step('complex type + validate=true test', async () => {
    const options = { dateUTC: true };

    const _fun = () => {console.log('mamma');};
    const _sym = Symbol();

    const objToSanitize = {
      str: 999,
      num: '123',
      bool: 0,
      date: '1999-12-31T23:59:59',
      date2: '1999-12-31',
      date3: '2022-12-25T00:00:00.000Z',
      date4_fromExcelSerialDate: 44920,
      enum: 'mamma',
      arr: 999,
      arrStr: [0, 'b'],
      arrStr2: 0,
      arrNum: ['99', '0', 55],
      arrNum2: '99',
      arrDate: ['1999-12-31T23:59:59', new Date('2020-12-31T23:59:59')],
      arrDate2: '1999-12-31T23:59:59',
      arrBool: [0, 'a'],
      arrBool2: 0,
      arrBoolEmpty: [],
      arrObj: [{ a: 0 }, { b: 'b' }],
      arrObj2: { a: 0 },
      obj: { a: 999 },
      fun: _fun,
      any: 999,
      symbol: _sym,
      bigInt: 10,
      bigInt_number: 10,
      arrBigInt: [10, '9', 0],
      arrBigInt_number: [10, '9', 0],
      big_js: 10,
      arrBig_js: [10, '9', 0],
    };

    const expObj = {
      str: '999',
      num: 123,
      bool: false,
      date: parseJsonDate('1999-12-31T23:59:59'),
      date2: parseJsonDate('1999-12-31'),
      date3: parseJsonDate('2022-12-25T00:00:00.000Z'),
      date4_fromExcelSerialDate: excelSerialDateToUTCDate(44920),
      enum: 'mamma',
      arr: [999],
      arrStr: ['0', 'b'],
      arrStr2: ['0'],
      arrNum: [99, 0, 55],
      arrNum2: [99],
      arrDate: [parseJsonDate('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59')],
      arrDate2: [parseJsonDate('1999-12-31T23:59:59')],
      arrBool: [false, true],
      arrBool2: [false],
      arrBoolEmpty: [],
      arrObj: [{ a: 0 }, { b: 'b' }],
      arrObj2: [{ a: 0 }],
      obj: { a: 999 },
      fun: _fun,
      any: 999,
      symbol: _sym,
      bigInt: BigInt(10),
      bigInt_number: BigInt(10),
      arrBigInt: [BigInt(10), BigInt(9), BigInt(0)],
      arrBigInt_number: [BigInt(10), BigInt(9), BigInt(0)],
      big_js: new Big(10),
      arrBig_js: [new Big(10), new Big(9), Big(0)],
      extraValueMissingRequiredStr: '',
      extraValueMissingRequiredNum: 0,
      extraValueMissingRequiredBool: false,
      extraValueMissingRequiredDate: new Date(0),
    };

    const sanitization = {
      str: S.STRING_TYPE,
      num: S.NUMBER_TYPE,
      bool: S.BOOLEAN_TYPE,
      date: S.DATE_TYPE,
      date2: S.DATE_TYPE,
      date3: S.DATE_TYPE,
      date4_fromExcelSerialDate: S.DATE_TYPE,
      enum: ['mamma', 'pappa'],
      arr: S.ARRAY_TYPE,
      arrStr: S.ARRAY_OF_STRINGS_TYPE,
      arrStr2: S.ARRAY_OF_STRINGS_TYPE,
      arrNum: S.ARRAY_OF_NUMBERS_TYPE,
      arrNum2: S.ARRAY_OF_NUMBERS_TYPE,
      arrDate: S.ARRAY_OF_DATES_TYPE,
      arrDate2: S.ARRAY_OF_DATES_TYPE,
      arrBool: S.ARRAY_OF_BOOLEANS_TYPE,
      arrBool2: S.ARRAY_OF_BOOLEANS_TYPE,
      arrBoolEmpty: S.ARRAY_OF_BOOLEANS_TYPE,
      arrObj: S.ARRAY_OF_OBJECTS_TYPE,
      arrObj2: S.ARRAY_OF_OBJECTS_TYPE,
      obj: S.OBJECT_TYPE,
      fun: S.FUNCTION_TYPE,
      symbol: S.SYMBOL_TYPE,
      bigInt: S.BIGINT_TYPE,
      bigInt_number: S.BIGINT_NUMBER_TYPE,
      arrBigInt: S.ARRAY_OF_BIGINT_TYPE,
      arrBigInt_number: S.ARRAY_OF_BIGINT_NUMBER_TYPE,
      big_js: Big,
      arrBig_js: [Big],
      any: S.ANY_TYPE,
      extraValueMissingRequiredStr: S.STRING_TYPE,
      extraValueMissingRequiredNum: S.NUMBER_TYPE,
      extraValueMissingRequiredBool: S.BOOLEAN_TYPE,
      extraValueMissingRequiredDate: S.DATE_TYPE,
      extraValueMissingNotRequired: S.STRING_TYPE + '?'
    };

    // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
    //@ts-ignore
    const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;

    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj, replacer));

    assertEquals(JSON.stringify(S.sanitizeObj({
      obj: objToSanitize,
      sanitization: sanitization,
      validate: true,
      options
    }), replacer), JSON.stringify(expObj, replacer));
  });

  await t.step('enum type', async () => {
    // test undefined with enum type
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: {}, sanitization: { a: [11, undefined, 'aa', 'aaa', 55] }, validate: true })), JSON.stringify({}));

    // test enum type
    assertThrows(() => S.sanitizeObj({ obj: { a: 999 }, sanitization: { a: [11, 'aa', 'aaa', 55] }, validate: true }));
  });

  await t.step('custom sanitization for string, number, date, bigint', async () => {
    const options = {
      defaultString: 'mamma',
      defaultNumber: 999,
      defaultDate: new Date('2025-12-31'),
      defaultBigInt: BigInt(999),
    };

    const expObj = {
      str: 'mamma',
      num: 999,
      date: new Date('2025-12-31'),
      bigInt: BigInt(999),
      bigInt_number: BigInt(999)
    };

    const expObj_0 = {
      str: '0',
      num: 0,
      date: excelSerialDateToDate(0),
      bigInt: BigInt(0),
      bigInt_number: BigInt(0)
    };

    const expObj_EmptyStr = {
      str: '',
      num: 0,
      date: new Date('2025-12-31'),
      bigInt: BigInt(0),
      bigInt_number: BigInt(0)
    };

    const expObj_0Str = {
      str: '0',
      num: 0,
      date: new Date('2025-12-31'),
      bigInt: BigInt(0),
      bigInt_number: BigInt(0)
    };

    const sanitization = {
      str: S.STRING_TYPE,
      num: S.NUMBER_TYPE,
      date: S.DATE_TYPE,
      bigInt: S.BIGINT_TYPE,
      bigInt_number: S.BIGINT_NUMBER_TYPE,
    };

    // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
    //@ts-ignore
    const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;

    let wrongValue = null;
    let objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj, replacer));

    wrongValue = undefined;
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj, replacer));

    wrongValue = { ciao: 999 };
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj, replacer));

    wrongValue = NaN;
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj, replacer));

    wrongValue = 0;
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj_0, replacer));

    wrongValue = -0;
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj_0, replacer));

    wrongValue = 0n;
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj_0, replacer));

    wrongValue = '0';
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj_0Str, replacer));

    wrongValue = "";
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj_EmptyStr, replacer));

    wrongValue = "   ";
    //@ts-ignore
    objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization, options }), replacer), JSON.stringify(expObj_EmptyStr, replacer));
  });

  await t.step('enum type', async () => {
    // test undefined with enum type
    assertEquals(JSON.stringify(S.sanitizeObj({ obj: {}, sanitization: { a: [11, undefined, 'aa', 'aaa', 55] }, validate: true })), JSON.stringify({}));

    // test enum type
    assertThrows(() => S.sanitizeObj({ obj: { a: 999 }, sanitization: { a: [11, 'aa', 'aaa', 55] }, validate: true }));
  });
});
