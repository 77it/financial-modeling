// @ts-nocheck

import { deepFreeze } from '../../src/lib/obj_utils.js';

import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';

Deno.test('test deepFreeze()', (t) => {
  const a = {};
  a.a = 99;
  a.b = 55;
  a.c = {};
  a.c.a = 88;
  a.c.b = 77;

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
});
