import { get2 } from '../../src/lib/obj_utils.js';

import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';

Deno.test('test get2(), get keys from object in a case insensitive way', (t) => {
  const obj = {
    "a": 999,
    "A": 888,
    "B": 555,
    " C ": 'abc',
    888: 10,
    "999": 20
  }

  assertEquals(get2(obj, 'a'), 999);
  assertEquals(get2(obj, '  A  '), 999);
  assertEquals(get2(obj, 'A'), 888);
  assertEquals(get2(obj, '  B  '), 555);
  assertEquals(get2(obj, 'b'), 555);
  assertEquals(get2(obj, ' C '), 'abc');
  assertEquals(get2(obj, 'c'), 'abc');
  assertEquals(get2(obj, 'd'), undefined);

  // test that get a key from a non object returns undefined
  //@ts-ignore
  assertEquals(get2(null, 'a'), undefined);
  assertEquals(get2([], 'a'), undefined);
  //@ts-ignore
  assertEquals(get2('a', 'a'), undefined);
  //@ts-ignore
  assertEquals(get2(999, 'a'), undefined);
  //@ts-ignore
  assertEquals(get2(true, 'a'), undefined);

  // test that get with non-string key returns undefined
  assertEquals(get2(obj, 888), 10);
  assertEquals(get2(obj, "888"), 10);
  assertEquals(get2(obj, 999), 20);
  assertEquals(get2(obj, "999"), 20);
});
