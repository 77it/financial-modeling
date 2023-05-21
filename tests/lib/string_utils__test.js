import {isNullOrWhiteSpace, isEmptyOrWhiteSpace, lowerCaseCompare, toStringLowerCaseTrimCompare} from '../../src/lib/string_utils.js';
import {toUTC} from '../../src/lib/date_utils.js';

import {assert, assertEquals, assertFalse, assertStrictEquals, assertThrows} from '../deps.js';

Deno.test('test isNullOrWhiteSpace()', (t) => {
    assert(isNullOrWhiteSpace(null));
    assert(isNullOrWhiteSpace(undefined));
    assert(isNullOrWhiteSpace(''));
    assert(isNullOrWhiteSpace('     '));

    assertFalse(isNullOrWhiteSpace('a'));
    assertFalse(isNullOrWhiteSpace(99));
    assertFalse(isNullOrWhiteSpace({}));
    assertFalse(isNullOrWhiteSpace(Symbol()));
    class C {}
    assertFalse(isNullOrWhiteSpace(new C()));
});

Deno.test('test isEmptyOrWhiteSpace()', (t) => {
    assertFalse(isEmptyOrWhiteSpace(null));
    assertFalse(isEmptyOrWhiteSpace(undefined));
    assert(isEmptyOrWhiteSpace(''));
    assert(isEmptyOrWhiteSpace('     '));

    assertFalse(isEmptyOrWhiteSpace('a'));
    assertFalse(isEmptyOrWhiteSpace(99));
    assertFalse(isEmptyOrWhiteSpace({}));
    assertFalse(isEmptyOrWhiteSpace(Symbol()));
    class C {}
    assertFalse(isEmptyOrWhiteSpace(new C()));
});

Deno.test('test lowerCaseCompare()', (t) => {
    assert(lowerCaseCompare('a', 'a'));  // a = a
    assert(lowerCaseCompare('AaA', 'aAa'));  // AaA' = aAa
    assertFalse(lowerCaseCompare('a', 'á'));  // a != á
    assertFalse(lowerCaseCompare('a', 'b'));  // a != b
    //@ts-ignore
    assertFalse(lowerCaseCompare('a', null));
    //@ts-ignore
    assertFalse(lowerCaseCompare('a', 99));
    //@ts-ignore
    assertFalse(lowerCaseCompare(undefined, null));
    //@ts-ignore
    assertFalse(lowerCaseCompare(88, 99));
});

Deno.test('test toStringLowerCaseTrimCompare()', (t) => {
    assert(toStringLowerCaseTrimCompare('a', 'a'));
    assert(toStringLowerCaseTrimCompare('123', 123));  // number to string
    assert(toStringLowerCaseTrimCompare('  123  ', 123));  // number to string
    assert(toStringLowerCaseTrimCompare(123, '123'));  // number to string
    assert(toStringLowerCaseTrimCompare(123, '  123  '));  // number to string
    assert(toStringLowerCaseTrimCompare({ }, ''));
    assert(toStringLowerCaseTrimCompare({ a: 123 }, ''));
    assert(toStringLowerCaseTrimCompare(new Date(2025, 11, 25), '2025-12-25T00:00:00.000Z'));
});
