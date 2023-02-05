import * as Validation from '../../src/lib/validation_utils.js';
import { Big } from '../../src/deps.js';

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from '../deps.js';
import { ARRAY_OF_BIGJS_TYPE } from '../../src/lib/validation_utils.js';

Deno.test('test validate(), not valid, `any` type is undefined + personalized error message', () => {
  const objToValidate = undefined;
  const validation = 'any';

  let _error;
  try {
    Validation.validate({ value: objToValidate, validation: validation, errorMsg: 'ValX' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('ValX = undefined, must be !== null or undefined'));
});

Deno.test('test validate(), not valid, `any` type is null', () => {
  const objToValidate = null;
  const validation = 'any';

  let _error;
  try {
    Validation.validate({ value: objToValidate, validation: validation });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = null, must be !== null or undefined'));
});

Deno.test('test validate() return value', () => {
  const objToValidate = 'xyz';
  const objToValidate2 = Validation.validate({ value: objToValidate, validation: 'string' });

  assertEquals(objToValidate2, objToValidate);
});

Deno.test('test validate(), valid, all cases', () => {
  Validation.validate({ value: 'string', validation: 'string' });
  Validation.validate({ value: 123, validation: 'number' });
  Validation.validate({ value: false, validation: 'boolean' });
  Validation.validate({ value: new Date('1999-12-31T23:59:59'), validation: 'date' });
  Validation.validate({ value: 999, validation: [11, 22, 999, 55] });  // enum
  Validation.validate({ value: 'aaa', validation: [11, 'aa', 'aaa', 55] });  // enum
  Validation.validate({ value: undefined, validation: [11, undefined, 'aa', 'aaa', 55] });  // enum
  Validation.validate({ value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }], validation: 'array' });
  Validation.validate({ value: [ 'a', 'b' ], validation: 'array[string]' });
  Validation.validate({ value: [ 99, 0, 55 ], validation: 'array[number]' });
  Validation.validate({ value: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ], validation: 'array[date]' });
  Validation.validate({ value: [ false, true ], validation: 'array[boolean]' });
  Validation.validate({ value: [ ], validation: 'array[boolean]' });  // empty array
  Validation.validate({ value: [ {a: 99} ], validation: 'array[object]' });
  Validation.validate({ value: { a: 999 }, validation: 'object' });
  Validation.validate({ value: () => {console.log('mamma');}, validation: 'function' });
  Validation.validate({ value: Symbol(), validation: Validation.SYMBOL_TYPE });
  Validation.validate({ value: new Big(10), validation: Validation.BIGJS_TYPE });
  Validation.validate({ value: [ new Big(10), Big(9), Big(0) ], validation: Validation.ARRAY_OF_BIGJS_TYPE });
  Validation.validate({ value: 999, validation: 'any' });
});

Deno.test('test validate(), valid, all cases, with optional types', () => {
  Validation.validate({ value: 'string', validation: 'string?' });
  Validation.validate({ value: 123, validation: 'number?' });
  Validation.validate({ value: false, validation: 'boolean?' });
  Validation.validate({ value: new Date('1999-12-31T23:59:59'), validation: 'date?' });
  Validation.validate({ value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }], validation: 'array?' });
  Validation.validate({ value: [ 'a', 'b' ], validation: 'array[string]?' });
  Validation.validate({ value: [ 99, 0, 55 ], validation: 'array[number]?' });
  Validation.validate({ value: [ new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ], validation: 'array[date]?' });
  Validation.validate({ value: [ false, true ], validation: 'array[boolean]?' });
  Validation.validate({ value: [ ], validation: 'array[boolean]?' });  // empty array
  Validation.validate({ value: [ {a: 99} ], validation: 'array[object]?' });
  Validation.validate({ value: { a: 999 }, validation: 'object?' });
  Validation.validate({ value: () => {console.log('mamma');}, validation: 'function?' });
  Validation.validate({ value: Symbol(), validation: Validation.SYMBOL_TYPE + '?' });
  Validation.validate({ value: new Big(10), validation: Validation.BIGJS_TYPE + '?' });
  Validation.validate({ value: [ new Big(10), Big(9), Big(0) ], validation: Validation.ARRAY_OF_BIGJS_TYPE + '?' });
  Validation.validate({ value: 999, validation: 'any?' });

  let nullOrUndefined = null;
  Validation.validate({ value: nullOrUndefined, validation: 'string?' });
  Validation.validate({ value: nullOrUndefined, validation: 'number?' });
  Validation.validate({ value: nullOrUndefined, validation: 'boolean?' });
  Validation.validate({ value: nullOrUndefined, validation: 'date?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[string]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[number]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[date]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[boolean]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[boolean]?' });  // empty array
  Validation.validate({ value: nullOrUndefined, validation: 'array[object]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'object?' });
  Validation.validate({ value: nullOrUndefined, validation: 'function?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.SYMBOL_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BIGJS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BIGJS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: 'any?' });

  nullOrUndefined = undefined;
  Validation.validate({ value: nullOrUndefined, validation: 'string?' });
  Validation.validate({ value: nullOrUndefined, validation: 'number?' });
  Validation.validate({ value: nullOrUndefined, validation: 'boolean?' });
  Validation.validate({ value: nullOrUndefined, validation: 'date?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[string]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[number]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[date]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[boolean]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'array[boolean]?' });  // empty array
  Validation.validate({ value: nullOrUndefined, validation: 'array[object]?' });
  Validation.validate({ value: nullOrUndefined, validation: 'object?' });
  Validation.validate({ value: nullOrUndefined, validation: 'function?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.SYMBOL_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BIGJS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BIGJS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: 'any?' });
});

Deno.test('test validate(), not valid, all cases', () => {
  let _error;
  try {
    Validation.validate({ value: 99, validation: 'string' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be string'));

  _error = '';
  try {
    Validation.validate({ value: 'aa', validation: 'number' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = aa, must be a valid number'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'boolean' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be boolean'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'date' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be a valid date'));

  // enum
  _error = '';
  try {
    Validation.validate({ value: 'aaaX', validation: [11, 'aa', 'aaa', 55] });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Validation error: Value = aaaX, must be one of 11,aa,aaa,55'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'array' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'array[string]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'array[number]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'array[date]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'array[boolean]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'array[object]' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'object' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an object'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: 'function' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be a function'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.SYMBOL_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be a symbol'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.BIGJS_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an instance of Big.js'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: ARRAY_OF_BIGJS_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: [ new Big(10), 0, Big(0) ], validation: ARRAY_OF_BIGJS_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 0, must be an instance of Big.js'));
});
