import { isNullOrWhiteSpace, DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace } from '../../src/lib/string_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('test isNullOrWhiteSpace()', () => {
  assert(isNullOrWhiteSpace(null));
  assert(isNullOrWhiteSpace(undefined));
  assert(isNullOrWhiteSpace(''));
  assert(isNullOrWhiteSpace('     '));

  assert(!isNullOrWhiteSpace('a'));
  assert(!isNullOrWhiteSpace(99));
  assert(!isNullOrWhiteSpace({}));
  assert(!isNullOrWhiteSpace(Symbol()));

  class C {}

  assert(!isNullOrWhiteSpace(new C()));
});

t('test DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace()', () => {
  assert(!DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(null));
  assert(!DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(undefined));
  assert(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(''));
  assert(DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace('     '));

  assert(!DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace('a'));
  assert(!DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(99));
  assert(!DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace({}));
  assert(!DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(Symbol()));

  class C {}

  assert(!DONT_USE_use_instead_isNullOrWhiteSpace____isEmptyOrWhiteSpace(new C()));
});
