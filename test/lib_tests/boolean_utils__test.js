import { isStringOrBooleanTrue, isStringOrBooleanFalse } from '../../src/lib/boolean_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

t('test isStringOrBooleanTrue()', () => {
    // test boolean
    assert(isStringOrBooleanTrue(true));
    assert(!isStringOrBooleanTrue(false));

    // test string
    assert(isStringOrBooleanTrue('true'));
    assert(isStringOrBooleanTrue('   true   '));
    assert(isStringOrBooleanTrue('   TRUE   '));
    assert(!isStringOrBooleanTrue('false'));
    assert(!isStringOrBooleanTrue('   false   '));
    assert(!isStringOrBooleanTrue('   FALSE   '));
    assert(!isStringOrBooleanTrue('gigi'));

    // test other types
    assert(!isStringOrBooleanTrue(null));
    assert(!isStringOrBooleanTrue(undefined));
    assert(!isStringOrBooleanTrue(''));
    assert(!isStringOrBooleanTrue('     '));

    assert(!isStringOrBooleanTrue('a'));
    assert(!isStringOrBooleanTrue(99));
    assert(!isStringOrBooleanTrue({}));
    assert(!isStringOrBooleanTrue(Symbol()));
    class C {}
    assert(!isStringOrBooleanTrue(new C()));
});

t('test isStringOrBooleanFalse()', () => {
    // test boolean
    assert(!isStringOrBooleanFalse(true));
    assert(isStringOrBooleanFalse(false));

    // test string
    assert(!isStringOrBooleanFalse('true'));
    assert(!isStringOrBooleanFalse('   true   '));
    assert(!isStringOrBooleanFalse('   TRUE   '));
    assert(isStringOrBooleanFalse('false'));
    assert(isStringOrBooleanFalse('   false   '));
    assert(isStringOrBooleanFalse('   FALSE   '));
    assert(!isStringOrBooleanFalse('gigi'));

    // test other types
    assert(!isStringOrBooleanFalse(null));
    assert(!isStringOrBooleanFalse(undefined));
    assert(!isStringOrBooleanFalse(''));
    assert(!isStringOrBooleanFalse('     '));

    assert(!isStringOrBooleanFalse('a'));
    assert(!isStringOrBooleanFalse(99));
    assert(!isStringOrBooleanFalse({}));
    assert(!isStringOrBooleanFalse(Symbol()));
    class C {}
    assert(!isStringOrBooleanFalse(new C()));
});
