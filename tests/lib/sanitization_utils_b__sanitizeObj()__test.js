import * as S from '../../src/lib/sanitization_utils.js';
import { parseJSON } from '../../src/lib/date_utils.js';

import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from '../deps.js';

Deno.test('test sanitizeObj()', async (t) => {
  await t.step('null, undefined and other non-objects are coerced to {}', async () => {
    class TestClass {
      /**
       * @param {{value: string, value2: string}} p
       */
      constructor({value, value2}) {
        this.value = value;
        this.value2 = value2;
      }
    }

    const sanitization = { a: 'string', b: 'number' };
    assertEquals(S.sanitizeObj({ obj: null, sanitization: sanitization }), {});
    assertEquals(S.sanitizeObj({ obj: undefined, sanitization: sanitization }), {});
    assertEquals(S.sanitizeObj({ obj: 999, sanitization: sanitization }), {});
    assertEquals(S.sanitizeObj({ obj: Symbol(), sanitization: sanitization }), {});
    assertEquals(S.sanitizeObj({ obj: TestClass, sanitization: sanitization }), {});
  });

  await t.step('simple object', async () => {
    const objToSanitize = { a: 'mamma', b: 99 };
    const expObj = { a: 'mamma', b: 99 };
    const sanitization = { a: 'string', b: 'number' };
    assertEquals(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization }), expObj);
  });

  await t.step('`any` type', async () => {
    const objToSanitize = { a: undefined, b: null, c:99 };
    const expObj = { a: undefined, b: null, c: 99 };
    const sanitization = { a: 'any', b: 'any', c: 'number' };
    assertEquals(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization }), expObj);
  });

  await t.step('complex type', async () => {
    const _fun = () => {console.log('mamma');};
    const _sym = Symbol();

    const objToSanitize = {
      str: 999,
      num: '123',
      bool: 0,
      date: '1999-12-31T23:59:59',
      arr: 999,
      arrStr: [ 0, 'b' ],
      arrStr2: 0,
      arrNum: [ '99', '0', 55 ],
      arrNum2: '99',
      arrDate: [ '1999-12-31T23:59:59', new Date('2020-12-31T23:59:59') ],
      arrDate2: '1999-12-31T23:59:59',
      arrBool: [ 0, 'a' ],
      arrBool2: 0,
      arrBoolEmpty: [ ],
      obj: { a: 999 },
      fun: _fun,
      any: 999,
      symbol: _sym,
    };

    const expObj = {
      str: '999',
      num: 123,
      bool: false,
      date: parseJSON('1999-12-31T23:59:59'),
      arr: [999],
      arrStr: [ '0', 'b' ],
      arrStr2: [ '0' ],
      arrNum: [ 99, 0, 55 ],
      arrNum2: [ 99 ],
      arrDate: [ parseJSON('1999-12-31T23:59:59'), new Date('2020-12-31T23:59:59') ],
      arrDate2: [ parseJSON('1999-12-31T23:59:59') ],
      arrBool: [ false, true ],
      arrBool2: [ false ],
      arrBoolEmpty: [ ],
      obj: { a: 999 },
      fun: _fun,
      any: 999,
      symbol: _sym,
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
      obj: S.OBJECT_TYPE,
      fun: S.FUNCTION_TYPE,
      symbol: S.SYMBOL_TYPE,
      any: S.ANY_TYPE,
      extraValueMissingRequiredStr: S.STRING_TYPE,
      extraValueMissingRequiredNum: S.NUMBER_TYPE,
      extraValueMissingRequiredBool: S.BOOLEAN_TYPE,
      extraValueMissingRequiredDate: S.DATE_TYPE,
      extraValueMissingNotRequired: S.STRING_TYPE + '?'
    };

    assertEquals(S.sanitizeObj({ obj: objToSanitize, sanitization: sanitization }), expObj);
  });
});
