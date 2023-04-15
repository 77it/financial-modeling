import {isNullOrWhiteSpace, lowerCaseCompare} from '../../src/lib/string_utils.js';

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
