import { validate } from './validation_utils.js';

import {
  assert,
  assertFalse,
  assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';

Deno.test('test validate(), not valid, any type is undefined + personalized error message', () => {
  const objToValidate = undefined;
  const validation = 'any';

  let _error;
  try {
    validate({ value: objToValidate, validation: validation, errorMsg: 'ValX' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('ValX = undefined, must be !== null or undefined'));
});

Deno.test('test validate(), not valid, any type is null', () => {
  const objToValidate = null;
  const validation = 'any';

  let _error;
  try {
    validate({ value: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = null, must be !== null or undefined'));
});

Deno.test('test validate(), valid, all cases', () => {
  validate({ value: 'string', validation: 'string' });
  validate({ value: 123, validation: 'number' });
  validate({ value: false, validation: 'boolean' });
  validate({ value: new Date('1999-12-31T23:59:59'), validation: 'date' });
  validate({ value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }], validation: 'array' });
  validate({ value: [ 'a', 'b' ], validation: 'array[string]' });
  validate({ value: [ 99, 0, 55 ], validation: 'array[number]' });
  validate({ value: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ], validation: 'array[date]' });
  validate({ value: [ false, true ], validation: 'array[boolean]' });
  validate({ value: [ ], validation: 'array[boolean]' });  // empty array
  validate({ value: { a: 999 }, validation: 'object' });
  validate({ value: () => {console.log('mamma');}, validation: 'function' });
  validate({ value: 999, validation: 'any' });
});

Deno.test('test validate(), valid, all cases, with optional types', () => {
  validate({ value: 'string', validation: 'string?' });
  validate({ value: 123, validation: 'number?' });
  validate({ value: false, validation: 'boolean?' });
  validate({ value: new Date('1999-12-31T23:59:59'), validation: 'date?' });
  validate({ value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }], validation: 'array?' });
  validate({ value: [ 'a', 'b' ], validation: 'array[string]?' });
  validate({ value: [ 99, 0, 55 ], validation: 'array[number]?' });
  validate({ value: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ], validation: 'array[date]?' });
  validate({ value: [ false, true ], validation: 'array[boolean]?' });
  validate({ value: [ ], validation: 'array[boolean]?' });  // empty array
  validate({ value: { a: 999 }, validation: 'object?' });
  validate({ value: () => {console.log('mamma');}, validation: 'function?' });
  validate({ value: 999, validation: 'any?' });
});

Deno.test('test validate(), not valid, all cases', () => {
  let _error;
  try {
    validate({ value: 99, validation: 'string' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be string'));

  try {
    validate({ value: 'aa', validation: 'number' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = aa, must be a valid number'));

  try {
    validate({ value: 99, validation: 'boolean' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be boolean'));

  try {
    validate({ value: 99, validation: 'date' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be a valid date'));

  try {
    validate({ value: 99, validation: 'array' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an array'));

  try {
    validate({ value: 99, validation: 'array[string]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  try {
    validate({ value: 99, validation: 'array[number]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  try {
    validate({ value: 99, validation: 'array[date]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  try {
    validate({ value: 99, validation: 'array[boolean]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  try {
    validate({ value: 99, validation: 'object' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an object'));

  try {
    validate({ value: 99, validation: 'function' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be a function'));
});
