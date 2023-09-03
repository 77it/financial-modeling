import { validateObj } from '../../src/lib/validation_utils.js';
import * as Validation from '../../src/lib/validation_utils.js';

// from https://github.com/MikeMcl/big.js/ & https://www.npmjs.com/package/big.js   // backup in https://github.com/77it/big.js
// @deno-types="https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/big.js/index.d.ts"
import { Big } from 'https://cdn.jsdelivr.net/npm/big.js@6.2.1/big.min.mjs';

import {
  assert, 
  assertEquals,
  assertFalse,
  assertThrows,
} from '../deps.js';

Deno.test('test validateObj() return value', () => {
  const objToValidate = { a: 'mamma', b: 99 };
  const objToValidate2 = validateObj({ obj: objToValidate, validation: { a: Validation.STRING_TYPE, b: Validation.NUMBER_TYPE } });

  assertEquals(objToValidate2, objToValidate);
});

Deno.test('test validateObj(), valid, simple object', () => {
  const objToValidate = { a: 'mamma', b: 99 };
  validateObj({ obj: objToValidate, validation: { a: Validation.STRING_TYPE, b: Validation.NUMBER_TYPE } });
});

Deno.test('test validateObj(), valid, class instance', () => {
  class TestClass {
    /**
     * @param {{a: string, b: number}} p
     */
    constructor ({ a, b }) {
      this.a = a;
      this.b = b;
    }
  }

  const testClassInstance = new TestClass({ a: '0', b: 99 });
  const validation = { a: Validation.STRING_TYPE, b: Validation.NUMBER_TYPE };

  validateObj({ obj: testClassInstance, validation: validation });
});

Deno.test('test validateObj(), valid, `any` type', () => {
  const objToValidate = { a: 'mamma', b: 99 };
  validateObj({ obj: objToValidate, validation: { a: Validation.ANY_TYPE, b: Validation.NUMBER_TYPE } });

  const objToValidate2 = { a: 9999, b: 99 };
  validateObj({ obj: objToValidate2, validation: { a: Validation.ANY_TYPE, b: Validation.NUMBER_TYPE } });
});

Deno.test('test validateObj(), not valid, any type is undefined', () => {
  const objToValidate = { a: undefined, b: 99 };

  const validation = {
    a: Validation.ANY_TYPE,
    b: Validation.NUMBER_TYPE
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('a = undefined, must be !== null or undefined'));
});

Deno.test('test validateObj(), not valid, any type is null', () => {
  const objToValidate = { a: null, b: 99 };

  const validation = {
    a: Validation.ANY_TYPE,
    b: Validation.NUMBER_TYPE
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('a = null, must be !== null or undefined'));
});

Deno.test('test validateObj(), valid, complex object, names with and without quotes', () => {
  const objToValidate = {
    'str': 'string',
    'strLowercaseTrimmed': 'string',
    'strUppercaseTrimmed': 'STRING',
    'num': 123,
    'bool': false,
    'date': new Date('1999-12-31T23:59:59'),
    'enum': 'aaa',
    //enumWithUndefined: missing, must pass because the array contains undefined
    'arr': [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    'arrStr': [ 'a', 'b' ],
    'arrStrLowercaseTrimmed': [ 'a', 'b' ],
    'arrStrUppercaseTrimmed': [ 'A', 'B' ],
    'arrNum': [ 99, 0, 55 ],
    'arrDate': [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ],
    'arrBool': [ false, true ],
    'arrObj': [ {a: 0}, {b: 'b'} ],
    'arrBoolEmpty': [ ],
    'obj': { a: 999 },
    'fun': () => {console.log('mamma');},
    'any': 999,
    'symbol': Symbol(),
    'bigInt': BigInt(10),
    'bigInt_number': BigInt(10),
    'arrBigInt': [ BigInt(10), BigInt(9), BigInt(0) ],
    'arrBigInt_number': [ BigInt(10), BigInt(9), BigInt(0) ],
    'big_js': new Big(10),
    'arrBig_js': [ new Big(10), new Big(9), Big(0) ],
    'extraValueNotValidated': 999
  };

  const validation = {
    str: Validation.STRING_TYPE,
    strLowercaseTrimmed: Validation.STRINGLOWERCASETRIMMED_TYPE,
    strUppercaseTrimmed: Validation.STRINGUPPERCASETRIMMED_TYPE,
    num: Validation.NUMBER_TYPE,
    bool: Validation.BOOLEAN_TYPE,
    date: Validation.DATE_TYPE,
    enum: [11, 'aa', 'aaa', 55],
    enumWithUndefined: [11, undefined, 'aa', 'aaa', 55],
    arr: Validation.ARRAY_TYPE,
    arrStr: Validation.ARRAY_OF_STRINGS_TYPE,
    arrStrLowercaseTrimmed: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE,
    arrStrUppercaseTrimmed: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE,
    arrNum: Validation.ARRAY_OF_NUMBERS_TYPE,
    arrDate: Validation.ARRAY_OF_DATES_TYPE,
    arrBool: Validation.ARRAY_OF_BOOLEANS_TYPE,
    arrBoolEmpty: Validation.ARRAY_OF_BOOLEANS_TYPE,
    arrObj: Validation.ARRAY_OF_OBJECTS_TYPE,
    obj: Validation.OBJECT_TYPE,
    fun: Validation.FUNCTION_TYPE,
    symbol: Validation.SYMBOL_TYPE,
    bigInt: Validation.BIGINT_TYPE,
    bigInt_number: Validation.BIGINT_NUMBER_TYPE,
    arrBigInt: Validation.ARRAY_OF_BIGINT_TYPE,
    arrBigInt_number: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE,
    big_js: Big,
    arrBig_js: [Big],
    any: Validation.ANY_TYPE,
  };

  validateObj({ obj: objToValidate, validation: validation });
});

Deno.test('test validateObj(), valid, object with and without optional types and optional (missing) properties', () => {
  const validation = {
    str: Validation.STRING_TYPE + '?',
    strLowercaseTrimmed: Validation.STRINGLOWERCASETRIMMED_TYPE + '?',
    strUppercaseTrimmed: Validation.STRINGUPPERCASETRIMMED_TYPE + '?',
    num: Validation.NUMBER_TYPE + '?',
    bool: Validation.BOOLEAN_TYPE + '?',
    date: Validation.DATE_TYPE + '?',
    arr: Validation.ARRAY_TYPE + '?',
    arrStr: Validation.ARRAY_OF_STRINGS_TYPE + '?',
    arrStrLowercaseTrimmed: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE + '?',
    arrStrUppercaseTrimmed: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE + '?',
    arrNum: Validation.ARRAY_OF_NUMBERS_TYPE + '?',
    arrDate: Validation.ARRAY_OF_DATES_TYPE + '?',
    arrBool: Validation.ARRAY_OF_BOOLEANS_TYPE + '?',
    arrObj: Validation.ARRAY_OF_OBJECTS_TYPE + '?',
    obj: Validation.OBJECT_TYPE + '?',
    fun: Validation.FUNCTION_TYPE + '?',
    bigInt: Validation.BIGINT_TYPE + '?',
    bigInt_number: Validation.BIGINT_NUMBER_TYPE + '?',
    arrBigInt: Validation.ARRAY_OF_BIGINT_TYPE + '?',
    arrBigInt_number: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE + '?',
    any: 'any?',
  };

  const objToValidate = {
    str: 'string',
    strLowercaseTrimmed: 'string',
    strUppercaseTrimmed: 'STRING',
    num: 123,
    bool: false,
    date: new Date('1999-12-31T23:59:59'),
    arr: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    arrStr: [ 'a', 'b' ],
    arrStrLowercaseTrimmed: [ 'a', 'b' ],
    arrStrUppercaseTrimmed: [ 'A', 'B' ],
    arrNum: [ 99, 0, 55 ],
    arrDate: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ],
    arrBool: [ false, true ],
    arrObj: [ {a: 0}, {b: 'b'} ],
    obj: { a: 999 },
    fun: () => {console.log('mamma');},
    symbol: Symbol(),
    bigInt: BigInt(10),
    bigInt_number: BigInt(10),
    arrBigInt: [BigInt(10), BigInt(0)],
    arrBigInt_number: [BigInt(10), BigInt(0)],
    any: 999
  };

  validateObj({ obj: objToValidate, validation: validation });

  const emptyObject = {};
  validateObj({ obj: emptyObject, validation: validation });

  const nullObject = {
    str: null,
    strLowercaseTrimmed: null,
    strUppercaseTrimmed: null,
    num: null,
    bool: null,
    date: null,
    arr: null,
    arrStr: null,
    arrStrLowercaseTrimmed: null,
    arrStrUppercaseTrimmed: null,
    arrNum: null,
    arrDate: null,
    arrBool: null,
    arrObj: null,
    obj: null,
    fun: null,
    symbol: null,
    bigInt: null,
    bigInt_number: null,
    arrBigInt: null,
    arrBigInt_number: null,
    any: null
  };
  validateObj({ obj: nullObject, validation: validation });
});

Deno.test('test validateObj(), valid, nested object', () => {
  const objToValidate = {
    str: 'string',
    arr: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
  };

  const validation = {
    valA: Validation.STRING_TYPE,
    valB: Validation.OBJECT_TYPE,
  };

  validateObj({ obj: objToValidate.arr[0], validation: validation });
});

Deno.test('test validateObj(), valid, objects in array', () => {
  const objToValidate = {
    str: 'string',
    arr: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
  };

  const validation = {
    valA: Validation.STRING_TYPE,
    valB: Validation.OBJECT_TYPE,
  };

  validateObj({ obj: objToValidate.arr, validation: validation });
});

Deno.test('test validateObj(), not valid, simple object + personalized error message', () => {
  const objToValidate = { a: 'mamma', b: 99 };

  const validation = {
    a: Validation.STRING_TYPE,
    b: Validation.STRING_TYPE
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation, errorMsg: 'personalized error message'});
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('b = 99, must be string'));
  assert(_error.includes('personalized error message'));
});

Deno.test('test validateObj(), not valid, objects in array', () => {
  const objToValidate = {
    str: 'string',
    arr: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: 999 },
      { valA: 'aaaY', valB: { a: 222 } },
      { valA: 'aaaZ', valB: 1 },
    ],
  };

  const validation = {
    valA: Validation.STRING_TYPE,
    valB: Validation.OBJECT_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate.arr, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('valB = 999, must be an object'));
  assert(_error.includes('valB = 1, must be an object'));
});

Deno.test('test validateObj(), not valid, missing keys', () => {
  const objToValidate = {
    arr: [],
  };

  const validation = {
    arr: Validation.ARRAY_TYPE,
    obj: Validation.OBJECT_TYPE,
    fun: Validation.FUNCTION_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["obj is missing","fun is missing"]'));
});

Deno.test('test validateObj(), not valid, array is of wrong type', () => {
  const objToValidate = {
    arr: 999,
    arrStr: [ 'a', 'b', 99 ],
    arrStrLowercaseTrimmed: ['AA', 'aa', '   aa   ', 99],
    arrStrUppercaseTrimmed: ['aa', 'AA', '   AA   ', 99],
    arrNum: [ 99, 0, 55, false ],
    arrDate: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59'), 99 ],
    arrBool: [ false, true, 99 ],
    arrObj: [ {a: 0}, {b: 'b'} , 99 ],
    arrBigInt: [ BigInt(10), 0, BigInt(0) ],
    arrBigInt_number: [ BigInt(10), 0, BigInt(0) ],
    arrBig_js: [ new Big(10), 0, Big(0) ],
  };

  const validation = {
    arr: Validation.ARRAY_TYPE,
    arrStr: Validation.ARRAY_OF_STRINGS_TYPE,
    arrStrLowercaseTrimmed: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE,
    arrStrUppercaseTrimmed: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE,
    arrNum: Validation.ARRAY_OF_NUMBERS_TYPE,
    arrDate: Validation.ARRAY_OF_DATES_TYPE,
    arrBool: Validation.ARRAY_OF_BOOLEANS_TYPE,
    arrObj: Validation.ARRAY_OF_OBJECTS_TYPE,
    arrBigInt: Validation.ARRAY_OF_BIGINT_TYPE,
    arrBigInt_number: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE,
    arrBig_js: [Big],
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["arr = 999, must be an array"'));
  assert(_error.includes('"arrStr array error, [\\"Value = 99, must be string\\"]"'));
  assert(_error.includes('"arrStrLowercaseTrimmed array error, [\\"Value = AA, must be a lowercase trimmed string\\",\\"Value =    aa   , must be a lowercase trimmed string\\",\\"Value = 99, must be a lowercase trimmed string\\"]"'));
  assert(_error.includes('"arrStrUppercaseTrimmed array error, [\\"Value = aa, must be an uppercase trimmed string\\",\\"Value =    AA   , must be an uppercase trimmed string\\",\\"Value = 99, must be an uppercase trimmed string\\"]"'));
  assert(_error.includes('"arrNum array error, [\\"Value = false, must be a valid number\\"]"'));
  assert(_error.includes('"arrDate array error, [\\"Value = 99, must be a valid date\\"]"'));
  assert(_error.includes('"arrBool array error, [\\"Value = 99, must be boolean\\"]"'));
  assert(_error.includes('"arrObj array error, [\\"Value = 99, must be an object\\"]"'));
  assert(_error.includes('"arrBigInt array error, [\\"Value = 0, must be an instance of BigInt\\"]"'));
  assert(_error.includes('"arrBigInt_number array error, [\\"Value = 0, must be an instance of BigInt\\"]"'));
  assert(_error.includes('"arrBig_js array error, [\\"Value = 0, must be an instance of a function or class\\"]"'));
});

Deno.test('test validateObj(), not valid, null/undefined/not a str parameter', () => {
  const objToValidate = {
    str: null,
    str2: undefined,
    str3: 999,
  };

  const validation = {
    str: Validation.STRING_TYPE,
    str2: Validation.STRING_TYPE,
    str3: Validation.STRING_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["str = null, must be string","str2 = undefined, must be string","str3 = 999, must be string"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/NaN/infinity num parameter', () => {
  const objToValidate = {
    num: null,
    num2: undefined,
    num3: NaN,
    num4: 1/0,
  };

  const validation = {
    num: Validation.NUMBER_TYPE,
    num2: Validation.NUMBER_TYPE,
    num3: Validation.NUMBER_TYPE,
    num4: Validation.NUMBER_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["num = null, must be a valid number","num2 = undefined, must be a valid number","num3 = NaN, must be a valid number","num4 = Infinity, must be a valid number"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/not a date/invalid date parameter', () => {
  const objToValidate = {
    date: null,
    date2: undefined,
    date3: 999,
    date4: new Date('not a date'),
  };

  const validation = {
    date: Validation.DATE_TYPE,
    date2: Validation.DATE_TYPE,
    date3: Validation.DATE_TYPE,
    date4: Validation.DATE_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["date = null, must be a valid date","date2 = undefined, must be a valid date","date3 = 999, must be a valid date","date4 = Invalid Date, must be a valid date"]'));
});









Deno.test('test validateObj(), not valid, null/undefined/not BigInt parameter', () => {
  const objToValidate = {
    big: null,
    big2: undefined,
    big3: 999,
  };

  const validation = {
    big: Validation.BIGINT_TYPE,
    big2: Validation.BIGINT_TYPE,
    big3: Validation.BIGINT_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["big = null, must be an instance of BigInt","big2 = undefined, must be an instance of BigInt","big3 = 999, must be an instance of BigInt"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/not BigInt number parameter', () => {
  const objToValidate = {
    big: null,
    big2: undefined,
    big3: 999,
    big4: BigInt("999999999999999999999")
  };

  const validation2 = {
    big: Validation.BIGINT_NUMBER_TYPE,
    big2: Validation.BIGINT_NUMBER_TYPE,
    big3: Validation.BIGINT_NUMBER_TYPE,
    big4: Validation.BIGINT_NUMBER_TYPE,
  };

  let _error='';
  try {
    validateObj({ obj: objToValidate, validation: validation2 });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["big = null, must be an instance of BigInt","big2 = undefined, must be an instance of BigInt","big3 = 999, must be an instance of BigInt","big4 = 999999999999999999999, is BigInt but the value is too big to be safely converted to a number"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/not Big.js parameter', () => {
  const objToValidate = {
    big: null,
    big2: undefined,
    big3: 999,
  };

  const validation = {
    big: Big,
    big2: Big,
    big3: Big,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["big = null, must be an instance of a function or class","big2 = undefined, must be an instance of a function or class","big3 = 999, must be an instance of a function or class"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/not a bool parameter', () => {
  const objToValidate = {
    bool: null,
    bool2: undefined,
    bool3: 999,
  };

  const validation = {
    bool: Validation.BOOLEAN_TYPE,
    bool2: Validation.BOOLEAN_TYPE,
    bool3: Validation.BOOLEAN_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["bool = null, must be boolean","bool2 = undefined, must be boolean","bool3 = 999, must be boolean"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/not an array parameter', () => {
  const objToValidate = {
    arr: null,
    arr2: undefined,
    arr3: 999,
  };

  const validation = {
    arr: Validation.ARRAY_TYPE,
    arr2: Validation.ARRAY_TYPE,
    arr3: Validation.ARRAY_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["arr = null, must be an array","arr2 = undefined, must be an array","arr3 = 999, must be an array"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/not an object parameter', () => {
  const objToValidate = {
    obj: null,
    obj2: undefined,
    obj3: 999,
  };

  const validation = {
    obj: Validation.OBJECT_TYPE,
    obj2: Validation.OBJECT_TYPE,
    obj3: Validation.OBJECT_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["obj = null, must be an object","obj2 = undefined, must be an object","obj3 = 999, must be an object"]'));
});

Deno.test('test validateObj(), not valid, null/undefined/not a function parameter', () => {
  const objToValidate = {
    fun: null,
    fun2: undefined,
    fun3: 999,
  };

  const validation = {
    fun: Validation.FUNCTION_TYPE,
    fun2: Validation.FUNCTION_TYPE,
    fun3: Validation.FUNCTION_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["fun = null, must be a function","fun2 = undefined, must be a function","fun3 = 999, must be a function"]'));
});

Deno.test('test validateObj(), not valid, string instead of object', () => {
  const notAnObjToValidate = "mamma";

  const validation = {
    date: Validation.DATE_TYPE,
  };

  let _error;
  try {
    validateObj({ obj: notAnObjToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('\'obj\' parameter must be an object'));
});

Deno.test('test validateObj(), not valid (not existing), unknown type', () => {
  const objToValidate = {str: 'a'};

  const validation = {
    str: 'unknownType',
  };

  let _error;
  try {
    validateObj({ obj: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["str type is unrecognized"]'));
});
