import { get2 } from '../../src/lib/obj_utils.js';

import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';

Deno.test('test get2(), get keys from object in a case insensitive way', (t) => {
  const obj = {
    "a": 999,
    "A": 888,
    "B": 555,
    " C ": 'abc'
  }

  assertEquals(get2(obj, 'a'), 999);
  assertEquals(get2(obj, '  A  '), 999);
  assertEquals(get2(obj, 'A'), 888);
  assertEquals(get2(obj, '  B  '), 555);
  assertEquals(get2(obj, 'b'), 555);
  assertEquals(get2(obj, ' C '), 'abc');
  assertEquals(get2(obj, 'c'), 'abc');
  assertEquals(get2(obj, 'd'), undefined);
});
