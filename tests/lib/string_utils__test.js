import {isNullOrWhiteSpace, isEmptyOrWhiteSpace, toStringLowerCaseTrim} from '../../src/lib/string_utils.js';

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

Deno.test('test toStringLowerCaseTrim()', (t) => {
    assertEquals(toStringLowerCaseTrim('a'), 'a');
    assertEquals(toStringLowerCaseTrim('123'), '123');  // number to string
    assertEquals(toStringLowerCaseTrim('  123  '), '123');  // number to string
    assertEquals(toStringLowerCaseTrim(123), '123');  // number to string
    assertEquals(toStringLowerCaseTrim({ }), '');
    assertEquals(toStringLowerCaseTrim({ a: 123 }), '');
    assertEquals(toStringLowerCaseTrim(new Date(2025, 11, 25)), '2025-12-25t00:00:00.000z');
});
