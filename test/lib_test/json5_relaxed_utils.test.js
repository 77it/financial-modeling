// run with `deno test --allow-import`

import { quoteNumbersAndDatesForRelaxedJSON5 } from '../../src/lib/json5_relaxed_utils.js';
import { eqObj } from '../lib/obj_utils.js';
import { parseJSON5strict } from '../../src/lib/json5.js';
import { Decimal } from '../../vendor/decimaljs/decimal.mjs';
import { sanitize } from '../../src/lib/schema_sanitization_utils.js';
import { parseJsonToLocalDate } from '../../src/lib/date_utils.js';
import * as S from '../../src/lib/schema.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('JSON5 quoteNumbersAndDatesForRelaxedJSON5', () => {
  /** @type {[string, string, any, any][]} */
  const cases = [
    // format is: [input, expected output from quoteNumbersAndDatesForRelaxedJSON5, sanitization, expected parsed and sanitized value]

    // 0) Special number values (kept as-is, not quoted)
    ['Infinity', 'Infinity', S.ANY_TYPE, Infinity],
    ['-Infinity', '-Infinity', S.ANY_TYPE, -Infinity],
    ['NaN', 'NaN', S.ANY_TYPE, NaN],

    // 1) Basic decimals in value positions
    ['123', '"123"', S.DECIMAL_TYPE, toDec('123')],
    ['-42', '"-42"', S.DECIMAL_TYPE, toDec('-42')],
    ['+7', '"7"', S.DECIMAL_TYPE, toDec('7')], // JSON5 allows leading + for numbers; we quote the whole token

    // 2) Floats and leading-dot numbers
    ['0.5', '"0.5"', S.DECIMAL_TYPE, toDec('0.5')],
    ['.75', '".75"', S.DECIMAL_TYPE, toDec('.75')],
    ['-3.14159', '"-3.14159"', S.DECIMAL_TYPE, toDec('-3.14159')],

    // 3) Exponents (with and without signs)
    ['1e3', '"1e3"', S.DECIMAL_TYPE, toDec('1e3')],
    ['2E+10', '"2E+10"', S.DECIMAL_TYPE, toDec('2E+10')],
    ['4.2e-7', '"4.2e-7"', S.DECIMAL_TYPE, toDec('4.2e-7')],
    ['1e1_0', '"1e10"', S.ANY_TYPE, '1e10'],
    ['1e1_0', '"1e10"', S.DECIMAL_TYPE, toDec('1e10')],
    ['{ n:1e1_0 }', '{ n:"1e10" }', S.ANY_TYPE, { n: '1e10' }],
    ['{ n:1e1_0 }', '{ n:"1e10" }', { n: S.DECIMAL_TYPE }, { n: toDec('1e10') }],

    // 3b) Long numbers with and without exponents, also with single and double quotes
    ['123456789012345678901234567890.123456789012345678901234567890E+48', '"123456789012345678901234567890.123456789012345678901234567890E+48"', S.DECIMAL_TYPE, toDec('123456789012345678901234567890.123456789012345678901234567890E+48')],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890E+48 }', '{ n:"123456789012345678901234567890.123456789012345678901234567890E+48" }', S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890E+48' }],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890E+48 }', '{ n:"123456789012345678901234567890.123456789012345678901234567890E+48" }', { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890E+48') }],
    ['123456789012345678901234567890.123456789012345678901234567890', '"123456789012345678901234567890.123456789012345678901234567890"', S.DECIMAL_TYPE, toDec('123456789012345678901234567890.123456789012345678901234567890')],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890 }', '{ n:"123456789012345678901234567890.123456789012345678901234567890" }', S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890' }],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890 }', '{ n:"123456789012345678901234567890.123456789012345678901234567890" }', { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890') }],
    ['{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890' }],
    ['{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890') }],
    ["{ 'n':'123456789012345678901234567890.123456789012345678901234567890' }", "{ 'n':'123456789012345678901234567890.123456789012345678901234567890' }", S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890' }],
    ["{ 'n':'123456789012345678901234567890.123456789012345678901234567890' }", "{ 'n':'123456789012345678901234567890.123456789012345678901234567890' }", { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890') }],

    // 4) Numeric separators: underscores are removed
    ['1_000', '"1000"', S.DECIMAL_TYPE, toDec('1000')],
    ['12_3.4_5e6_7', '"123.45e67"', S.DECIMAL_TYPE, toDec('123.45e67')],
    ['-9_876_543.21_0', '"-9876543.210"', S.DECIMAL_TYPE, toDec('-9876543.210')],

    // 5) Hex numbers (kept as unquoted hex, underscore not removed)
    ['0xFF', '0xFF', S.ANY_TYPE, 0xFF],
    ['0X1a', '0X1a', S.ANY_TYPE, 0X1a],
    ['0X1', '0X1', S.ANY_TYPE, 0X1],
    ['-0x2a', '-0x2a', S.ANY_TYPE, -0x2a],
    ['0xAB_CD', '0xAB_CD', S.ANY_TYPE, null],  // invalid JSON5

    // 6) Identifier tails stop numeric capture; should pass through unchanged (all invalid JSON5)
    ['123abc', '123abc', S.ANY_TYPE, null],
    ['45$var', '45$var', S.ANY_TYPE, null],
    ['45$', '45$', S.ANY_TYPE, null],
    ['99999$666666', '99999$666666', S.ANY_TYPE, null],
    ['0xFFg', '0xFFg', S.ANY_TYPE, null],

    // 7) Keys vs values inside objects (both should be quoted if numeric)
    ['{123:45}', '{123:"45"}', S.ANY_TYPE, null],  // invalid JSON5 key
    ['{"a123":45}', '{"a123":"45"}', { a123: S.DECIMAL_TYPE }, { a123: toDec('45') }],
    ['{a123:45}', '{a123:"45"}', { a123: S.DECIMAL_TYPE }, { a123: toDec('45') }],
    ['{a:123}', '{a:"123"}', { a: S.DECIMAL_TYPE }, { a: toDec('123') }],
    ['{0x1:2e3}', '{0x1:"2e3"}', S.ANY_TYPE, null],  // invalid JSON5 key
    ['{a:-0x1f}', '{a:-0x1f}', S.ANY_TYPE, { a: -0x1f }],

    // 8) Arrays
    ['[1,2,3]', '["1","2","3"]', S.ARRAY_OF_DECIMAL_TYPE, [toDec('1'), toDec('2'), toDec('3')]],
    ['[.5,-.25,1_000]', '[".5","-.25","1000"]', S.ANY_TYPE, ['.5', '-.25', '1000']],
    ['[.5,-.25,2_000]', '[".5","-.25","2000"]', S.ARRAY_OF_DECIMAL_TYPE, [toDec('.5'), toDec('-.25'), toDec('2000')]],
    ['[.5$,123abc,45$var,999,45$,99999$666666,0xFFg]', '[.5$,123abc,45$var,"999",45$,99999$666666,0xFFg]', S.ANY_TYPE, null],

    // 9) Strings remain verbatim, including escapes and embedded digits
    ['"123"', '"123"', S.ANY_TYPE, '123'],
    ['\'456\'', '\'456\'', S.ANY_TYPE, '456'],
    ['"a\\\\b\\nc"', '"a\\\\b\\nc"', S.ANY_TYPE, 'a\\b\nc'],
    ['\'num: 1_000 in string\'', '\'num: 1_000 in string\'', S.ANY_TYPE, 'num: 1_000 in string'],

    // 10) Comments remain verbatim; numbers around them are still transformed
    ['// 123\n123', '// 123\n"123"', S.ANY_TYPE, '123'],
    ['/* 1_2_3 */ 1_2_3', '/* 1_2_3 */ "123"', S.ANY_TYPE, '123'],
    ['{a:1/*x*/2}', '{a:"1"/*x*/"2"}', S.ANY_TYPE, null], // Note: JSON5 doesn't allow multiple values like this
    ['{"a123":45 /* 1_2_3 */} /* 1_2_9 */', '{"a123":"45" /* 1_2_3 */} /* 1_2_9 */', { a123: S.DECIMAL_TYPE }, { a123: toDec('45') }],
    ['[.5,-.25,2_000] /* 1_2_3 */', '[".5","-.25","2000"] /* 1_2_3 */', S.ARRAY_OF_DECIMAL_TYPE, [toDec('.5'), toDec('-.25'), toDec('2000')]],

    // 11) Mixed JSON5 snippet
    [
      '{a:1_000, b:.5, c:2E+3, d:"007", e:0xFFAA, f:-3.14e-2, // end\n g:\'x9\' }',
      '{a:"1000", b:".5", c:"2E+3", d:"007", e:0xFFAA, f:"-3.14e-2", // end\n g:\'x9\' }',
      S.ANY_TYPE,
      { a: '1000', b: '.5', c: '2E+3', d: '007', e: 0xFFAA, f: '-3.14e-2', g: 'x9' }
    ],
    [
      '{a:1_000, b:.5, c:2E+3, d:"007", e:0xFFAA, f:-3.14e-2, // end\n g:\'x9\' }',
      '{a:"1000", b:".5", c:"2E+3", d:"007", e:0xFFAA, f:"-3.14e-2", // end\n g:\'x9\' }',
      { a: S.DECIMAL_TYPE, b: S.DECIMAL_TYPE, c: S.DECIMAL_TYPE, d: S.DECIMAL_TYPE, e: S.DECIMAL_TYPE, f: S.DECIMAL_TYPE, g: S.DECIMAL_TYPE },
      { a: toDec('1000'), b: toDec('.5'), c: toDec('2E+3'), d: toDec('007'), e: toDec(0xFFAA), f: toDec('-3.14e-2'), g: new Decimal(0) }
    ],

    // 12) signed floats and exponents
    ['+1.0e+2', '"1.0e+2"', S.ANY_TYPE, '1.0e+2'],
    ['+1.0e+2', '"1.0e+2"', S.DECIMAL_TYPE, toDec('1.0e+2')],
    ['+.5', '".5"', S.ANY_TYPE, '.5'],
    ['+.5', '".5"', S.DECIMAL_TYPE, toDec('.5')],
    ['-1.0e+2', '"-1.0e+2"', S.ANY_TYPE, '-1.0e+2'],
    ['-1.0e+2', '"-1.0e+2"', S.DECIMAL_TYPE, toDec('-1.0e+2')],
    ['-.5', '"-.5"', S.ANY_TYPE, '-.5'],
    ['-.5', '"-.5"', S.DECIMAL_TYPE, toDec('-.5')],

    // 13) Lone dot or dot without following digits should pass unchanged
    ['.', '.', S.ANY_TYPE, null], // Invalid number
    ['-.', '-.', S.ANY_TYPE, null], // Invalid number

    // 14) Ensure we don't quote inside quotes next to numbers
    ['"x"123"y"', '"x""123""y"', S.ANY_TYPE, null], // Invalid JSON5 syntax
    // The previous expectation needs to reflect transformation; split into a precise form:
    ['"x" 123 "y"', '"x" "123" "y"', S.ANY_TYPE, null], // Invalid JSON5 syntax (multiple values)

    // 15) Complex object with spaces/newlines/tabs
    [
      '{ \n  a : 1_2_3 ,\t b:\n-4.5e-6 , c : "12_3" , d: 0x1ABC \n}',
      '{ \n  a : "123" ,\t b:\n"-4.5e-6" , c : "12_3" , d: 0x1ABC \n}',
      S.ANY_TYPE,
      { a: '123', b: '-4.5e-6', c: '12_3', d: 0x1ABC }
    ],

    // 16) Dates-like strings (should be transformed when unquoted)
    ['"12-25-2023"', '"12-25-2023"', S.ANY_TYPE, '12-25-2023'],  // date not matching regex left as-is
    ['"2023-12-25"', '"2023-12-25"', S.ANY_TYPE, '2023-12-25'],
    ['2023-12-25', '"2023-12-25"', S.ANY_TYPE, '2023-12-25'],  // unquoted -> quoted
    ['2023-12-25', '"2023-12-25"', S.DATE_TYPE, parseJsonToLocalDate('2023-12-25')],  // unquoted -> quoted
    ['"2023/12/25"', '"2023/12/25"', S.ANY_TYPE, '2023/12/25'],
    ['2023/12/25', '"2023/12/25"', S.ANY_TYPE, '2023/12/25'],  // unquoted -> quoted
    ['2023/12/25', '"2023/12/25"', S.DATE_TYPE, parseJsonToLocalDate('2023/12/25')],  // unquoted -> quoted
    ['"2023.12.25"', '"2023.12.25"', S.ANY_TYPE, '2023.12.25'],
    ['2023.12.25', '"2023.12.25"', S.ANY_TYPE, '2023.12.25'],  // unquoted .> quoted
    ['2023.12.25', '"2023.12.25"', S.DATE_TYPE, parseJsonToLocalDate('2023.12.25')],  // unquoted .> quoted
    // ── Date preceding boundary (two negatives, one positive) ─────────────
    // NEGATIVE: date-like sequence in the middle of an identifier → unchanged
    ['foo2024-01-01', 'foo2024-01-01', S.ANY_TYPE, null],
    // NEGATIVE: followed by identifier char → unchanged
    ['2024-01-01X', '2024-01-01X', S.ANY_TYPE, null],
    // POSITIVE: boundary before and after → quoted
    ['{ a:2024-01-01 }', '{ a:"2024-01-01" }', S.ANY_TYPE, { a: '2024-01-01' }],
    ['{ a:2024-01-01 }', '{ a:"2024-01-01" }', { a: S.DATE_TYPE }, { a: parseJsonToLocalDate('2024-01-01') }],
    // Dates that should NOT be quoted (inside identifiers - no proper preceding boundary)
    ['foo2024-01-01', 'foo2024-01-01', S.ANY_TYPE, null],  // date preceded by identifier chars
    ['prefix2024-01-01suffix', 'prefix2024-01-01suffix', S.ANY_TYPE, null],  // date in middle of identifier
    ['myVar2024-01-01', 'myVar2024-01-01', S.ANY_TYPE, null],  // variable name with date
    ['_2024-01-01', '_2024-01-01', S.ANY_TYPE, null],  // underscore prefix (identifier char)
    ['$2024-01-01', '$2024-01-01', S.ANY_TYPE, null],  // dollar prefix (identifier char)
    ['abc2024-01-01T10:30:00Z', 'abc2024-01-01T10:30:00Z', S.ANY_TYPE, null],  // datetime in identifier
    ['"abc2024-01-01T10:30:00Z"', '"abc2024-01-01T10:30:00Z"', S.ANY_TYPE, 'abc2024-01-01T10:30:00Z'],  // datetime in identifier
    ['abc2024-01-01T10:30', 'abc2024-01-01T10:30', S.ANY_TYPE, null],  // datetime in identifier
    ['{"abc2024-01-01T10":30:00Z}', '{"abc2024-01-01T10":"30":00Z}', S.ANY_TYPE, null],  // datetime in identifier; strangely quoted "30" but is good for us because is nonetheless an invalid JSON
    ['{"abc2024-01-01T10":30}', '{"abc2024-01-01T10":"30"}', S.ANY_TYPE, {"abc2024-01-01T10":"30"}],  // datetime in identifier
    ['test2023/12/25', 'test2023/12/25', S.ANY_TYPE, null],  // slash-separated date in identifier
    ['"test2023/12/25"', '"test2023/12/25"', S.ANY_TYPE, 'test2023/12/25'],  // slash-separated date in identifier
    ['var2024.01.01', 'var2024.01.01', S.ANY_TYPE, null],  // dot-separated date in identifier
    // Dates that SHOULD be quoted (proper preceding boundaries)
    ['2024-01-01', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date at start of string
    [' 2024-01-01', ' "2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after space
    ['\t2024-01-01', '\t"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after tab
    ['\n2024-01-01', '\n"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after newline
    ['\r2024-01-01', '\r"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after carriage return
    [':2024-01-01', ':"2024-01-01"', S.ANY_TYPE, null],  // date after colon
    [',2024-01-01', ',"2024-01-01"', S.ANY_TYPE, null],  // date after comma
    ['{2024-01-01', '{2024-01-01', S.ANY_TYPE, null],  // date after opening brace
    ['}2024-01-01', '}"2024-01-01"', S.ANY_TYPE, null],  // date after closing brace
    ['[2024-01-01', '["2024-01-01"', S.ANY_TYPE, null],  // date after opening bracket
    [']2024-01-01', ']"2024-01-01"', S.ANY_TYPE, null],  // date after closing bracket
    // Date-time formats with proper boundaries
    [' 2024-01-01T10:30:00Z', ' "2024-01-01T10:30:00Z"', S.ANY_TYPE, '2024-01-01T10:30:00Z'],  // ISO datetime after space
    [':2024-01-01T10:30:00.123Z', ':"2024-01-01T10:30:00.123Z"', S.ANY_TYPE, null],  // with milliseconds
    [',2024-01-01T10:30:00+05:30', ',"2024-01-01T10:30:00+05:30"', S.ANY_TYPE, null],  // with timezone offset
    // Different date formats with proper boundaries
    [' 2023/12/25', ' "2023/12/25"', S.ANY_TYPE, '2023/12/25'],  // slash-separated after space
    [':2023.12.25', ':"2023.12.25"', S.ANY_TYPE, null],  // dot-separated after colon
    [',2023-12-25T23:59:59', ',"2023-12-25T23:59:59"', S.ANY_TYPE, null],  // end of day
    // Mixed scenarios in JSON-like structures
    ['key: 2024-01-01', 'key: "2024-01-01"', S.ANY_TYPE, null],  // object value
    ['[2023-12-31, 2024-01-01]', '["2023-12-31", "2024-01-01"]', S.ANY_TYPE, ["2023-12-31", "2024-01-01"]],  // array elements
    ['{start: 2024-01-01, end: 2024-12-31}', '{start: "2024-01-01", end: "2024-12-31"}', S.ANY_TYPE, {start: "2024-01-01", end: "2024-12-31"}],  // object properties
    // Edge cases with multiple dates
    ['valid: 2024-01-01, invalid_prefix2024-01-02', 'valid: "2024-01-01", invalid_prefix2024-01-02', S.ANY_TYPE, null],  // mixed boundaries
    [' 2024-01-01 and prefix2024-01-02', ' "2024-01-01" and prefix2024-01-02', S.ANY_TYPE, null],  // space vs identifier prefix
    // Dates already in strings (should remain unchanged)
    ['"2024-01-01"', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // already quoted date
    ['"prefix2024-01-01"', '"prefix2024-01-01"', S.ANY_TYPE, 'prefix2024-01-01'],  // identifier with date in quotes
    // Invalid date patterns (should not be processed regardless of boundary)
    [' 2024-13-45', ' "2024-13-45"', S.ANY_TYPE, '2024-13-45'],  // invalid date values
    ['abc2024-13-45', 'abc2024-13-45', S.ANY_TYPE, null],  // invalid date in identifier
    // Boundary edge cases
    ['()2024-01-01', '()2024-01-01', S.ANY_TYPE, null],  // parentheses (not in JSON syntax table)
    ['<>2024-01-01', '<>2024-01-01', S.ANY_TYPE, null],  // angle brackets (not in JSON syntax table)
    ['+=2024-01-01', '+=2024-01-01', S.ANY_TYPE, null],  // operators (not in JSON syntax table)

    // 17) ISO date strings (should be transformed when unquoted)
    ['"2023-12-25T10:30:00Z"', '"2023-12-25T10:30:00Z"', S.ANY_TYPE, '2023-12-25T10:30:00Z'],
    ['2023-12-25T10:30:00Z', '"2023-12-25T10:30:00Z"', S.ANY_TYPE, '2023-12-25T10:30:00Z'],
    ['2023-12-25T10:30:00Z', '"2023-12-25T10:30:00Z"', S.DATE_TYPE, parseJsonToLocalDate('2023-12-25T10:30:00Z')],
    ['"2023-12-25T10:30:00.123Z"', '"2023-12-25T10:30:00.123Z"', S.ANY_TYPE, '2023-12-25T10:30:00.123Z'],
    ['2023-12-25T10:30:00.123Z', '"2023-12-25T10:30:00.123Z"', S.ANY_TYPE, '2023-12-25T10:30:00.123Z'],
    ['2023-12-25T10:30:00.123Z', '"2023-12-25T10:30:00.123Z"', S.DATE_TYPE, parseJsonToLocalDate('2023-12-25T10:30:00.123Z')],

    // 18) Version numbers (should NOT be transformed)
    ['"1.2.3"', '"1.2.3"', S.ANY_TYPE, '1.2.3'],
    ['1.2.3', '1.2.3', S.ANY_TYPE, null],
    ['"v2.1.0"', '"v2.1.0"', S.ANY_TYPE, 'v2.1.0'],
    ['v2.1.0', 'v2.1.0', S.ANY_TYPE, null],

    // 19) IP addresses (should NOT be transformed)
    ['"192.168.1.1"', '"192.168.1.1"', S.ANY_TYPE, '192.168.1.1'],
    ['192.168.1.1', '192.168.1.1', S.ANY_TYPE, null],
    ['"127.0.0.1"', '"127.0.0.1"', S.ANY_TYPE, '127.0.0.1'],
    ['127.0.0.1', '127.0.0.1', S.ANY_TYPE, null],

    // 20) Phone numbers (should NOT be transformed)
    ['"+1-555-123-4567"', '"+1-555-123-4567"', S.ANY_TYPE, '+1-555-123-4567'],
    ['+1-555-123-4567', '+1-555-123-4567', S.ANY_TYPE, null],
    ['"(555) 123-4567"', '"(555) 123-4567"', S.ANY_TYPE, '(555) 123-4567'],
    ['(555) 123-4567', '(555) 123-4567', S.ANY_TYPE, null],

    // 21) Edge cases with dots
    ['0.', '"0."', S.ANY_TYPE, "0."],
    ['0.', '"0."', S.DECIMAL_TYPE, toDec("0.")],
    ['.0', '".0"', S.ANY_TYPE, ".0"],
    ['.0', '".0"', S.DECIMAL_TYPE, toDec(".0")],
    ['1.', '"1."', S.ANY_TYPE, "1."],
    ['1.', '"1."', S.DECIMAL_TYPE, toDec("1.")],
    ['.123', '".123"', S.ANY_TYPE, ".123"],
    ['.123', '".123"', S.DECIMAL_TYPE, toDec(".123")],

    // 22) Very large numbers
    ['9999999999999999999999999999999', '"9999999999999999999999999999999"', S.DECIMAL_TYPE, toDec("9999999999999999999999999999999")],
    ['1e308', '"1e308"', S.DECIMAL_TYPE, toDec("1e308")],
    ['1e-308', '"1e-308"', S.DECIMAL_TYPE, toDec("1e-308")],

    // 23) Zero variations
    ['0', '"0"', S.DECIMAL_TYPE, toDec("0")],
    ['-0', '"-0"', S.DECIMAL_TYPE, toDec("-0")],
    ['+0', '"0"', S.DECIMAL_TYPE, toDec("0")],
    ['0.0', '"0.0"', S.DECIMAL_TYPE, toDec("0.0")],
    ['00', '"00"', S.DECIMAL_TYPE, toDec("00")], // Leading zeros

    // 24) Binary-like strings (should NOT be parsed as numbers)
    ['0b1010', '0b1010', S.ANY_TYPE, null], // invalid JSON5
    ['0B1111', '0B1111', S.ANY_TYPE, null], // invalid JSON5

    // 25) Octal-like strings (should NOT be parsed as numbers)
    ['0o777', '0o777', S.ANY_TYPE, null], // invalid JSON5
    ['0O755', '0O755', S.ANY_TYPE, null], // invalid JSON5

    // 26) Numbers in different contexts
    ['{count: 42, items: [1, 2, 3]}', '{count: "42", items: ["1", "2", "3"]}', S.ANY_TYPE, { count: "42", items: ["1", "2", "3"] }],
    ['{"temperature": -273.15}', '{"temperature": "-273.15"}', S.ANY_TYPE, { temperature: "-273.15" }],
    ['{a: 123, b: 0xFF}', '{a: "123", b: 0xFF}', S.ANY_TYPE, { a: '123', b: 0xFF }],
    ['[1, 2.5, -3e2]', '["1", "2.5", "-3e2"]', S.ANY_TYPE, ['1', '2.5', '-3e2']],
    ['{count: 1_000, hex: 0xABCD}', '{count: "1000", hex: 0xABCD}', S.ANY_TYPE, { count: '1000', hex: 0xABCD }],

    // 27) Complex nested structures
    [
      '{users: [{id: 1, age: 25}, {id: 2, age: 30}]}',
      '{users: [{id: "1", age: "25"}, {id: "2", age: "30"}]}',
      S.ANY_TYPE,
      { users: [{ id: "1", age: "25" }, { id: "2", age: "30" }] }
    ],

    // 28) Invalid number formats (should pass through unchanged)
    ['123.', '"123."', S.DECIMAL_TYPE, toDec("123.")], // Trailing dot is valid
    ['123..456', '123..456', S.ANY_TYPE, null], // Double dot is invalid
    ['123.456.789', '123.456.789', S.ANY_TYPE, null], // Multiple dots is invalid
    ['123ee456', '123ee456', S.ANY_TYPE, null],
    ['123e', '123e', S.ANY_TYPE, null],
    ['123e+', '123e+', S.ANY_TYPE, null],

    // 29) Unicode and special characters (should NOT interfere)
    ['"café"', '"café"', S.ANY_TYPE, 'café'],
    ['"测试"', '"测试"', S.ANY_TYPE, '测试'],
    ['"🎉"', '"🎉"', S.ANY_TYPE, '🎉'],

    // 30) Empty and whitespace cases
    ['', '', S.ANY_TYPE, null],
    ['  123  ', '  "123"  ', S.ANY_TYPE, "123"],
    ['  123  ', '  "123"  ', S.DECIMAL_TYPE, toDec("123")],
    ['\t\n123\r\n', '\t\n"123"\r\n', S.ANY_TYPE, "123"],
    ['\t\n123\r\n', '\t\n"123"\r\n', S.DECIMAL_TYPE, toDec("123")],

    // 31) Boolean and null values (should NOT be transformed)
    ['true', 'true', S.ANY_TYPE, true],
    ['false', 'false', S.ANY_TYPE, false],
    ['null', 'null', S.ANY_TYPE, null],
    ['{enabled: true, count: 0}', '{enabled: true, count: "0"}', S.ANY_TYPE, { enabled: true, count: "0" }],

    // 32) Identifiers and property names (should NOT be transformed)
    ['hello', 'hello', S.ANY_TYPE, null], // Identifier, not a number
    ['{hello: 123}', '{hello: "123"}', S.ANY_TYPE, { hello: "123" }],
    ['{hello: 1234}', '{hello: "1234"}', { hello: S.DECIMAL_TYPE }, { hello: toDec("1234") }],
    ['$var', '$var', S.ANY_TYPE, null], // Valid identifier starting with $
    ['_private', '_private', S.ANY_TYPE, null], // Valid identifier starting with _

    // 33) Scientific notation edge cases
    ['1E10', '"1E10"', S.ANY_TYPE, "1E10"],
    ['1E10', '"1E10"', S.DECIMAL_TYPE, toDec("1E10")],
    ['1e-10', '"1e-10"', S.ANY_TYPE, "1e-10"],
    ['1e-10', '"1e-10"', S.DECIMAL_TYPE, toDec("1e-10")],
    ['2.5e+3', '"2.5e+3"', S.ANY_TYPE, "2.5e+3"],
    ['2.5e+3', '"2.5e+3"', S.DECIMAL_TYPE, toDec("2.5e+3")],
    ['2.5E-3', '"2.5E-3"', S.ANY_TYPE, "2.5E-3"],
    ['2.5E-3', '"2.5E-3"', S.DECIMAL_TYPE, toDec("2.5E-3")],

    // 34) Hex number edge cases
    ['0x0', '0x0', S.ANY_TYPE, 0x0],
    ['0XFF', '0XFF', S.ANY_TYPE, 0XFF],
    ['0xabc', '0xabc', S.ANY_TYPE, 0xabc],
    ['0XDEF', '0XDEF', S.ANY_TYPE, 0XDEF],

    // 35) Numbers with trailing characters that make them invalid
    ['123px', '123px', S.ANY_TYPE, null], // CSS-like unit
    ['45deg', '45deg', S.ANY_TYPE, null], // CSS-like unit
    ['100%', '100%', S.ANY_TYPE, null], // Percentage
    ['$100', '$100', S.ANY_TYPE, null], // Currency
  ];

  const errors = [];

  for (const [input, expectedQuotedJSON5, sanitization, expectedParsedAndSanitized] of cases) {
    const quotedJSON5 = quoteNumbersAndDatesForRelaxedJSON5(input);
    const parsed = (() => {try { return parseJSON5strict(quotedJSON5); } catch { return null; }})();
    if (quotedJSON5 !== expectedQuotedJSON5) {
      errors.push(`For Input:\n${input}\nGot:\n${quotedJSON5}\nExpected:\n${expectedQuotedJSON5}\n`);
    }
    const parsedAnsSanitized = sanitize({ value: parsed, sanitization });
    if (!eqObj(parsedAnsSanitized, expectedParsedAndSanitized)) {
      errors.push(`For Input:\n${input}\nParsed and Sanitized Value:\n${JSON.stringify(parsedAnsSanitized)}\nExpected Parsed and Sanitized Value:\n${JSON.stringify(expectedParsedAndSanitized)}`);
    }
  }
  if (errors.length) {
    console.error(errors.join('\n\n'));
  }
  assert(errors.length === 0, 'Errors found (see console)');

  /**
   * Convert a value to Decimal, or return null if not possible
   * @param {*} val
   * @return {*|null}
   */
  function toDec (val) {
    try {
      return new Decimal(val);
    } catch {
      return null;
    }
  }
});
