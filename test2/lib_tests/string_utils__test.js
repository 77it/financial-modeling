import { isNullOrWhiteSpace, DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace } from '../../src/lib/string_utils.js';

import { assert, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';

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

Deno.test('test DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace()', (t) => {
  assertFalse(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(null));
  assertFalse(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(undefined));
  assert(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(''));
  assert(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace('     '));

  assertFalse(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace('a'));
  assertFalse(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(99));
  assertFalse(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace({}));
  assertFalse(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(Symbol()));

  class C {}

  assertFalse(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(new C()));
});
