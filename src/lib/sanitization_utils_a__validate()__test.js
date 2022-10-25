// @ts-nocheck

import { sanitize } from './sanitization_utils.js';
import { format } from 'https://deno.land/std@0.148.0/node/util.ts';


import {
  assert,
  assertEquals,
  assertFalse,
  assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';


Deno.test('test convertValueToManyTypes in many scenarios', () => {
// {}, same as undefined
  let value = {};
  let converted = sanitize(value);
  assertEquals('{ str: \'undefined\', num: NaN, date: Invalid Date, bool: false }', format(converted));

// undefined
  value = undefined;
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{ str: \'undefined\', num: NaN, date: Invalid Date, bool: false }', format(converted));

// undefined, invalid values sanitized'
  value = undefined;
  converted = sanitize({ str: value, num: value, bool: value, date: value }, true);
  assertEquals('{ str: \'\', num: 0, date: 1970-01-01T00:00:00.000Z, bool: false }', format(converted));

// null
  value = null;
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{ str: \'null\', num: 0, date: 1970-01-01T00:00:00.000Z, bool: false }', format(converted));

// 0
  value = 0;
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{ str: \'0\', num: 0, date: 1970-01-01T00:00:00.000Z, bool: false }', format(converted));

// NaN
  value = NaN;
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{ str: \'NaN\', num: NaN, date: Invalid Date, bool: false }', format(converted));

// NaN sanitized
  value = NaN;
  converted = sanitize({ str: value, num: value, bool: value, date: value }, true);
  assertEquals('{ str: \'\', num: 0, date: 1970-01-01T00:00:00.000Z, bool: false }', format(converted));

// infinity
  value = 1/0;
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{ str: \'Infinity\', num: Infinity, date: Invalid Date, bool: true }', format(converted));

// infinity sanitized
  value = 1/0;
  converted = sanitize({ str: value, num: value, bool: value, date: value }, true);
  assertEquals('{ str: \'Infinity\', num: 0, date: 1970-01-01T00:00:00.000Z, bool: true }', format(converted));

// foo
  value = 'foo';
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{ str: \'foo\', num: NaN, date: Invalid Date, bool: true }', format(converted));

// ''
  value = '';
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{ str: \'\', num: 0, date: Invalid Date, bool: false }', format(converted));

// whitespaces sanitized
  value = '     ';
  converted = sanitize({ str: value, num: value, bool: value, date: value }, true);
  assertEquals('{ str: \'\', num: 0, date: 1970-01-01T00:00:00.000Z, bool: true }', format(converted));

  // new Date.UTC(2022, 11, 25)
  value = new Date(Date.UTC(2022, 11, 25));
  converted = sanitize({ str: value, num: value, bool: value, date: value });
  assertEquals('{\n  str: \'Sun Dec 25 2022 01:00:00 GMT+0100 (Ora standard dell’Europa centrale)\',\n  num: 1671926400000,\n  date: 2022-12-25T00:00:00.000Z,\n  bool: true\n}', format(converted));
});
//#endregion

Deno.test('NaN and Invalid Date tests comparisons', () => {
// check a number with a test that must return true, otherwise false is always returned for invalid numbers
//#region NaN tests  // NaN is different to everything, also to itself
  assert(isNaN(NaN));
  assertFalse(NaN < 0);
  assertFalse(NaN > 0);
  assertFalse(NaN === 0);
  assertFalse(NaN === NaN);
//#endregion

// check a date with a test that must return true, otherwise false is always returned for invalid dates
//#region Invalid Date tests  // Invalid Date is different to everything
  const invalidDate = new Date('bla bla bla');
  const goodDate = new Date(Date.UTC(2022, 11, 25));
  assert(isNaN(invalidDate.getTime()));  // see https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript/1353711#1353711
  assertFalse(invalidDate < goodDate);
  assertFalse(invalidDate > goodDate);
  assertFalse(invalidDate === goodDate);
//#endregion
});
