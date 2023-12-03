import { eq, _extractKeys } from '../../src/lib/obj_utils.js';

import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';

Deno.test('test extractKeys()', async (t) => {
  await t.step('test with invalid values', async () => {
    assert(eq({}, _extractKeys({})));
    //@ts-ignore
    assert(eq({}, _extractKeys(null)));
  });

  await t.step('test extracting keys from a class', async () => {
    class sourceClass {
      /**
       * @param {{a: number, b: number, c: number, d: number}} p
       */
      constructor({a, b, c, d}) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
      }
    }
    const source = new sourceClass({ a: 1, b: 2, c: 3, d: 4});

    assert(eq({ d: 4, b: 2, c: 3, a: 1}, _extractKeys(source)));
  });
});
