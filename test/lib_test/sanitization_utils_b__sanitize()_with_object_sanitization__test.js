import * as S from '../../src/lib/schema.js';
import * as s from '../../src/lib/schema_sanitization_utils.js';
import { eq2 } from '../../src/lib/obj_utils.js';
import { parseJsonToLocalDate, parseJsonToUTCDate, excelSerialDateToUTCDate, excelSerialDateToLocalDate } from '../../src/lib/date_utils.js';

import { SanitizationValidationClass } from './SanitizationValidationClass.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('test sanitize() with object sanitization - sanitization = {} means no sanitization', async () => {
  const objToSanitize = { a: '11', b: 99 };
  assert.deepStrictEqual(s.sanitize({ value: objToSanitize, sanitization: {} }), objToSanitize);
});

t('test sanitize() with object sanitization - null, undefined and other non-objects are coerced to {}', async () => {
  const sanitization = { a: S.STRING_TYPE, b: S.NUMBER_TYPE };
  assert.deepStrictEqual(s.sanitize({ value: null, sanitization: sanitization }), {});
  assert.deepStrictEqual(s.sanitize({ value: undefined, sanitization: sanitization }), {});
  assert.deepStrictEqual(s.sanitize({ value: 999, sanitization: sanitization }), {});
  assert.deepStrictEqual(s.sanitize({ value: Symbol(), sanitization: sanitization }), {});
});

t('test sanitize() with object sanitization - class: class Type is coerced to {}, class instance is object and sanitized normally', async () => {
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
  assert.deepStrictEqual(s.sanitize({ value: TestClass, sanitization: sanitization }), {});

  // class instance is object and sanitized normally
  assert.deepStrictEqual(
    JSON.stringify(s.sanitize({ value: testClassInstance, sanitization: sanitization, validate: true })),
    JSON.stringify({ a: '0', b: 99 })
  );
});

t('test sanitize() with object sanitization - FAILING can\'t sanitize single part of an object, only the entire object (can\'t sanitize a deconstructed object)', async () => {
  const a = '0';
  const b = '99';
  const expObj = { a: 0, b: 99 };
  const sanitization = { a: S.NUMBER_TYPE, b: S.NUMBER_TYPE };
  /* `a` `b` are not sanitized */
  s.sanitize({ value: { a, b }, sanitization: sanitization });
  /* FAILS */
  // @ts-ignore
  assert(!eq2({ a, b }, expObj));

  // to sanitize object parameters, there are two ways, construct another object or save the returned object
  //
  // 1. construct another object
  const _p1 = { a, b };
  s.sanitize({ value: _p1, sanitization: sanitization });
  // @ts-ignore
  assert.deepStrictEqual(_p1, expObj);
  // 2. save the returned object
  const _p2 = s.sanitize({ value: { a, b }, sanitization: sanitization });
  assert.deepStrictEqual(_p2, expObj);

});

t('test sanitize() with object sanitization - simple object', async () => {
  const objToSanitize = { a: '11', b: 99 };
  const expObj = { a: 11, b: '99' };
  const sanitization = { a: S.NUMBER_TYPE, b: S.STRING_TYPE };
  assert.deepStrictEqual(s.sanitize({ value: objToSanitize, sanitization: sanitization }), expObj);
});

t('test sanitize() with object sanitization - `any` type', async () => {
  const objToSanitize = { a: undefined, b: null, c: 99 };
  const expObj = { a: undefined, b: null, c: 99 };
  const sanitization = { a: S.ANY_TYPE, b: S.ANY_TYPE, c: S.NUMBER_TYPE };
  assert.deepStrictEqual(s.sanitize({ value: objToSanitize, sanitization: sanitization }), expObj);
});

t('test sanitize() with object sanitization - complex type, local date', async () => {
  const objToSanitize = {
    date: '1999-12-31T23:59:59',
    date2: '1999-12-31',
    date3: '2022-12-25T00:00:00.000Z',
    date4_fromExcelSerialDate: 44920,
    arrDate: ['1999-12-31T23:59:59', new Date('2020-12-31T23:59:59')],
    arrDate2: '1999-12-31T23:59:59',
  };

  const expObj = {
    date: parseJsonToLocalDate('1999-12-31T23:59:59'),
    date2: parseJsonToLocalDate('1999-12-31'),
    date3: parseJsonToLocalDate('2022-12-25T00:00:00.000Z'),
    date4_fromExcelSerialDate: excelSerialDateToLocalDate(44920),
    arrDate: [parseJsonToLocalDate('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59')],
    arrDate2: [parseJsonToLocalDate('1999-12-31T23:59:59')],
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

  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization })), (expObj));

  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, validate: true })), (expObj));
});

t('test sanitize() with object sanitization - complex type + validate=true test', async () => {
  const options = { dateUTC: true };

  const _fun = () => {console.log('mamma');};
  const _sym = Symbol();

  const objToSanitize = {
    str: 999,
    strLowercaseTrimmed: '  b B      ',
    strUppercaseTrimmed: '  b B      ',
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
    arrStrLowercaseTrimmed: [0, '  b B      ', '  c C      '],
    arrStrLowercaseTrimmed2: 0,
    arrStrUppercaseTrimmed: [0, '  b B      ', '  c C      '],
    arrStrUppercaseTrimmed2: 0,
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
    any: 999,
    bigInt: 10,
    bigInt_number: 10,
    arrBigInt: [10, '9', 0],
    arrBigInt_number: [10, '9', 0],
    big_js: 10,
    arrBig_js: [10, '9', 0],
    extraValueStr: 'abc',
    extraValueNum: 999,
    extraValueBool: true,
    extraValueDate: new Date(123),
  };

  let clone_objToSanitize= structuredClone(objToSanitize);

  // add function and symbol property to objects, after cloning, because cloning a function is not possible
  //@ts-ignore
  objToSanitize.fun = _fun;
  //@ts-ignore
  clone_objToSanitize.fun = _fun;
  //@ts-ignore
  objToSanitize.symbol = _sym;
  //@ts-ignore
  clone_objToSanitize.symbol = _sym;

  const expObj = {
    str: '999',
    strLowercaseTrimmed: 'b b',
    strUppercaseTrimmed: 'B B',
    num: 123,
    bool: false,
    date: parseJsonToUTCDate('1999-12-31T23:59:59'),
    date2: parseJsonToUTCDate('1999-12-31'),
    date3: parseJsonToUTCDate('2022-12-25T00:00:00.000Z'),
    date4_fromExcelSerialDate: excelSerialDateToUTCDate(44920),
    enum: 'mamma',
    arr: [999],
    arrStr: ['0', 'b'],
    arrStr2: ['0'],
    arrStrLowercaseTrimmed: ['0', 'b b', 'c c'],
    arrStrLowercaseTrimmed2: ['0'],
    arrStrUppercaseTrimmed: ['0', 'B B', 'C C'],
    arrStrUppercaseTrimmed2: ['0'],
    arrNum: [99, 0, 55],
    arrNum2: [99],
    arrDate: [parseJsonToUTCDate('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59')],
    arrDate2: [parseJsonToUTCDate('1999-12-31T23:59:59')],
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
    big_js: SanitizationValidationClass.sanitize(10),
    arrBig_js: [SanitizationValidationClass.sanitize(10), SanitizationValidationClass.sanitize(9), SanitizationValidationClass.sanitize(0)],
    extraValueStr: 'abc',
    extraValueNum: 999,
    extraValueBool: true,
    extraValueDate: new Date(123),
    extraValueMissingRequiredStr: '',
    extraValueMissingRequiredNum: 0,
    extraValueMissingRequiredBool: false,
    extraValueMissingRequiredDate: new Date(0),
  };

  const sanitization = {
    str: S.STRING_TYPE,
    strLowercaseTrimmed: S.STRINGLOWERCASETRIMMED_TYPE,
    strUppercaseTrimmed: S.STRINGUPPERCASETRIMMED_TYPE,
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
    arrStrLowercaseTrimmed: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE,
    arrStrLowercaseTrimmed2: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE,
    arrStrUppercaseTrimmed: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE,
    arrStrUppercaseTrimmed2: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE,
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
    big_js: SanitizationValidationClass,
    arrBig_js: [SanitizationValidationClass],
    any: S.ANY_TYPE,
    extraValueMissingRequiredStr: S.STRING_TYPE,
    extraValueMissingRequiredNum: S.NUMBER_TYPE,
    extraValueMissingRequiredBool: S.BOOLEAN_TYPE,
    extraValueMissingRequiredDate: S.DATE_TYPE,
    extraValueMissingNotRequired: S.STRING_TYPE + '?'
  };

  // If you do not wish to patch BigInt.prototype, you can use the replacer parameter of  to serialize BigInt values
  // from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
  //@ts-ignore
  const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;

  assert.deepStrictEqual((s.sanitize({
    value: objToSanitize,
    sanitization: sanitization,
    options
  })), (expObj));

  assert.deepStrictEqual((s.sanitize({
    value: clone_objToSanitize,
    sanitization: sanitization,
    validate: true,
    options
  })), (expObj));
});

t('test sanitize() with object sanitization - enum type', async () => {
  // test undefined with enum type
  assert.deepStrictEqual((s.sanitize({ value: {}, sanitization: { a: [11, undefined, 'aa', 'aaa', 55] }, validate: true })), ({}));

  // test enum type
  assert.throws(() => s.sanitize({ value: { a: 999 }, sanitization: { a: [11, 'aa', 'aaa', 55] }, validate: true }));
});

t('test sanitize() - nested object in array OR as a single object in a property', () => {
  const objToSanitize_nestedObjInArray = {
    str: 999,
    arrOrObj: [
      { valA: 99, valB: { a: '999' } },
      { valA: 999, valB: { a: '9990' } }],
    str2: 888,
    arrOrObj2: { valA: 555, valB: { a: '9999' } },
    str3: 777,
  };

  const objToSanitize_nestedObjInArray_expected = {
    str: '999',
    arrOrObj: [
      { valA: '99', valB: { a: 999 } },
      { valA: '999', valB: { a: 9990 } }],
    str2: '888',
    arrOrObj2: { valA: '555', valB: { a: 9999 } },
    str3: '777',
  };

  const objToSanitize_nestedObjInProperty = {
    str: 999,
    arrOrObj: { valA: 99, valB: { a: '999' } },
    str2: 888,
    arrOrObj2: { valA: 555, valB: { a: '9999' } },
    str3: 777,
  };

  const objToSanitize_nestedObjInProperty_expected = {
    str: '999',
    arrOrObj: { valA: '99', valB: { a: 999 } },
    str2: '888',
    arrOrObj2: { valA: '555', valB: { a: 9999 } },
    str3: '777',
  };

  const sanitization = {
    str: S.STRING_TYPE,
    str2: S.STRING_TYPE,
    str3: S.STRING_TYPE,
    arrOrObj: { valA: S.STRING_TYPE, valB: { a: S.NUMBER_TYPE} },
    arrOrObj2: { valA: S.STRING_TYPE, valB: { a: S.NUMBER_TYPE} },
  };

  assert.deepStrictEqual(
    s.sanitize({ value: objToSanitize_nestedObjInArray, sanitization: sanitization }),
    objToSanitize_nestedObjInArray_expected);

  assert.deepStrictEqual(
    s.sanitize({ value: objToSanitize_nestedObjInProperty, sanitization: sanitization }),
    objToSanitize_nestedObjInProperty_expected);
});

t('test sanitize() with object sanitization - custom default sanitization values for string, number, date, bigint', async () => {
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
    date: new Date('2025-12-31'),  // `excelSerialDateToLocalDate(0)` returns Date(NaN), that is invalid, and is sanitized to the default sanitization value
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
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj));

  wrongValue = undefined;
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj));

  wrongValue = { ciao: 999 };
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj));

  wrongValue = NaN;
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj));

  wrongValue = 0;
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj_0));

  wrongValue = -0;
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj_0));

  wrongValue = 0n;
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj_0));

  wrongValue = '0';
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj_0Str));

  wrongValue = '';
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj_EmptyStr));

  wrongValue = '   ';
  //@ts-ignore
  objToSanitize = { str: wrongValue, num: wrongValue, date: wrongValue, bigInt: wrongValue, bigInt_number: wrongValue };
  assert.deepStrictEqual((s.sanitize({ value: objToSanitize, sanitization: sanitization, options })), (expObj_EmptyStr));
});

t('test sanitize() with object sanitization - enum type in property', async () => {
  // test that when the property 'a' is missing in the object, it pass the validation of an enum containing undefined
  assert.deepStrictEqual((s.sanitize({ value: {}, sanitization: { a: [11, undefined, 'aa', 'aaa', 55] }, validate: true })), ({}));

  // test that enum sanitization is ignored + validation
  assert.throws(() => s.sanitize({ value: { a: 999 }, sanitization: { a: [11, 'aa', 'aaa', 55] }, validate: true }));
});

t('test sanitize() with object sanitization - enum array as sanitization is ignored', async () => {
  // test that enum sanitization is ignored
  assert.deepStrictEqual((s.sanitize({ value: {}, sanitization: [11, undefined, 'aa', 'aaa', 55], validate: false })), ({}));
});

t('test sanitize() with object sanitization - keyInsensitiveMatch option test + add a missing sanitization key', async () => {
  const objToSanitize = {
    str: 999,
    num: '123',
    bool: 0,
  };

  const objToSanitize_withOptionalValue = {
    str: 999,
    num: '123',
    bool: 0,
    NUM3: '999.1',  // the optional value, when present, will be sanitized
  };

  const expObj = {
    str: '999',
    num: 123,
    bool: false,
    NUM2: 0,
  };

  const expObj_withOptionalValue = {
    ...expObj,
    NUM3: 999.1,
  };

  const sanitization = {
    '  sTr   ': S.STRING_TYPE,
    'NUM  ': S.NUMBER_TYPE,
    bool: S.BOOLEAN_TYPE,
    NUM2: S.NUMBER_TYPE,  // this key is not present in `objToSanitize` then will be added in the sanitized object
    NUM3: S.NUMBER_TYPE + S.OPTIONAL,  // this key is not present in `objToSanitize` and WILL NOT be added because it's optional
  };

  assert(eq2(s.sanitize({ value: objToSanitize, sanitization: sanitization, keyInsensitiveMatch: true }), expObj));

  assert(eq2(s.sanitize({ value: objToSanitize_withOptionalValue, sanitization: sanitization, keyInsensitiveMatch: true }), expObj_withOptionalValue));
});
