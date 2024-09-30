import * as S from '../../src/lib/schema.js';
import * as v from '../../src/lib/schema_validation_utils.js';

import { SanitizationValidationClass } from './SanitizationValidationClass.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('test validate(): wrong/unknown options', () => {
  assert.throws(() => v.validate({ value: 'aaaX', validation: 'wrong validation type' }));
});

t('test validate(): undefined is not not valid `any` type + personalized error message', () => {
  const objToValidate = undefined;
  const validation = S.ANY_TYPE;

  let _error = "";
  try {
    v.validate({ value: objToValidate, validation: validation, errorMsg: 'ValX' });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('ValX = undefined, must be !== null or undefined'));
});

t('test validate(): null is not not valid `any` type + personalized error message', () => {
  const objToValidate = null;
  const validation = S.ANY_TYPE;

  let _error = "";
  try {
    v.validate({ value: objToValidate, validation: validation });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = null, must be !== null or undefined'));
});

t('test validate() return value', () => {
  const objToValidate = 'xyz';
  const objToValidate2 = v.validate({ value: objToValidate, validation: S.STRING_TYPE });

  assert.deepStrictEqual(objToValidate2, objToValidate);
});

t('test validate(), valid, all cases', () => {
  class TestClass {}

  const testClassInstance = new TestClass();

  v.validate({ value: 'string', validation: S.STRING_TYPE });
  v.validate({ value: 'string', validation: S.STRINGLOWERCASETRIMMED_TYPE });
  v.validate({ value: 'STRING', validation: S.STRINGUPPERCASETRIMMED_TYPE });
  v.validate({ value: 123, validation: S.NUMBER_TYPE });
  v.validate({ value: false, validation: S.BOOLEAN_TYPE });
  v.validate({ value: new Date('1999-12-31T23:59:59'), validation: S.DATE_TYPE });
  v.validate({ value: 999, validation: [11, 22].concat([999, 55]) });  // enum
  v.validate({ value: 'aaa', validation: [11, 'aa', 'aaa', 55] });  // enum
  v.validate({ value: undefined, validation: [11, undefined, 'aa', 'aaa', 55] });  // enum
  v.validate({
    value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    validation: S.ARRAY_TYPE
  });
  v.validate({ value: [], validation: S.ARRAY_TYPE });  // empty array
  v.validate({ value: ['a', 'b'], validation: S.ARRAY_OF_STRINGS_TYPE });
  v.validate({ value: [], validation: S.ARRAY_OF_STRINGS_TYPE });  // empty array
  v.validate({ value: ['a', 'b'], validation: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE });
  v.validate({ value: [], validation: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE });  // empty array
  v.validate({ value: ['A', 'B'], validation: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE });
  v.validate({ value: [], validation: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE });  // empty array
  v.validate({ value: [99, 0, 55], validation: S.ARRAY_OF_NUMBERS_TYPE });
  v.validate({ value: [], validation: S.ARRAY_OF_NUMBERS_TYPE });  // empty array
  v.validate({ value: [new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59')], validation: S.ARRAY_OF_DATES_TYPE });
  v.validate({ value: [], validation: S.ARRAY_OF_DATES_TYPE });  // empty array
  v.validate({ value: [false, true], validation: S.ARRAY_OF_BOOLEANS_TYPE });
  v.validate({ value: [], validation: S.ARRAY_OF_BOOLEANS_TYPE });  // empty array
  v.validate({ value: [{ a: 99 }], validation: S.ARRAY_OF_OBJECTS_TYPE });
  v.validate({ value: [], validation: S.ARRAY_OF_OBJECTS_TYPE });  // empty array
  v.validate({ value: { a: 999 }, validation: S.OBJECT_TYPE });
  v.validate({ value: testClassInstance, validation: S.OBJECT_TYPE });
  v.validate({ value: () => {console.log('mamma');}, validation: S.FUNCTION_TYPE });
  v.validate({ value: Symbol(), validation: S.SYMBOL_TYPE });
  v.validate({ value: BigInt(10), validation: S.BIGINT_TYPE });
  v.validate({ value: BigInt(10), validation: S.BIGINT_NUMBER_TYPE });
  v.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: S.ARRAY_OF_BIGINT_TYPE });
  v.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: S.ARRAY_OF_BIGINT_NUMBER_TYPE });
  v.validate({ value: 10, validation: SanitizationValidationClass });  // validate true if value is number
  v.validate({ value: [10, 9, 0], validation: [SanitizationValidationClass] });  // validate true if value is number
  v.validate({ value: 999, validation: S.ANY_TYPE });
});

t('test validate(), valid, all cases, with optional types', () => {
  class TestClass {}

  const testClassInstance = new TestClass();

  v.validate({ value: 'string', validation: S.STRING_TYPE + '?' });
  v.validate({ value: 'string', validation: S.STRINGLOWERCASETRIMMED_TYPE + '?' });
  v.validate({ value: 'STRING', validation: S.STRINGUPPERCASETRIMMED_TYPE + '?' });
  v.validate({ value: 123, validation: S.NUMBER_TYPE + '?' });
  v.validate({ value: false, validation: S.BOOLEAN_TYPE + '?' });
  v.validate({ value: new Date('1999-12-31T23:59:59'), validation: S.DATE_TYPE + '?' });
  v.validate({
    value: [
      { valA: 'aaa', valB: { a: 999 } },
      { valA: 'aaaX', valB: { a: 9990 } }],
    validation: S.ARRAY_TYPE + '?'
  });
  v.validate({ value: ['a', 'b'], validation: S.ARRAY_OF_STRINGS_TYPE + '?' });
  v.validate({ value: ['a', 'b'], validation: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE + '?' });
  v.validate({ value: ['A', 'B'], validation: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE + '?' });
  v.validate({ value: [99, 0, 55], validation: S.ARRAY_OF_NUMBERS_TYPE + '?' });
  v.validate({ value: [new Date('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59')], validation: S.ARRAY_OF_DATES_TYPE + '?' });
  v.validate({ value: [false, true], validation: S.ARRAY_OF_BOOLEANS_TYPE + '?' });
  v.validate({ value: [], validation: S.ARRAY_OF_BOOLEANS_TYPE + '?' });  // empty array
  v.validate({ value: [{ a: 99 }], validation: S.ARRAY_OF_OBJECTS_TYPE + '?' });
  v.validate({ value: { a: 999 }, validation: S.OBJECT_TYPE + '?' });
  v.validate({ value: testClassInstance, validation: S.OBJECT_TYPE + '?' });
  v.validate({ value: () => {console.log('mamma');}, validation: S.FUNCTION_TYPE + '?' });
  v.validate({ value: Symbol(), validation: S.SYMBOL_TYPE + '?' });
  v.validate({ value: BigInt(10), validation: S.BIGINT_TYPE + '?' });
  v.validate({ value: BigInt(10), validation: S.BIGINT_NUMBER_TYPE + '?' });
  v.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: S.ARRAY_OF_BIGINT_TYPE + '?' });
  v.validate({ value: [BigInt(10), BigInt(9), BigInt(0)], validation: S.ARRAY_OF_BIGINT_NUMBER_TYPE + '?' });
  v.validate({ value: 999, validation: S.ANY_TYPE + '?' });

  let nullOrUndefined = null;
  v.validate({ value: nullOrUndefined, validation: S.STRING_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.STRINGLOWERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.STRINGUPPERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.NUMBER_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.BOOLEAN_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.DATE_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_STRINGS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_NUMBERS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_DATES_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BOOLEANS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BOOLEANS_TYPE + '?' });  // empty array
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_OBJECTS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.OBJECT_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.FUNCTION_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.SYMBOL_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.BIGINT_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.BIGINT_NUMBER_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BIGINT_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BIGINT_NUMBER_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ANY_TYPE + '?' });

  nullOrUndefined = undefined;
  v.validate({ value: nullOrUndefined, validation: S.STRING_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.STRINGLOWERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.STRINGUPPERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.NUMBER_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.BOOLEAN_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.DATE_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_STRINGS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_NUMBERS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_DATES_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BOOLEANS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BOOLEANS_TYPE + '?' });  // empty array
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_OBJECTS_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.OBJECT_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.FUNCTION_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.SYMBOL_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.BIGINT_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.BIGINT_NUMBER_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BIGINT_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ARRAY_OF_BIGINT_NUMBER_TYPE + '?' });
  v.validate({ value: nullOrUndefined, validation: S.ANY_TYPE + '?' });
});

t('test validate(), not valid, all cases', () => {
  let _error = '';
  try {
    v.validate({ value: 99, validation: S.STRING_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be string'));

  _error = '';
  try {
    v.validate({ value: 'AA', validation: S.STRINGLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = AA, must be a lowercase trimmed string'));

  _error = '';
  try {
    v.validate({ value: '   aa   ', validation: S.STRINGLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value =    aa   , must be a lowercase trimmed string'));

  _error = '';
  try {
    v.validate({ value: 'aa', validation: S.STRINGUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = aa, must be an uppercase trimmed string'));

  _error = '';
  try {
    v.validate({ value: '   AA   ', validation: S.STRINGUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value =    AA   , must be an uppercase trimmed string'));

  _error = '';
  try {
    v.validate({ value: 'aa', validation: S.NUMBER_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = aa, must be a valid number'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.BOOLEAN_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be boolean'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.DATE_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be a valid date'));

  // enum
  _error = '';
  try {
    v.validate({ value: 'aaaX', validation: [11, 'aa', 'aaa', 55] });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Validation error: Value = aaaX, must be one of 11,aa,aaa,55'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be an array'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_STRINGS_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: ['AA', 'aa', '   aa   '], validation: S.ARRAY_OF_STRINGSLOWERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('["Value = AA, must be a lowercase trimmed string","Value =    aa   , must be a lowercase trimmed string"]'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: ['aa', 'AA', '   AA   '], validation: S.ARRAY_OF_STRINGSUPPERCASETRIMMED_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('["Value = aa, must be an uppercase trimmed string","Value =    AA   , must be an uppercase trimmed string"]'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_NUMBERS_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_DATES_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_BOOLEANS_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_OBJECTS_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.OBJECT_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be an object'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.FUNCTION_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be a function'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.SYMBOL_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be a symbol'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.BIGINT_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be an instance of BigInt'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 99, must be an instance of BigInt'));

  _error = '';
  try {
    v.validate({ value: BigInt('999999999999999999999'), validation: S.BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 999999999999999999999, is BigInt but the value is too big to be safely converted to a number'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_BIGINT_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: [BigInt(10), 0, BigInt(0)], validation: S.ARRAY_OF_BIGINT_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 0, must be an instance of BigInt'));

  _error = '';
  try {
    v.validate({ value: 99, validation: S.ARRAY_OF_BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: [BigInt('999999999999999999999'), BigInt(10), 0, BigInt(0)], validation: S.ARRAY_OF_BIGINT_NUMBER_TYPE });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('["Value = 999999999999999999999, is BigInt but the value is too big to be safely converted to a number","Value = 0, must be an instance of BigInt"]'));

  _error = '';
  try {
    v.validate({ value: "99", validation: SanitizationValidationClass });  // validate false if value is not a number
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }

  console.log(_error);
  assert(_error.includes('Value = 99, is not a number'));

  _error = '';
  try {
    v.validate({ value: "99", validation: [SanitizationValidationClass] });  // validate false if value is not a number
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value array error, must be an array'));

  _error = '';
  try {
    v.validate({ value: [10, "0", 0], validation: [SanitizationValidationClass] });
  } catch (error) {
    _error = (error instanceof Error) ? error.message : 'Unknown error occurred';
  }
  
  assert(_error.includes('Value = 0, is not a number'));
});
