// @ts-nocheck

import { validate } from './validation_utils.js';

import {
  assert,
  assertFalse,
  assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';

Deno.test('test validate(), valid, simple object', () => {
  const objToValidate = { a: 'mamma', b: 99 };
  validate({ obj: objToValidate, validation: { a: 'string', b: 'number' } });
});

Deno.test('test validate(), valid, `any` type', () => {
  let objToValidate = { a: 'mamma', b: 99 };
  validate({ obj: objToValidate, validation: { a: 'any', b: 'number' } });

  objToValidate = { a: 9999, b: 99 };
  validate({ obj: objToValidate, validation: { a: 'any', b: 'number' } });
});

Deno.test('test validate(), not valid, any type is undefined', () => {
  const objToValidate = { a: undefined, b: 99 };

  const validation = {
    a: 'any',
    b: 'number'
  };

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('a = undefined, must be !== null or undefined'));
  }
});

Deno.test('test validate(), not valid, any type is null', () => {
  const objToValidate = { a: null, b: 99 };

  const validation = {
    a: 'any',
    b: 'number'
  };

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('a = null, must be !== null or undefined'));
  }
});

Deno.test('test validate(), valid, complex object', () => {
  const objToValidate = {
    str: 'string',
    num: 123,
    bool: false,
    date: new Date('1999-12-31T23:59:59'),
    arr: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    obj: { a: 999 },
    fun: () => {console.log('mamma');},
  };

  const validation = {
    str: 'string',
    num: 'number',
    bool: 'boolean',
    date: 'date',
    arr: 'array',
    obj: 'object',
    fun: 'function',
  };

  validate({ obj: objToValidate, validation: validation });
});

Deno.test('test validate(), valid, nested object', () => {
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

  validate({ obj: objToValidate.arr[0], validation: validation });
});

Deno.test('test validate(), valid, objects in array', () => {
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

  validate({ obj: objToValidate.arr, validation: validation });
});

Deno.test('test validate(), not valid, simple object + personalized error message', () => {
  const objToValidate = { a: 'mamma', b: 99 };

  const validation = {
    a: 'string',
    b: 'string'
  };

  try {
    validate({ obj: objToValidate, validation: validation, errorMsg: 'personalized error message'});
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('b = 99, must be string'));
    assert(error.message.includes('personalized error message'));
  }
});

Deno.test('test validate(), not valid, objects in array', () => {
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

  try {
    validate({ obj: objToValidate.arr, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('valB = 999, must be an object'));
    assert(error.message.includes('valB = 1, must be an object'));
  }
});

Deno.test('test validate(), not valid, missing keys', () => {
  const objToValidate = {
    arr: [],
  };

  const validation = {
    arr: 'array',
    obj: 'object',
    fun: 'function',
  };

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["obj is missing","fun is missing"]'));
  }
});

Deno.test('test validate(), not valid, array is of wrong type', () => {
  const objToValidate = {
    arr: 999,
  };

  const validation = {
    arr: 'array',
  };

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["arr = 999, must be an array"]'));
  }
});

Deno.test('test validate(), not valid, null/undefined/not a str parameter', () => {
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

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["str = null, must be string","str2 = undefined, must be string","str3 = 999, must be string"]'));
  }
});

Deno.test('test validate(), not valid, null/undefined/NaN/infinity num parameter', () => {
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

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["num = null, must be a valid number","num2 = undefined, must be a valid number","num3 = NaN, must be a valid number","num4 = Infinity, must be a valid number"]'));
  }
});

Deno.test('test validate(), not valid, null/undefined/not a date/invalid date parameter', () => {
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

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["date = null, must be a valid date","date2 = undefined, must be a valid date","date3 = 999, must be a valid date","date4 = Invalid Date, must be a valid date"]'));
  }
});

Deno.test('test validate(), not valid, null/undefined/not a bool parameter', () => {
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

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["bool = null, must be boolean","bool2 = undefined, must be boolean","bool3 = 999, must be boolean"]'));
  }
});

Deno.test('test validate(), not valid, null/undefined/not an array parameter', () => {
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

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["arr = null, must be an array","arr2 = undefined, must be an array","arr3 = 999, must be an array"]'));
  }
});

Deno.test('test validate(), not valid, null/undefined/not an object parameter', () => {
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

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["obj = null, must be an object","obj2 = undefined, must be an object","obj3 = 999, must be an object"]'));
  }
});

Deno.test('test validate(), not valid, null/undefined/not a function parameter', () => {
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

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["fun = null, must be a function","fun2 = undefined, must be a function","fun3 = 999, must be a function"]'));
  }
});

Deno.test('test validate(), not valid, string instead of object', () => {
  const notAnObjToValidate = "mamma";

  const validation = {
    date: 'date',
  };

  try {
    validate({ obj: notAnObjToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["\'obj\' parameter must be an object"]'));
  }
});

Deno.test('test validate(), not valid, unknown type', () => {
  const objToValidate = {str: 'a'};

  const validation = {
    str: 'unknownType',
  };

  try {
    validate({ obj: objToValidate, validation: validation });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('["unknownType, unrecognized type to validate"]'));
  }
});
