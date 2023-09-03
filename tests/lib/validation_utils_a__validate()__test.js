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
import * as S from '../../src/lib/sanitization_utils.js';

Deno.test('test validate(): wrong/unknown options', () => {
  assertThrows(() => Validation.validate({ value: 'aaaX', validation: 'wrong validation type' }));
});

Deno.test('test validate(): undefined is not not valid `any` type + personalized error message', () => {
  const objToValidate = undefined;
  const validation = Validation.ANY_TYPE;

  let _error;
  try {
    Validation.validate({ value: objToValidate, validation: validation, errorMsg: 'ValX' });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('ValX = undefined, must be !== null or undefined'));
});

Deno.test('test validate(): null is not not valid `any` type + personalized error message', () => {
  const objToValidate = null;
  const validation = Validation.ANY_TYPE;

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
  const objToValidate2 = Validation.validate({ value: objToValidate, validation: Validation.STRING_TYPE });

  assertEquals(objToValidate2, objToValidate);
});

Deno.test('test validate(), valid, all cases', () => {
  class TestClass {}

  const testClassInstance = new TestClass();

  Validation.validate({ value: 'string', validation: Validation.STRING_TYPE });
  Validation.validate({ value: 'string', validation: Validation.STRINGLOWERCASETRIMMED_TYPE });
  Validation.validate({ value: 'STRING', validation: Validation.STRINGUPPERCASETRIMMED_TYPE });
  Validation.validate({ value: 123, validation: Validation.NUMBER_TYPE });
  Validation.validate({ value: false, validation: Validation.BOOLEAN_TYPE });
  Validation.validate({ value: new Date('1999-12-31T23:59:59'), validation: Validation.DATE_TYPE });
  Validation.validate({ value: 999, validation: [11, 22].concat([999, 55]) });  // enum
  Validation.validate({ value: 'aaa', validation: [11, 'aa', 'aaa', 55] });  // enum
  Validation.validate({ value: undefined, validation: [11, undefined, 'aa', 'aaa', 55] });  // enum
  Validation.validate({
    value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    validation: Validation.ARRAY_TYPE
  });
  Validation.validate({ value: ['a', 'b'], validation: Validation.ARRAY_OF_STRINGS_TYPE });
  Validation.validate({ value: ['a', 'b'], validation: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE });
  Validation.validate({ value: ['A', 'B'], validation: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE });
  Validation.validate({ value: [99, 0, 55], validation: Validation.ARRAY_OF_NUMBERS_TYPE });
  Validation.validate({ value: [new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59')], validation: Validation.ARRAY_OF_DATES_TYPE });
  Validation.validate({ value: [false, true], validation: Validation.ARRAY_OF_BOOLEANS_TYPE });
  Validation.validate({ value: [], validation: Validation.ARRAY_OF_BOOLEANS_TYPE });  // empty array
  Validation.validate({ value: [{ a: 99 }], validation: Validation.ARRAY_OF_OBJECTS_TYPE });
  Validation.validate({ value: { a: 999 }, validation: Validation.OBJECT_TYPE });
  Validation.validate({ value: testClassInstance, validation: Validation.OBJECT_TYPE });
  Validation.validate({ value: () => {console.log('mamma');}, validation: Validation.FUNCTION_TYPE });
  Validation.validate({ value: Symbol(), validation: Validation.SYMBOL_TYPE });
  Validation.validate({ value: BigInt(10), validation: Validation.BIGINT_TYPE });
  Validation.validate({ value: BigInt(10), validation: Validation.BIGINT_NUMBER_TYPE });
  Validation.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: Validation.ARRAY_OF_BIGINT_TYPE });
  Validation.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE });
  Validation.validate({ value: new Big(10), validation: Big });
  Validation.validate({ value: [new Big(10), new Big(9), new Big(0)], validation: [Big] });
  Validation.validate({ value: 999, validation: Validation.ANY_TYPE });
});

Deno.test('test validate(), valid, all cases, with optional types', () => {
  class TestClass {}

  const testClassInstance = new TestClass();

  Validation.validate({ value: 'string', validation: Validation.STRING_TYPE + '?' });
  Validation.validate({ value: 'string', validation: Validation.STRINGLOWERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: 'STRING', validation: Validation.STRINGUPPERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: 123, validation: Validation.NUMBER_TYPE + '?' });
  Validation.validate({ value: false, validation: Validation.BOOLEAN_TYPE + '?' });
  Validation.validate({ value: new Date('1999-12-31T23:59:59'), validation: Validation.DATE_TYPE + '?' });
  Validation.validate({
    value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    validation: Validation.ARRAY_TYPE + '?'
  });
  Validation.validate({ value: ['a', 'b'], validation: Validation.ARRAY_OF_STRINGS_TYPE + '?' });
  Validation.validate({ value: ['a', 'b'], validation: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: ['A', 'B'], validation: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: [99, 0, 55], validation: Validation.ARRAY_OF_NUMBERS_TYPE + '?' });
  Validation.validate({ value: [new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59')], validation: Validation.ARRAY_OF_DATES_TYPE + '?' });
  Validation.validate({ value: [false, true], validation: Validation.ARRAY_OF_BOOLEANS_TYPE + '?' });
  Validation.validate({ value: [], validation: Validation.ARRAY_OF_BOOLEANS_TYPE + '?' });  // empty array
  Validation.validate({ value: [{ a: 99 }], validation: Validation.ARRAY_OF_OBJECTS_TYPE + '?' });
  Validation.validate({ value: { a: 999 }, validation: Validation.OBJECT_TYPE + '?' });
  Validation.validate({ value: testClassInstance, validation: Validation.OBJECT_TYPE + '?' });
  Validation.validate({ value: () => {console.log('mamma');}, validation: Validation.FUNCTION_TYPE + '?' });
  Validation.validate({ value: Symbol(), validation: Validation.SYMBOL_TYPE + '?' });
  Validation.validate({ value: BigInt(10), validation: Validation.BIGINT_TYPE + '?' });
  Validation.validate({ value: BigInt(10), validation: Validation.BIGINT_NUMBER_TYPE + '?' });
  Validation.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: Validation.ARRAY_OF_BIGINT_TYPE + '?' });
  Validation.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE + '?' });
  Validation.validate({ value: 999, validation: Validation.ANY_TYPE + '?' });

  let nullOrUndefined = null;
  Validation.validate({ value: nullOrUndefined, validation: Validation.STRING_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.STRINGLOWERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.STRINGUPPERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.NUMBER_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BOOLEAN_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.DATE_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_STRINGS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_NUMBERS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_DATES_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BOOLEANS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BOOLEANS_TYPE + '?' });  // empty array
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_OBJECTS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.OBJECT_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.FUNCTION_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.SYMBOL_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BIGINT_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BIGINT_NUMBER_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BIGINT_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ANY_TYPE + '?' });

  nullOrUndefined = undefined;
  Validation.validate({ value: nullOrUndefined, validation: Validation.STRING_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.STRINGLOWERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.STRINGUPPERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.NUMBER_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BOOLEAN_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.DATE_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_STRINGS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_NUMBERS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_DATES_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BOOLEANS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BOOLEANS_TYPE + '?' });  // empty array
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_OBJECTS_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.OBJECT_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.FUNCTION_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.SYMBOL_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BIGINT_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.BIGINT_NUMBER_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BIGINT_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE + '?' });
  Validation.validate({ value: nullOrUndefined, validation: Validation.ANY_TYPE + '?' });
});

Deno.test('test validate(), not valid, all cases', () => {
  let _error;
  try {
    Validation.validate({ value: 99, validation: Validation.STRING_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be string'));

  _error = '';
  try {
    Validation.validate({ value: 'AA', validation: Validation.STRINGLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = AA, must be a lowercase trimmed string'));

  _error = '';
  try {
    Validation.validate({ value: '   aa   ', validation: Validation.STRINGLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value =    aa   , must be a lowercase trimmed string'));

  _error = '';
  try {
    Validation.validate({ value: 'aa', validation: Validation.STRINGUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = aa, must be an uppercase trimmed string'));

  _error = '';
  try {
    Validation.validate({ value: '   AA   ', validation: Validation.STRINGUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value =    AA   , must be an uppercase trimmed string'));

  _error = '';
  try {
    Validation.validate({ value: 'aa', validation: Validation.NUMBER_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = aa, must be a valid number'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.BOOLEAN_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be boolean'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.DATE_TYPE });
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
    Validation.validate({ value: 99, validation: Validation.ARRAY_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_STRINGS_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: ['AA', 'aa', '   aa   '], validation: Validation.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["Value = AA, must be a lowercase trimmed string","Value =    aa   , must be a lowercase trimmed string"]'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: ['aa', 'AA', '   AA   '], validation: Validation.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["Value = aa, must be an uppercase trimmed string","Value =    AA   , must be an uppercase trimmed string"]'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_NUMBERS_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_DATES_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_BOOLEANS_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_OBJECTS_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.OBJECT_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an object'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.FUNCTION_TYPE });
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
    Validation.validate({ value: 99, validation: Validation.BIGINT_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an instance of BigInt'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an instance of BigInt'));

  _error = '';
  try {
    Validation.validate({ value: BigInt('999999999999999999999'), validation: Validation.BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 999999999999999999999, is BigInt but the value is too big to be safely converted to a number'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_BIGINT_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: [BigInt(10), 0, BigInt(0)], validation: Validation.ARRAY_OF_BIGINT_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 0, must be an instance of BigInt'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: [BigInt('999999999999999999999'), BigInt(10), 0, BigInt(0)], validation: Validation.ARRAY_OF_BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('["Value = 999999999999999999999, is BigInt but the value is too big to be safely converted to a number","Value = 0, must be an instance of BigInt"]'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: Big });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 99, must be an instance of a function or class'));

  _error = '';
  try {
    Validation.validate({ value: 99, validation: [Big] });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    Validation.validate({ value: [new Big(10), 0, Big(0)], validation: [Big] });
  } catch (error) {
    _error = error.message;
  }
  console.log(_error);
  assert(_error.includes('Value = 0, must be an instance of a function or class'));
});
