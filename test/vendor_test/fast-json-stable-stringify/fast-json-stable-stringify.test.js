// from https://github.com/77it/fast-json-stable-stringify/tree/master/test

/*
fast-json-stable-stringify, MIT license, 311 stars, last update 2020-07-15
Deterministic JSON.stringify() - a faster version of @substack's json-stable-strigify without jsonify.
You can also pass in a custom comparison function.

https://github.com/77it/fast-json-stable-stringify
https://github.com/epoberezkin/fast-json-stable-stringify

https://cdn.jsdelivr.net/npm/fast-json-stable-stringify@2.1.0/index.min.js
https://www.jsdelivr.com/package/npm/fast-json-stable-stringify?tab=files

https://www.npmjs.com/package/fast-json-stable-stringify
 */

import { stringify } from '../../../vendor/fast-json-stable-stringify/fast-json-stable-stringify.js';

import { test } from 'node:test';
import assert from 'node:assert';

/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('nested', () => {
  const obj = { c: 8, b: [{z:6,y:5,x:4},7], a: 3 };
  assert.deepStrictEqual(stringify(obj), '{"a":3,"b":[{"x":4,"y":5,"z":6},7],"c":8}');
});

t('cyclic (default)', () => {
  const one = { a: 1 };
  //@ts-ignore two is not defined in one
  one.two = { a: 2, one: one };
  try {
    stringify(one);
  } catch (ex) {
    //@ts-ignore ex is of type unknown
    assert(ex.toString().includes('TypeError: Converting circular structure to JSON'));
  }
});

t('cyclic (specifically allowed)', () => {
  const one = { a: 1 };
  //@ts-ignore
  one.two = { a: 2, one: one };
  assert.deepStrictEqual(stringify(one, {cycles:true}), '{"a":1,"two":{"a":2,"one":"__cycle__"}}');
});

t('repeated non-cyclic value', () => {
  const one = { x: 1 };
  const two = { a: one, b: one };
  assert.deepStrictEqual(stringify(two), '{"a":{"x":1},"b":{"x":1}}');
});

t('acyclic but with reused obj-property pointers', () => {
  const x = { a: 1 };
  const y = { b: x, c: x };
  assert.deepStrictEqual(stringify(y), '{"b":{"a":1},"c":{"a":1}}');
});
