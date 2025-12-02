// run with `deno test --allow-import`

import { quoteKeysNumbersAndDatesForRelaxedJSON } from '../../src/lib/json_relaxed_utils_x.js';
import { FORMULA_MARKER } from '../../vendor/formula/modules/formula-marker.js';

import { parseJSONrelaxed } from '../../src/lib/json.js';
import { eqObj } from '../lib/obj_utils.js';
import { Decimal } from '../../vendor/decimaljs/decimal.mjs';
import { sanitize } from '../../src/lib/schema_sanitization_utils.js';
import { parseTextToLocalDate } from '../../src/lib/date_utils.js';
import * as S from '../../src/lib/schema.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

// Generate the JSON-escaped form of FORMULA_MARKER for use in test expectations
const FM = JSON.stringify(FORMULA_MARKER).slice(1, -1);
const FM2 = FORMULA_MARKER;  // raw form for expected parsed values

t('JSON quoteKeysNumbersAndDatesForRelaxedJSON', () => {
  /** @type {[string, string, any, any][]} */
  const cases = [
    // format is: [input, expected output from quoteKeysNumbersAndDatesForRelaxedJSON, sanitization, expected parsed and sanitized value]

    // 0) Special number values (should be treated as barewords with markers)
    ['Infinity', `"${FM}Infinity"`, S.ANY_TYPE, `${FM2}Infinity`],
    ['-Infinity', `"${FM}-Infinity"`, S.ANY_TYPE, `${FM2}-Infinity`],
    ['NaN', `"${FM}NaN"`, S.ANY_TYPE, `${FM2}NaN`],

    // 1) Basic decimals in value positions
    ['123', '"123"', S.DECIMAL_TYPE, toDec('123')],
    ['-42', '"-42"', S.DECIMAL_TYPE, toDec('-42')],
    ['+7', '"7"', S.DECIMAL_TYPE, toDec('7')],

    // 2) Floats and leading-dot numbers
    ['0.5', '"0.5"', S.DECIMAL_TYPE, toDec('0.5')],
    ['.75', '".75"', S.DECIMAL_TYPE, toDec('.75')],
    ['-3.14159', '"-3.14159"', S.DECIMAL_TYPE, toDec('-3.14159')],

    // 3) Exponents (with and without signs)
    ['1e3', '"1e3"', S.DECIMAL_TYPE, toDec('1e3')],
    ['9.99999999999999E+48', '"9.99999999999999E+48"', S.DECIMAL_TYPE, toDec('9.99999999999999E+48')],
    ['2E+10', '"2E+10"', S.DECIMAL_TYPE, toDec('2E+10')],
    ['4.2e-7', '"4.2e-7"', S.DECIMAL_TYPE, toDec('4.2e-7')],
    ['1e1_0', '"1e10"', S.ANY_TYPE, '1e10'],
    ['1e1_0', '"1e10"', S.DECIMAL_TYPE, toDec('1e10')],
    ['{ n:1e1_0 }', '{ "n":"1e10" }', S.ANY_TYPE, { n: '1e10' }],
    ['{ n:1e1_0 }', '{ "n":"1e10" }', { n: S.DECIMAL_TYPE }, { n: toDec('1e10') }],

    // 3b) Long numbers with and without exponents, also with single quotes
    ['123456789012345678901234567890.123456789012345678901234567890E+48', '"123456789012345678901234567890.123456789012345678901234567890E+48"', S.DECIMAL_TYPE, toDec('123456789012345678901234567890.123456789012345678901234567890E+48')],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890E+48 }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890E+48" }', S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890E+48' }],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890E+48 }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890E+48" }', { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890E+48') }],
    ['123456789012345678901234567890.123456789012345678901234567890', '"123456789012345678901234567890.123456789012345678901234567890"', S.DECIMAL_TYPE, toDec('123456789012345678901234567890.123456789012345678901234567890')],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890 }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890' }],
    ['{ n:123456789012345678901234567890.123456789012345678901234567890 }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890') }],
    ['{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890' }],
    ['{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890') }],
    ["{ 'n':'123456789012345678901234567890.123456789012345678901234567890' }", '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', S.ANY_TYPE, { n: '123456789012345678901234567890.123456789012345678901234567890' }],
    ["{ 'n':'123456789012345678901234567890.123456789012345678901234567890' }", '{ "n":"123456789012345678901234567890.123456789012345678901234567890" }', { n: S.DECIMAL_TYPE }, { n: toDec('123456789012345678901234567890.123456789012345678901234567890') }],

    // 4) Numeric separators: underscores are removed
    ['1_000', '"1000"', S.DECIMAL_TYPE, toDec('1000')],
    ['12_3.4_5e6_7', '"123.45e67"', S.DECIMAL_TYPE, toDec('123.45e67')],
    ['-9_876_543.21_0', '"-9876543.210"', S.DECIMAL_TYPE, toDec('-9876543.210')],

    // 5) Hex numbers (should be treated as barewords with markers)
    ['0xFF', `"${FM}0xFF"`, S.ANY_TYPE, `${FM2}0xFF`],
    ['0X1a', `"${FM}0X1a"`, S.ANY_TYPE, `${FM2}0X1a`],
    ['0X1', `"${FM}0X1"`, S.ANY_TYPE, `${FM2}0X1`],
    ['-0x2a', `"${FM}-0x2a"`, S.ANY_TYPE, `${FM2}-0x2a`],
    ['0xAB_CD', `"${FM}0xAB_CD"`, S.ANY_TYPE, `${FM2}0xAB_CD`],

    // 6) Identifier tails stop numeric capture; treated as barewords with marker
    ['123abc', `"${FM}123abc"`, S.ANY_TYPE, `${FM2}123abc`],
    ['45$var', `"${FM}45$var"`, S.ANY_TYPE, `${FM2}45$var`],
    ['45$', `"${FM}45$"`, S.ANY_TYPE, `${FM2}45$`],
    ['99999$666666', `"${FM}99999$666666"`, S.ANY_TYPE, `${FM2}99999$666666`],
    ['0xFFg', `"${FM}0xFFg"`, S.ANY_TYPE, `${FM2}0xFFg`],

    // 7) Keys vs values inside objects (both should be quoted if numeric)
    ['{123:45}', '{"123":"45"}', S.ANY_TYPE, { "123": "45"}],
    ['{"a123":45}', '{"a123":"45"}', { a123: S.DECIMAL_TYPE }, { a123: toDec('45') }],
    ['{a123:45}', '{"a123":"45"}', { a123: S.DECIMAL_TYPE }, { a123: toDec('45') }],
    ['{a:123}', '{"a":"123"}', { a: S.DECIMAL_TYPE }, { a: toDec('123') }],
    ['{0x1:2e3}', '{"0x1":"2e3"}', S.ANY_TYPE, { "0x1": "2e3" }],
    ['{a:-0x1f}', `{"a":"${FM}-0x1f"}`, S.ANY_TYPE, { a: `${FM2}-0x1f` }],

    // 7a) object same as 7) with single quote
    ["{'a123':45}", '{"a123":"45"}', { a123: S.DECIMAL_TYPE }, { a123: toDec('45') }],

    // 7b) Keys with spaces, underscores, quotes inside objects; values with spaces and multiple words
    ['{a:mamma}', `{"a":"${FM}mamma"}`, S.ANY_TYPE, { a: `${FM2}mamma` }],
    ['{a:mamma_mamma.mamma#mamma}', `{"a":"${FM}mamma_mamma.mamma#mamma"}`, S.ANY_TYPE, { a: `${FM2}mamma_mamma.mamma#mamma` }],
    ['{a:mamma_mamma}', `{"a":"${FM}mamma_mamma"}`, S.ANY_TYPE, { a: `${FM2}mamma_mamma` }],
    ['{a:mamma.mamma}', `{"a":"${FM}mamma.mamma"}`, S.ANY_TYPE, { a: `${FM2}mamma.mamma` }],
    ['{a:mamma#mamma}', `{"a":"${FM}mamma#mamma"}`, S.ANY_TYPE, { a: `${FM2}mamma#mamma` }],
    ['{a: 11, d: (2025-8-1), z: 999}', `{"a": "11", "d": "${FM}(2025-8-1)", "z": "999"}`, S.ANY_TYPE, {"a": "11", "d": `${FM2}(2025-8-1)`, "z": "999"}],
    ['{a: 11, d: "(2025-8-1)", z: 999}', '{"a": "11", "d": "(2025-8-1)", "z": "999"}', S.ANY_TYPE, {"a": "11", "d": "(2025-8-1)", "z": "999"}],
    ['{a_b_c:mamma babbo}', `{"a_b_c":"${FM}mamma babbo"}`, S.ANY_TYPE, {"a_b_c":`${FM2}mamma babbo`}],
    ['{a_b_c:"mamma babbo"}', '{"a_b_c":"mamma babbo"}', S.ANY_TYPE, {"a_b_c":"mamma babbo"}],
    ['{ "pino lino" :mamma babbo}', `{ "pino lino" :"${FM}mamma babbo"}`, S.ANY_TYPE, {"pino lino":`${FM2}mamma babbo`}],
    ['{ "pino lino" :"mamma babbo"}', '{ "pino lino" :"mamma babbo"}', S.ANY_TYPE, {"pino lino":"mamma babbo"}],

    // 7c) object same as 7b) test with single quote
    ["{a_b_c:'mamma babbo'}", '{"a_b_c":"mamma babbo"}', S.ANY_TYPE, {"a_b_c":"mamma babbo"}],
    ["{ 'pino lino' :mamma babbo}", `{ "pino lino" :"${FM}mamma babbo"}`, S.ANY_TYPE, {"pino lino":`${FM2}mamma babbo`}],
    ["{ 'pino lino' :'mamma babbo'}", '{ "pino lino" :"mamma babbo"}', S.ANY_TYPE, {"pino lino":"mamma babbo"}],

    // 8) Arrays
    ['[1,2,3]', '["1","2","3"]', S.ARRAY_OF_DECIMAL_TYPE, [toDec('1'), toDec('2'), toDec('3')]],
    ['[.5,-.25,1_000]', '[".5","-.25","1000"]', S.ANY_TYPE, ['.5', '-.25', '1000']],
    ['[.5,-.25,2_000]', '[".5","-.25","2000"]', S.ARRAY_OF_DECIMAL_TYPE, [toDec('.5'), toDec('-.25'), toDec('2000')]],
    ['[.5$,123abc,45$var,999,45$,99999$666666,0xFFg]', `["${FM}.5$","${FM}123abc","${FM}45$var","999","${FM}45$","${FM}99999$666666","${FM}0xFFg"]`, S.ANY_TYPE, [`${FM2}.5$`,`${FM2}123abc`,`${FM2}45$var`,"999",`${FM2}45$`,`${FM2}99999$666666`,`${FM2}0xFFg`]],

    // 9) Strings remain verbatim, including escapes and embedded digits
    ['"123"', '"123"', S.ANY_TYPE, '123'],
    ['\'456\'', '"456"', S.ANY_TYPE, '456'],
    ['"a\\\\b\\nc"', '"a\\\\b\\nc"', S.ANY_TYPE, 'a\\b\nc'],
    ['\'num: 1_000 in string\'', '"num: 1_000 in string"', S.ANY_TYPE, 'num: 1_000 in string'],

    // 10) Comments remain verbatim; numbers around them are still transformed
    ['// 123\n123', '"123"', S.ANY_TYPE, '123'],
    ['/* 1_2_3 */ 1_2_3', '"123"', S.ANY_TYPE, '123'],
    ['{a:1/*x*/2}', '{"a":"1""2"}', S.ANY_TYPE, null], // Note: JSON doesn't allow multiple values like this
    ['{"a123":45 /* 1_2_3 */} /* 1_2_9 */', '{"a123":"45" }', { a123: S.DECIMAL_TYPE }, { a123: toDec('45') }],
    ['[.5,-.25,2_000] /* 1_2_3 */', '[".5","-.25","2000"]', S.ARRAY_OF_DECIMAL_TYPE, [toDec('.5'), toDec('-.25'), toDec('2000')]],
    ['/* 1_2_3 */[/* 1_2_3 */.5,/* 1_2_3 */-.25,/* 1_2_3 */2_000/* 1_2_3 */]/* 1_2_3 */', '[".5","-.25","2000"]', S.ARRAY_OF_DECIMAL_TYPE, [toDec('.5'), toDec('-.25'), toDec('2000')]],

    // 11) Mixed JSON5 snippet
    [
      '{a:1_000, b:.5, c:2E+3, d:"007", e:0xFFAA, f:-3.14e-2, // first\n g:\'x9\'/*last*/,\n h:x9 }',
      `{"a":"1000", "b":".5", "c":"2E+3", "d":"007", "e":"${FM}0xFFAA", "f":"-3.14e-2", \n "g":"x9",\n "h":"${FM}x9" }`,
      S.ANY_TYPE,
      { a: '1000', b: '.5', c: '2E+3', d: '007', e: `${FM2}0xFFAA`, f: '-3.14e-2', g: 'x9', h: `${FM2}x9` }
    ],
    [
      '{a:2_000, b:.5, c:2E+3, d:"007", e:0xFFAA, f:-3.14e-2, // end\n g:\'x9\' }',
      `{"a":"2000", "b":".5", "c":"2E+3", "d":"007", "e":"${FM}0xFFAA", "f":"-3.14e-2", \n "g":"x9" }`,
      { a: S.DECIMAL_TYPE, b: S.DECIMAL_TYPE, c: S.DECIMAL_TYPE, d: S.DECIMAL_TYPE, e: S.DECIMAL_TYPE, f: S.DECIMAL_TYPE, g: S.DECIMAL_TYPE },
      { a: toDec('2000'), b: toDec('.5'), c: toDec('2E+3'), d: toDec('007'), e: new Decimal(0), f: toDec('-3.14e-2'), g: new Decimal(0) }
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
    ['.', `"${FM}."`, S.ANY_TYPE, `${FM2}.`], // Invalid number - not pure decimal
    ['-.', `"${FM}-."`, S.ANY_TYPE, `${FM2}-.`], // Invalid number - not pure decimal

    // 14) Ensure we don't quote inside quotes next to numbers
    ['"x"123"y"', '"x""123""y"', S.ANY_TYPE, null], // Invalid JSON5 syntax
    // The previous expectation needs to reflect transformation; split into a precise form:
    ['"x" 123 "y"', '"x" "123" "y"', S.ANY_TYPE, null], // Invalid JSON5 syntax (multiple values)
    // unquoted string is quoted as entire value with marker
    ['x 123 y', `"${FM}x 123 y"`, S.ANY_TYPE, `${FM2}x 123 y`],

    // 15) complex objects
    ['{a: q(mam ma)}', `{"a": "${FM}q(mam ma)"}`, S.ANY_TYPE, {"a": `${FM2}q(mam ma)`}],
    ['{a: q({b:mam ma})}', `{"a": "${FM}q({b:mam ma})"}`, S.ANY_TYPE, {"a": `${FM2}q({b:mam ma})`}],
    ['{a: q({b:"mam ma"})}', `{"a": "${FM}q({b:\\"mam ma\\"})"}`, S.ANY_TYPE, {"a": `${FM2}q({b:"mam ma"})`}],
    [`{a: q({b:'mam ma'})}`, `{"a": "${FM}q({b:\\"mam ma\\"})"}`, S.ANY_TYPE, {"a": `${FM2}q({b:"mam ma"})`}],
    ['{a: 10 + 1 * 1 + 9*0, b: mam ma, c: null, d: 2025-12-31}', `{"a": "${FM}10 + 1 * 1 + 9*0", "b": "${FM}mam ma", "c": null, "d": "2025-12-31"}`, S.ANY_TYPE, {"a": `${FM2}10 + 1 * 1 + 9*0`, "b": `${FM2}mam ma`, "c": null, "d": "2025-12-31"}],
    [`{a: 9 * q(10) + 1 * 1 + 9*0, b: 10 + q({x: mam ma, h: q({i: 55, j: ciao gino})}), c: null, d: 2025-12-31, e: {f: 555, g: "pap pa"}, f: 9 * q("10") + q('iii') + 1 * 1 + 9*0}`, `{"a": "${FM}9 * q(10) + 1 * 1 + 9*0", "b": "${FM}10 + q({x: mam ma, h: q({i: 55, j: ciao gino})})", "c": null, "d": "2025-12-31", "e": {"f": "555", "g": "pap pa"}, "f": "${FM}9 * q(\\"10\\") + q('iii') + 1 * 1 + 9*0"}`, S.ANY_TYPE, {"a": `${FM2}9 * q(10) + 1 * 1 + 9*0`, "b": `${FM2}10 + q({x: mam ma, h: q({i: 55, j: ciao gino})})`, "c": null, "d": "2025-12-31", "e": {"f": "555", "g": "pap pa"}, f: `${FM2}9 * q("10") + q('iii') + 1 * 1 + 9*0`}],
    ['{a: q(10) + 1 * 1 + 9*0, b: q(20 + q(30 + q(50))), c: null, d: 2025-12-31, e: {f: 555, g: "pap pa"}}', `{"a": "${FM}q(10) + 1 * 1 + 9*0", "b": "${FM}q(20 + q(30 + q(50)))", "c": null, "d": "2025-12-31", "e": {"f": "555", "g": "pap pa"}}`, S.ANY_TYPE, {"a": `${FM2}q(10) + 1 * 1 + 9*0`, "b": `${FM2}q(20 + q(30 + q(50)))`, "c": null, "d": "2025-12-31", "e": {"f": "555", "g": "pap pa"}}],
    ['{a: 10, b: sum({x: 1, y: "988_444_444_333_333_222_111.999_888_77777", z: 10}), c: 300_888_777_666_555_444_333_222_111}', `{"a": "10", "b": "${FM}sum({x: 1, y: \\"988_444_444_333_333_222_111.999_888_77777\\", z: 10})", "c": "300888777666555444333222111"}`, S.ANY_TYPE, {"a": "10", "b": `${FM2}sum({x: 1, y: "988_444_444_333_333_222_111.999_888_77777", z: 10})`, "c": "300888777666555444333222111"}],

    // 15b) Complex object with spaces/newlines/tabs, also with single quote
    [
      '{ \n  a : 1_2_3 ,\t b:\n-4.5e-6 , c : "12_3" , d: 0x1ABC \n}',
      `{ \n  "a" : "123" ,\t "b":\n"-4.5e-6" , "c" : "12_3" , "d": "${FM}0x1ABC" \n}`,
      S.ANY_TYPE,
      { a: '123', b: '-4.5e-6', c: '12_3', d: `${FM2}0x1ABC` }
    ],
    [
      "{ \n  'a' : '1_2_3' ,\t 'b':\n'-4.5e-6' , c : '12_3' , 'd': '0x1ABC' \n}",
      '{ \n  "a" : "1_2_3" ,\t "b":\n"-4.5e-6" , "c" : "12_3" , "d": "0x1ABC" \n}',
      S.ANY_TYPE,
      { a: '1_2_3', b: '-4.5e-6', c: '12_3', d: "0x1ABC" }
    ],

    // 16) Dates-like strings (should be transformed when unquoted)
    ['"12-25-2023"', '"12-25-2023"', S.ANY_TYPE, '12-25-2023'],  // date not matching regex left as-is
    ['"2023-12-25"', '"2023-12-25"', S.ANY_TYPE, '2023-12-25'],
    ['2023-12-25', '"2023-12-25"', S.ANY_TYPE, '2023-12-25'],  // unquoted -> quoted
    ['2023-12-25', '"2023-12-25"', S.DATE_TYPE, parseTextToLocalDate('2023-12-25')],  // unquoted -> quoted
    ['"2023/12/25"', '"2023/12/25"', S.ANY_TYPE, '2023/12/25'],
    ['2023/12/25', '"2023/12/25"', S.ANY_TYPE, '2023/12/25'],  // unquoted -> quoted
    ['2023/12/25', '"2023/12/25"', S.DATE_TYPE, parseTextToLocalDate('2023/12/25')],  // unquoted -> quoted
    ['"2023.12.25"', '"2023.12.25"', S.ANY_TYPE, '2023.12.25'],
    ['2023.12.25', '"2023.12.25"', S.ANY_TYPE, '2023.12.25'],  // unquoted .> quoted
    ['2023.12.25', '"2023.12.25"', S.DATE_TYPE, parseTextToLocalDate('2023.12.25')],  // unquoted .> quoted
    // ── Date preceding boundary (two negatives, one positive) ─────────────
    // POSITIVE: boundary before and after → quoted
    ['{ a:2024-01-01 }', '{ "a":"2024-01-01" }', S.ANY_TYPE, { a: '2024-01-01' }],
    ['{ a:2024-01-01 }', '{ "a":"2024-01-01" }', { a: S.DATE_TYPE }, { a: parseTextToLocalDate('2024-01-01') }],
    // Dates that should NOT be quoted (inside identifiers - no proper preceding boundary) - treated as barewords with marker
    ['2024-01-01X', `"${FM}2024-01-01X"`, S.ANY_TYPE, `${FM2}2024-01-01X`],  // date followed by identifier chars
    ['foo2024-01-01', `"${FM}foo2024-01-01"`, S.ANY_TYPE, `${FM2}foo2024-01-01`],  // date preceded by identifier chars
    ['prefix2024-01-01suffix', `"${FM}prefix2024-01-01suffix"`, S.ANY_TYPE, `${FM2}prefix2024-01-01suffix`],  // date in middle of identifier
    ['myVar2024-01-01', `"${FM}myVar2024-01-01"`, S.ANY_TYPE, `${FM2}myVar2024-01-01`],  // variable name with date
    ['_2024-01-01', `"${FM}_2024-01-01"`, S.ANY_TYPE, `${FM2}_2024-01-01`],  // underscore prefix (identifier char)
    ['$2024-01-01', `"${FM}$2024-01-01"`, S.ANY_TYPE, `${FM2}$2024-01-01`],  // dollar prefix (identifier char)
    ['abc2024-01-01T10:30:00Z', `"${FM}abc2024-01-01T10:30:00Z"`, S.ANY_TYPE, `${FM2}abc2024-01-01T10:30:00Z`],  // datetime with : in identifier without quotes (treated as single bareword)
    ['"abc2024-01-01T10:30:00Z"', '"abc2024-01-01T10:30:00Z"', S.ANY_TYPE, 'abc2024-01-01T10:30:00Z'],  // datetime in identifier
    ['abc2024-01-01T10:30', `"${FM}abc2024-01-01T10:30"`, S.ANY_TYPE, `${FM2}abc2024-01-01T10:30`],  // datetime with : in identifier without quotes (treated as single bareword)
    ['{"abc2024-01-01T10":30:00Z}', `{"abc2024-01-01T10":"${FM}30:00Z"}`, S.ANY_TYPE, {"abc2024-01-01T10":`${FM2}30:00Z`}],  // colon is part of value when inside object
    ['{"abc2024-01-01T10":30}', '{"abc2024-01-01T10":"30"}', S.ANY_TYPE, {"abc2024-01-01T10":"30"}],  // datetime in identifier
    ['test2023/12/25', `"${FM}test2023/12/25"`, S.ANY_TYPE, `${FM2}test2023/12/25`],  // slash-separated date in identifier (treated as single bareword)
    ['"test2023/12/25"', '"test2023/12/25"', S.ANY_TYPE, 'test2023/12/25'],  // slash-separated date in identifier
    ['var2024.01.01', `"${FM}var2024.01.01"`, S.ANY_TYPE, `${FM2}var2024.01.01`],  // dot-separated date in identifier
    // Dates that SHOULD be quoted (proper preceding boundaries)
    ['2024-01-01', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date at start of string
    [' 2024-01-01', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after space
    ['\t2024-01-01', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after tab
    ['\n2024-01-01', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after newline
    ['\r2024-01-01', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // date after carriage return
    [':2024-01-01', ':"2024-01-01"', S.ANY_TYPE, null],  // date after colon
    [',2024-01-01', ',"2024-01-01"', S.ANY_TYPE, null],  // date after comma
    ['{2024-01-01', '{"2024-01-01"', S.ANY_TYPE, null],  // date after opening brace
    ['}2024-01-01', '}"2024-01-01"', S.ANY_TYPE, null],  // date after closing brace
    ['[2024-01-01', '["2024-01-01"', S.ANY_TYPE, null],  // date after opening bracket
    [']2024-01-01', ']"2024-01-01"', S.ANY_TYPE, null],  // date after closing bracket
    // Date-time formats with proper boundaries
    [' 2024-01-01T10:30:00Z', '"2024-01-01T10:30:00Z"', S.ANY_TYPE, '2024-01-01T10:30:00Z'],  // ISO datetime after space
    [':2024-01-01T10:30:00.123Z', ':"2024-01-01T10:30:00.123Z"', S.ANY_TYPE, null],  // with milliseconds
    [',2024-01-01T10:30:00+05:30', ',"2024-01-01T10:30:00+05:30"', S.ANY_TYPE, null],  // with timezone offset
    // Different date formats with proper boundaries
    [' 2023/12/25', '"2023/12/25"', S.ANY_TYPE, '2023/12/25'],  // slash-separated after space
    [':2023.12.25', ':"2023.12.25"', S.ANY_TYPE, null],  // dot-separated after colon
    [',2023-12-25T23:59:59', ',"2023-12-25T23:59:59"', S.ANY_TYPE, null],  // end of day
    // Mixed separators in dates (INVALID - should be treated as barewords with formula marker)
    ['2025-12.11', `"${FM}2025-12.11"`, S.ANY_TYPE, `${FM2}2025-12.11`],  // dash then dot - invalid
    ['2025/12-11', `"${FM}2025/12-11"`, S.ANY_TYPE, `${FM2}2025/12-11`],  // slash then dash - invalid
    ['2025.12/11', `"${FM}2025.12/11"`, S.ANY_TYPE, `${FM2}2025.12/11`],  // dot then slash - invalid
    ['2025-12/11', `"${FM}2025-12/11"`, S.ANY_TYPE, `${FM2}2025-12/11`],  // dash then slash - invalid
    ['2025/12.11', `"${FM}2025/12.11"`, S.ANY_TYPE, `${FM2}2025/12.11`],  // slash then dot - invalid
    ['2025.12-11', `"${FM}2025.12-11"`, S.ANY_TYPE, `${FM2}2025.12-11`],  // dot then dash - invalid
    // Consistent separators (VALID - should be recognized as dates)
    ['2025-12-11', '"2025-12-11"', S.ANY_TYPE, '2025-12-11'],  // all dash - valid
    ['2025-12-11', '"2025-12-11"', S.DATE_TYPE, parseTextToLocalDate('2025-12-11')],  // all dash - valid date
    ['2025/12/11', '"2025/12/11"', S.ANY_TYPE, '2025/12/11'],  // all slash - valid
    ['2025/12/11', '"2025/12/11"', S.DATE_TYPE, parseTextToLocalDate('2025/12/11')],  // all slash - valid date
    ['2025.12.11', '"2025.12.11"', S.ANY_TYPE, '2025.12.11'],  // all dot - valid
    ['2025.12.11', '"2025.12.11"', S.DATE_TYPE, parseTextToLocalDate('2025.12.11')],  // all dot - valid date
    // Mixed scenarios in JSON-like structures
    ['key: 2024-01-01', `"${FM}key: 2024-01-01"`, S.ANY_TYPE, `${FM2}key: 2024-01-01`],  // colon is part of bareword at top level
    ['[2023-12-31, 2024-01-01]', '["2023-12-31", "2024-01-01"]', S.ANY_TYPE, ["2023-12-31", "2024-01-01"]],  // array elements
    ['{start: 2024-01-01, end: 2024-12-31}', '{"start": "2024-01-01", "end": "2024-12-31"}', S.ANY_TYPE, {start: "2024-01-01", end: "2024-12-31"}],  // object properties
    // Edge cases with multiple dates
    ['valid: 2024-01-01, invalid_prefix2024-01-02', `"${FM}valid: 2024-01-01, invalid_prefix2024-01-02"`, S.ANY_TYPE, `${FM2}valid: 2024-01-01, invalid_prefix2024-01-02`],  // comma/colon are part of bareword at top level
    [' 2024-01-01 and prefix2024-01-02', `"${FM}2024-01-01 and prefix2024-01-02"`, S.ANY_TYPE, `${FM2}2024-01-01 and prefix2024-01-02`],  // entire value as single bareword with marker
    // Dates already in strings (should remain unchanged)
    ['"2024-01-01"', '"2024-01-01"', S.ANY_TYPE, '2024-01-01'],  // already quoted date
    ['"prefix2024-01-01"', '"prefix2024-01-01"', S.ANY_TYPE, 'prefix2024-01-01'],  // identifier with date in quotes
    // Invalid date patterns (should not be processed regardless of boundary)
    [' 2024-13-45', '"2024-13-45"', S.ANY_TYPE, '2024-13-45'],  // invalid date values
    ['abc2024-13-45', `"${FM}abc2024-13-45"`, S.ANY_TYPE, `${FM2}abc2024-13-45`],  // invalid date in identifier - bareword
    // Boundary edge cases
    ['()2024-01-01', `"${FM}()2024-01-01"`, S.ANY_TYPE, `${FM2}()2024-01-01`],  // parentheses (not in JSON syntax table) - bareword
    ['<>2024-01-01', `"${FM}<>2024-01-01"`, S.ANY_TYPE, `${FM2}<>2024-01-01`],  // angle brackets (not in JSON syntax table) - bareword
    ['+=2024-01-01', `"${FM}+=2024-01-01"`, S.ANY_TYPE, `${FM2}+=2024-01-01`],  // operators (not in JSON syntax table) - bareword

    // 17) ISO date strings (should be transformed when unquoted)
    ['"2023-12-25T10:30:00Z"', '"2023-12-25T10:30:00Z"', S.ANY_TYPE, '2023-12-25T10:30:00Z'],
    ['2023-12-25T10:30:00Z', '"2023-12-25T10:30:00Z"', S.ANY_TYPE, '2023-12-25T10:30:00Z'],
    ['2023-12-25T10:30:00Z', '"2023-12-25T10:30:00Z"', S.DATE_TYPE, parseTextToLocalDate('2023-12-25T10:30:00Z')],
    ['"2023-12-25T10:30:00.123Z"', '"2023-12-25T10:30:00.123Z"', S.ANY_TYPE, '2023-12-25T10:30:00.123Z'],
    ['2023-12-25T10:30:00.123Z', '"2023-12-25T10:30:00.123Z"', S.ANY_TYPE, '2023-12-25T10:30:00.123Z'],
    ['2023-12-25T10:30:00.123Z', '"2023-12-25T10:30:00.123Z"', S.DATE_TYPE, parseTextToLocalDate('2023-12-25T10:30:00.123Z')],

    // 18) Version numbers
    ['"1.2.3"', '"1.2.3"', S.ANY_TYPE, '1.2.3'],
    ['1.2.3', `"${FM}1.2.3"`, S.ANY_TYPE, `${FM2}1.2.3`],  // not a valid decimal number
    ['"v2.1.0"', '"v2.1.0"', S.ANY_TYPE, 'v2.1.0'],
    ['v2.1.0', `"${FM}v2.1.0"`, S.ANY_TYPE, `${FM2}v2.1.0`],  // not a number

    // 19) IP addresses
    ['"192.168.1.1"', '"192.168.1.1"', S.ANY_TYPE, '192.168.1.1'],
    ['192.168.1.1', `"${FM}192.168.1.1"`, S.ANY_TYPE, `${FM2}192.168.1.1`],  // not a valid decimal number
    ['"127.0.0.1"', '"127.0.0.1"', S.ANY_TYPE, '127.0.0.1'],
    ['127.0.0.1', `"${FM}127.0.0.1"`, S.ANY_TYPE, `${FM2}127.0.0.1`],  // not a valid decimal number

    // 20) Phone numbers
    ['"+1-555-123-4567"', '"+1-555-123-4567"', S.ANY_TYPE, '+1-555-123-4567'],
    ['+1-555-123-4567', `"${FM}+1-555-123-4567"`, S.ANY_TYPE, `${FM2}+1-555-123-4567`],  // not a number
    ['"(555) 123-4567"', '"(555) 123-4567"', S.ANY_TYPE, '(555) 123-4567'],
    ['(555) 123-4567', `"${FM}(555) 123-4567"`, S.ANY_TYPE, `${FM2}(555) 123-4567`],  // not a number

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

    // 24) Binary-like strings (should be treated as barewords with markers)
    ['0b1010', `"${FM}0b1010"`, S.ANY_TYPE, `${FM2}0b1010`],
    ['0B1111', `"${FM}0B1111"`, S.ANY_TYPE, `${FM2}0B1111`],

    // 25) Octal-like strings (should be treated as barewords with markers)
    ['0o777', `"${FM}0o777"`, S.ANY_TYPE, `${FM2}0o777`],
    ['0O755', `"${FM}0O755"`, S.ANY_TYPE, `${FM2}0O755`],

    // 26) Numbers in different contexts
    ['{count: 42, items: [1, 2, 3]}', '{"count": "42", "items": ["1", "2", "3"]}', S.ANY_TYPE, { count: "42", items: ["1", "2", "3"] }],
    ['{"temperature": -273.15}', '{"temperature": "-273.15"}', S.ANY_TYPE, { temperature: "-273.15" }],
    ['{a: 123, b: 0xFF}', `{"a": "123", "b": "${FM}0xFF"}`, S.ANY_TYPE, { a: '123', b: `${FM2}0xFF` }],
    ['[1, 2.5, -3e2]', '["1", "2.5", "-3e2"]', S.ANY_TYPE, ['1', '2.5', '-3e2']],
    ['{count: 1_000, hex: 0xABCD}', `{"count": "1000", "hex": "${FM}0xABCD"}`, S.ANY_TYPE, { count: '1000', hex: `${FM2}0xABCD` }],

    // 27) Complex nested structures, also with single quotes (objects)
    [`{a: mam ma, b: {c: "ciao ciao", d: 'bye bye', e: 777} }`, `{"a": "${FM}mam ma", "b": {"c": "ciao ciao", "d": "bye bye", "e": "777"} }`, S.ANY_TYPE, {a: `${FM2}mam ma`, b: {c: "ciao ciao", d: "bye bye", e: "777"} }],
    [
      `{users: [{id: 1, age: 25}, {id: 2, age: {a: 666, b: ma mm a, c: 'ciao ciao'}}]}`,
      `{"users": [{"id": "1", "age": "25"}, {"id": "2", "age": {"a": "666", "b": "${FM}ma mm a", "c": "ciao ciao"}}]}`,
      S.ANY_TYPE,
      { users: [{ id: "1", age: "25" }, { id: "2", age: {a: "666", b: `${FM2}ma mm a`, c: "ciao ciao"} }] }
    ],
    [
      "{'users': [{'id': '1', 'age': '25'}, {'id': '2', 'age': '30'}]}",
      '{"users": [{"id": "1", "age": "25"}, {"id": "2", "age": "30"}]}',
      S.ANY_TYPE,
      { users: [{ id: "1", age: "25" }, { id: "2", age: "30" }] }
    ],

    // 28) Invalid number formats (should pass through with marker)
    ['123.', '"123."', S.DECIMAL_TYPE, toDec("123.")],
    ['123..456', `"${FM}123..456"`, S.ANY_TYPE, `${FM2}123..456`],  // invalid - multiple dots
    ['123.456.789', `"${FM}123.456.789"`, S.ANY_TYPE, `${FM2}123.456.789`],  // invalid - multiple dots
    ['123ee456', `"${FM}123ee456"`, S.ANY_TYPE, `${FM2}123ee456`],  // invalid - multiple e
    ['123e', `"${FM}123e"`, S.ANY_TYPE, `${FM2}123e`],  // invalid - incomplete exponent
    ['123e+', `"${FM}123e+"`, S.ANY_TYPE, `${FM2}123e+`],  // invalid - incomplete exponent

    // 29) Unicode and special characters (should NOT interfere)
    ['"café"', '"café"', S.ANY_TYPE, 'café'],
    ['"测试"', '"测试"', S.ANY_TYPE, '测试'],
    ['"🎉"', '"🎉"', S.ANY_TYPE, '🎉'],

    // 30) Empty and whitespace cases
    ['', '', S.ANY_TYPE, null],
    ['  123  ', '"123"', S.ANY_TYPE, "123"],
    ['  123  ', '"123"', S.DECIMAL_TYPE, toDec("123")],
    ['\t\n123\r\n', '"123"', S.ANY_TYPE, "123"],
    ['\t\n123\r\n', '"123"', S.DECIMAL_TYPE, toDec("123")],

    // 31) Boolean and null values (should NOT be transformed)
    ['true', 'true', S.ANY_TYPE, true],
    ['false', 'false', S.ANY_TYPE, false],
    ['null', 'null', S.ANY_TYPE, null],
    ['{enabled: true, count: 0}', '{"enabled": true, "count": "0"}', S.ANY_TYPE, { enabled: true, count: "0" }],

    // 32) Identifiers and property names (objects and not)
    ['hello', `"${FM}hello"`, S.ANY_TYPE, `${FM2}hello`], // Identifier, not a number
    ['{hello: 123}', '{"hello": "123"}', S.ANY_TYPE, { hello: "123" }],
    ["{'hello': '123'}", '{"hello": "123"}', S.ANY_TYPE, { hello: "123" }],
    ['{hello: 1234}', '{"hello": "1234"}', { hello: S.DECIMAL_TYPE }, { hello: toDec("1234") }],
    ['$var', `"${FM}$var"`, S.ANY_TYPE, `${FM2}$var`], // Valid identifier starting with $
    ['_private', `"${FM}_private"`, S.ANY_TYPE, `${FM2}_private`], // Valid identifier starting with _

    // 33) Scientific notation edge cases
    ['1E10', '"1E10"', S.ANY_TYPE, "1E10"],
    ['1E10', '"1E10"', S.DECIMAL_TYPE, toDec("1E10")],
    ['1e-10', '"1e-10"', S.ANY_TYPE, "1e-10"],
    ['1e-10', '"1e-10"', S.DECIMAL_TYPE, toDec("1e-10")],
    ['2.5e+3', '"2.5e+3"', S.ANY_TYPE, "2.5e+3"],
    ['2.5e+3', '"2.5e+3"', S.DECIMAL_TYPE, toDec("2.5e+3")],
    ['2.5E-3', '"2.5E-3"', S.ANY_TYPE, "2.5E-3"],
    ['2.5E-3', '"2.5E-3"', S.DECIMAL_TYPE, toDec("2.5E-3")],

    // 34) Hex number edge cases (should be treated as barewords with markers)
    ['0x0', `"${FM}0x0"`, S.ANY_TYPE, `${FM2}0x0`],
    ['0XFF', `"${FM}0XFF"`, S.ANY_TYPE, `${FM2}0XFF`],
    ['0xabc', `"${FM}0xabc"`, S.ANY_TYPE, `${FM2}0xabc`],
    ['0XDEF', `"${FM}0XDEF"`, S.ANY_TYPE, `${FM2}0XDEF`],

    // 35) Numbers with trailing characters that make them invalid
    ['123px', `"${FM}123px"`, S.ANY_TYPE, `${FM2}123px`], // CSS-like unit
    ['45deg', `"${FM}45deg"`, S.ANY_TYPE, `${FM2}45deg`], // CSS-like unit
    ['100%', `"${FM}100%"`, S.ANY_TYPE, `${FM2}100%`], // Percentage
    ['$100', `"${FM}$100"`, S.ANY_TYPE, `${FM2}$100`], // Currency
  ];

  const errors = [];

  for (const [input, expectedQuotedJSON, sanitization, expectedParsedAndSanitized] of cases) {
    // Enable advanced formula parsing for inputs that contain function calls like q({...})
    const needsAdvancedParsing = /\w+\s*\(/.test(input);
    const quotedJSON = quoteKeysNumbersAndDatesForRelaxedJSON(input, FORMULA_MARKER, needsAdvancedParsing);
    const parsed = (() => {try { return JSON.parse(quotedJSON); } catch { return null; }})();
    if (quotedJSON !== expectedQuotedJSON) {
      //const gotCharCodes = Array.from(quotedJSON).map(c => c.charCodeAt(0)).join(', ');
      //const expectedCharCodes = Array.from(expectedQuotedJSON).map(c => c.charCodeAt(0)).join(', ');
      //errors.push(`For Input:\n${input}\nGot:\n${quotedJSON}\nGot char codes: ${gotCharCodes}\nExpected:\n${expectedQuotedJSON}\nExpected char codes: ${expectedCharCodes}\n`);
      errors.push(`For Input:\n${input}\nGot:\n${quotedJSON}\nExpected:\n${expectedQuotedJSON}\n`);
    }
    const parsedAnsSanitized = sanitize({ value: parsed, sanitization });
    if (!eqObj(parsedAnsSanitized, expectedParsedAndSanitized)) {
      errors.push(`For Input:\n${input}\nParsed and Sanitized Value:\n${JSON.stringify(parsedAnsSanitized)}\nExpected Parsed and Sanitized Value:\n${JSON.stringify(expectedParsedAndSanitized)}`);
    }
    // if parsed === null check that if the parsing had been done with `parseJSONrelaxed` the result would be the input itself
    if (parsed === null && input !== 'null') {
      const parsedRelaxed = parseJSONrelaxed(input, FORMULA_MARKER);
      if (parsedRelaxed !== input) {
        errors.push(`For Input:\n${input}\nParsing failed after quoting, and relaxed parsing gave different result from input:\n${parsedRelaxed}\nExpected (same as input)`);
      }
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
