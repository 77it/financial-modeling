import { get2 } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('test get2(), get keys from object in a case insensitive way', () => {
  const obj = {
    "a": 999,
    "A": 888,
    "B": 555,
    " C ": 'abc',
    888: 10,
    "999": 20
  }

  assert.deepStrictEqual(get2(obj, 'a'), 999);
  assert.deepStrictEqual(get2(obj, '  A  '), 999);
  assert.deepStrictEqual(get2(obj, 'A'), 888);
  assert.deepStrictEqual(get2(obj, '  B  '), 555);
  assert.deepStrictEqual(get2(obj, 'b'), 555);
  assert.deepStrictEqual(get2(obj, ' C '), 'abc');
  assert.deepStrictEqual(get2(obj, 'c'), 'abc');
  assert.deepStrictEqual(get2(obj, 'd'), undefined);

  // test that get a key from a non object returns undefined
  //@ts-ignore
  assert.deepStrictEqual(get2(null, 'a'), undefined);
  assert.deepStrictEqual(get2([], 'a'), undefined);
  //@ts-ignore
  assert.deepStrictEqual(get2('a', 'a'), undefined);
  //@ts-ignore
  assert.deepStrictEqual(get2(999, 'a'), undefined);
  //@ts-ignore
  assert.deepStrictEqual(get2(true, 'a'), undefined);

  // test that get with non-string key returns undefined
  assert.deepStrictEqual(get2(obj, 888), 10);
  assert.deepStrictEqual(get2(obj, "888"), 10);
  assert.deepStrictEqual(get2(obj, 999), 20);
  assert.deepStrictEqual(get2(obj, "999"), 20);
});
