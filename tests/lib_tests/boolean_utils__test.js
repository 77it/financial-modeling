import { isStringOrBooleanTrue, isStringOrBooleanFalse } from '../../src/lib/boolean_utils.js';

import {assert, assertEquals, assertFalse, assertStrictEquals, assertThrows} from '../deps.js';

Deno.test('test isStringOrBooleanTrue()', (t) => {
    // test boolean
    assert(isStringOrBooleanTrue(true));
    assertFalse(isStringOrBooleanTrue(false));

    // test string
    assert(isStringOrBooleanTrue('true'));
    assert(isStringOrBooleanTrue('   true   '));
    assert(isStringOrBooleanTrue('   TRUE   '));
    assertFalse(isStringOrBooleanTrue('false'));
    assertFalse(isStringOrBooleanTrue('   false   '));
    assertFalse(isStringOrBooleanTrue('   FALSE   '));
    assertFalse(isStringOrBooleanTrue('gigi'));

    // test other types
    assertFalse(isStringOrBooleanTrue(null));
    assertFalse(isStringOrBooleanTrue(undefined));
    assertFalse(isStringOrBooleanTrue(''));
    assertFalse(isStringOrBooleanTrue('     '));

    assertFalse(isStringOrBooleanTrue('a'));
    assertFalse(isStringOrBooleanTrue(99));
    assertFalse(isStringOrBooleanTrue({}));
    assertFalse(isStringOrBooleanTrue(Symbol()));
    class C {}
    assertFalse(isStringOrBooleanTrue(new C()));
});

Deno.test('test isStringOrBooleanFalse()', (t) => {
    // test boolean
    assertFalse(isStringOrBooleanFalse(true));
    assert(isStringOrBooleanFalse(false));

    // test string
    assertFalse(isStringOrBooleanFalse('true'));
    assertFalse(isStringOrBooleanFalse('   true   '));
    assertFalse(isStringOrBooleanFalse('   TRUE   '));
    assert(isStringOrBooleanFalse('false'));
    assert(isStringOrBooleanFalse('   false   '));
    assert(isStringOrBooleanFalse('   FALSE   '));
    assertFalse(isStringOrBooleanFalse('gigi'));

    // test other types
    assertFalse(isStringOrBooleanFalse(null));
    assertFalse(isStringOrBooleanFalse(undefined));
    assertFalse(isStringOrBooleanFalse(''));
    assertFalse(isStringOrBooleanFalse('     '));

    assertFalse(isStringOrBooleanFalse('a'));
    assertFalse(isStringOrBooleanFalse(99));
    assertFalse(isStringOrBooleanFalse({}));
    assertFalse(isStringOrBooleanFalse(Symbol()));
    class C {}
    assertFalse(isStringOrBooleanFalse(new C()));
});
