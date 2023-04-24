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
  const arr = [1, 2, { a: 999}, 4, 5];
  deepFreeze(arr);

  // adding an element to an array
  assertThrows(() => {
    arr.push(6);
  });

  // editing an inner property
  assertThrows(() => {
    arr[2].a = 100;
  });
});
