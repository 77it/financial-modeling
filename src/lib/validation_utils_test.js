import {
  assert,
  assertFalse,
  assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';

import { isInvalidDate, validate } from './validation_utils.js';

Deno.test('test valid date', () => {
  assert(isInvalidDate(new Date('not a date')));
  assertFalse(isInvalidDate(new Date(Date.UTC(2022, 11, 25))));
});

Deno.test('test validate(), valid, simple object', () => {
  const objToValidate = { a: 'mamma', b: 99 };
  validate({ obj: objToValidate, validation: { a: 'string', b: 'number' } });
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

  validate({ obj: objToValidate.arr, validation: validation, array: true });
});

Deno.test('test validate(), not valid, simple object + error message', () => {
  const objToValidate = { a: 'mamma', b: 99 };

  try {
    validate({ obj: objToValidate, validation: { a: 'string', b: 'string' } , errorMsg: 'personalized error message'});
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
    validate({ obj: objToValidate.arr, validation: validation, array: true });
  } catch (error) {
    console.log(error.message);
    assert(error.message.includes('valB = 999, must be an object'));
    assert(error.message.includes('valB = 1, must be an object'));
  }
});
