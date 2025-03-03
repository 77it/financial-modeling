// @ts-nocheck

import { deepFreeze } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('test deepFreeze() on object: not allowed to add or edit elements', () => {
  const a = {};
  a.a = 99;
  a.b = 55;
  a.c = {};
  a.c.a = 88;
  a.c.b = 77;
  a.c.e = [1, 2, 3, 4, 5];

  deepFreeze(a);

  // editing a property
  assert.throws(() => {
    a.a = 100;
  });

  // editing an inner property
  assert.throws(() => {
    a.c.a = 100;
  });

  // adding a property
  assert.throws(() => {
    a.d = 100;
  });

  // adding an element to an array
  assert.throws(() => {
    a.c.e.push(6);
  });
});

t('test deepFreeze() on map: NOT FROZEN; IS ALLOWED to add or replace key values; is NOT allowed to edit values', () => {
  const a = new Map();
  a.set('a', 99);
  a.set('b', 55);
  a.set('c', {a: 88, b: 77, e: [1, 2, 3, 4, 5]});

  deepFreeze(a);

  // adding a key is allowed
  a.set('d', 99);
  assert.deepStrictEqual(a.get('d'), 99);

  // replacing a key is allowed
  a.set('a', '100');
  assert.deepStrictEqual(a.get('a'), '100');

  // editing an inner property of an object is not allowed
  assert.throws(() => {
    a.get('c').a = 100;
  });

  // adding an element to an array is not allowed
  assert.throws(() => {
    a.get('c').e.push(6);
  });
});

t('test deepFreeze() on array: not allowed to add or edit elements', () => {
  const arr = [1, 2, { a: 999 }, 4, 5, []];
  deepFreeze(arr);

  // adding an element to an array
  assert.throws(() => { arr.push(6); });

  // editing an inner property
  assert.throws(() => { arr[2].a = 100; });

  // editing an inner array
  assert.throws(() => { arr[5].push(5); });
});

t('test deepFreeze() function: after deepFreeze, we cannot add a property to a function', () => {
  function fun () {
    return 999;
  }

  // we can add a property to a function
  fun.a = 99;
  assert.deepStrictEqual(fun.a, 99);

  // after deepFreeze, we cannot add a property to a function
  deepFreeze(fun);
  assert.throws(() => { fun.d = 100; });
});

t('test deepFreeze() string, numbers: non-freezable values are returned as is', () => {
  assert.deepStrictEqual(deepFreeze(9), 9);
  assert.deepStrictEqual(deepFreeze('abc'), 'abc');
});

t('test deepFreeze() class, class instance: after deepFreeze, we cannot modify or add a property to a class instance', () => {
  class A {
    #private_value = 100;

    constructor () {
      this.a = 999;
    }

    /** @param {*} value */
    set_private_value (value) {
      this.#private_value = value;
    }

    /** @returns {*} */
    get_private_value () {
      return this.#private_value;
    }
  }

  const a = new A();

  // before freeze, we can add a property to a class instance, and overwrite them
  a.a = 44;
  a.b = 55;
  assert.deepStrictEqual(a.a, 44);
  assert.deepStrictEqual(a.b, 55);

  // after deepFreeze, we cannot modify or add a property to a class instance
  deepFreeze(a);
  assert.throws(() => { a.d = 100; });
  assert.throws(() => { a.a = 100; });

  // also after deepFreeze, we can modify private properties
  assert.deepStrictEqual(a.get_private_value(), 100);
  a.set_private_value(200);
  assert.deepStrictEqual(a.get_private_value(), 200);
  a.set_private_value('abc');
  assert.deepStrictEqual(a.get_private_value(), 'abc');
});
