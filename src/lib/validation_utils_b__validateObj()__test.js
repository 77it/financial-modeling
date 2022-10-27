import { validateObj } from './validation_utils.js';
import * as Validation from './validation_utils.js';

import {
  assert,
  assertFalse,
  assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';

Deno.test('test validateObj(), valid, simple object', () => {
  const objToValidate = { a: 'mamma', b: 99 };
  validateObj({ obj: objToValidate, validation: { a: 'string', b: 'number' } });
});

Deno.test('test validateObj(), valid, `any` type', () => {
  const objToValidate = { a: 'mamma', b: 99 };
  validateObj({ obj: objToValidate, validation: { a: 'any', b: 'number' } });

  const objToValidate2 = { a: 9999, b: 99 };
  validateObj({ obj: objToValidate2, validation: { a: 'any', b: 'number' } });
});

Deno.test('test validateObj(), not valid, any type is undefined', () => {
  const objToValidate = { a: undefined, b: 99 };

  const validation = {
    a: 'any',
    b: 'number'
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
    a: 'any',
    b: 'number'
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

Deno.test('test validateObj(), valid, complex object', () => {
  const objToValidate = {
    str: 'string',
    num: 123,
    bool: false,
    date: new Date('1999-12-31T23:59:59'),
    arr: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    arrStr: [ 'a', 'b' ],
    arrNum: [ 99, 0, 55 ],
    arrDate: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ],
    arrBool: [ false, true ],
    arrBoolEmpty: [ ],
    obj: { a: 999 },
    fun: () => {console.log('mamma');},
    any: 999,
    symbol: Symbol(),
    extraValueNotValidated: 999
  };

  const validation = {
    str: Validation.STRING_TYPE,
    num: Validation.NUMBER_TYPE,
    bool: Validation.BOOLEAN_TYPE,
    date: Validation.DATE_TYPE,
    arr: Validation.ARRAY_TYPE,
    arrStr: Validation.ARRAY_OF_STRINGS_TYPE,
    arrNum: Validation.ARRAY_OF_NUMBERS_TYPE,
    arrDate: Validation.ARRAY_OF_DATES_TYPE,
    arrBool: Validation.ARRAY_OF_BOOLEANS_TYPE,
    arrBoolEmpty: Validation.ARRAY_OF_BOOLEANS_TYPE,
    obj: Validation.OBJECT_TYPE,
    fun: Validation.FUNCTION_TYPE,
    symbol: Validation.SYMBOL_TYPE,
    any: Validation.ANY_TYPE,
  };

  validateObj({ obj: objToValidate, validation: validation });
});

Deno.test('test validateObj(), valid, object with and without optional types and optional (missing) properties', () => {
  const validation = {
    str: 'string?',
    num: 'number?',
    bool: 'boolean?',
    date: 'date?',
    arr: 'array?',
    arrStr: 'array[string]?',
    arrNum: 'array[number]?',
    arrDate: 'array[date]?',
    arrBool: 'array[boolean]?',
    obj: 'object?',
    fun: 'function?',
    any: 'any?',
  };

  const objToValidate = {
    str: 'string',
    num: 123,
    bool: false,
    date: new Date('1999-12-31T23:59:59'),
    arr: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    arrStr: [ 'a', 'b' ],
    arrNum: [ 99, 0, 55 ],
    arrDate: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ],
    arrBool: [ false, true ],
    obj: { a: 999 },
    fun: () => {console.log('mamma');},
    symbol: Symbol(),
    any: 999
  };

  validateObj({ obj: objToValidate, validation: validation });

  const emptyObject = {};
  validateObj({ obj: emptyObject, validation: validation });

  const nullObject = {
    str: null,
    num: null,
    bool: null,
    date: null,
    arr: null,
    arrStr: null,
    arrNum: null,
    arrDate: null,
    arrBool: null,
    obj: null,
    fun: null,
    symbol: null,
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
    valA: 'string',
    valB: 'object',
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
    valA: 'string',
    valB: 'object',
  };

  validateObj({ obj: objToValidate.arr, validation: validation });
});

Deno.test('test validateObj(), not valid, simple object + personalized error message', () => {
  const objToValidate = { a: 'mamma', b: 99 };

  const validation = {
    a: 'string',
    b: 'string'
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
    valA: 'string',
    valB: 'object',
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
    arr: 'array',
    obj: 'object',
    fun: 'function',
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
    arrNum: [ 99, 0, 55, false ],
    arrDate: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59'), 99 ],
    arrBool: [ false, true, 99 ],
  };

  const validation = {
    arr: 'array',
    arrStr: 'array[string]',
    arrNum: 'array[number]',
    arrDate: 'array[date]',
    arrBool: 'array[boolean]',
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
  assert(_error.includes('"arrNum array error, [\\"Value = false, must be a valid number\\"]"'));
  assert(_error.includes('"arrDate array error, [\\"Value = 99, must be a valid date\\"]"'));
  assert(_error.includes('"arrBool array error, [\\"Value = 99, must be boolean\\"]"'));
});

Deno.test('test validateObj(), not valid, null/undefined/not a str parameter', () => {
  const objToValidate = {
    str: null,
    str2: undefined,
    str3: 999,
  };

  const validation = {
    str: 'string',
    str2: 'string',
    str3: 'string',
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
    num: 'number',
    num2: 'number',
    num3: 'number',
    num4: 'number',
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
    date: 'date',
    date2: 'date',
    date3: 'date',
    date4: 'date',
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

Deno.test('test validateObj(), not valid, null/undefined/not a bool parameter', () => {
  const objToValidate = {
    bool: null,
    bool2: undefined,
    bool3: 999,
  };

  const validation = {
    bool: 'boolean',
    bool2: 'boolean',
    bool3: 'boolean',
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
    arr: 'array',
    arr2: 'array',
    arr3: 'array',
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
    obj: 'object',
    obj2: 'object',
    obj3: 'object',
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
    fun: 'function',
    fun2: 'function',
    fun3: 'function',
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
    date: 'date',
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
