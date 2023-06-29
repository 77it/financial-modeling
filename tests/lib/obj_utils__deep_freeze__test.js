// @ts-nocheck

import { deepFreeze } from '../../src/lib/obj_utils.js';

import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';

Deno.test('test deepFreeze() on object', (t) => {
  const a = {};
  a.a = 99;
  a.b = 55;
  a.c = {};
  a.c.a = 88;
  a.c.b = 77;
  a.c.e = [1, 2, 3, 4, 5];

  deepFreeze(a);

  // editing a property
  assertThrows(() => {
    a.a = 100;
  });

  // editing an inner property
  assertThrows(() => {
    a.c.a = 100;
  });

  // adding a property
  assertThrows(() => {
    a.d = 100;
  });

  // adding an element to an array
  assertThrows(() => {
    a.c.e.push(6);
  });
});

Deno.test('test deepFreeze() on array', (t) => {
  const arr = [1, 2, { a: 999 }, 4, 5, []];
  deepFreeze(arr);

  // adding an element to an array
  assertThrows(() => { arr.push(6); });

  // editing an inner property
  assertThrows(() => { arr[2].a = 100; });

  // editing an inner array
  assertThrows(() => { arr[5].push(5); });
});

Deno.test('test deepFreeze() function', (t) => {
  function fun () {
    return 999;
  }

  // we can add a property to a function
  fun.a = 99;
  assertEquals(fun.a, 99);

  // after deepFreeze, we cannot add a property to a function
  deepFreeze(fun);
  assertThrows(() => { fun.d = 100; });
});

Deno.test('test deepFreeze() string, numbers', (t) => {
  // non-freezable values are returned as is
  assertEquals(deepFreeze(9), 9);
  assertEquals(deepFreeze('abc'), 'abc');
});

Deno.test('test deepFreeze() class, class instance', (t) => {
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
  assertEquals(a.a, 44);
  assertEquals(a.b, 55);

  // after deepFreeze, we cannot modify or add a property to a class instance
  deepFreeze(a);
  assertThrows(() => { a.d = 100; });
  assertThrows(() => { a.a = 100; });

  // also after deepFreeze, we can modify private properties
  assertEquals(a.get_private_value(), 100);
  a.set_private_value(200);
  assertEquals(a.get_private_value(), 200);
  a.set_private_value('abc');
  assertEquals(a.get_private_value(), 'abc');
});
