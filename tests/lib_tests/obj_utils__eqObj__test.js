import { eqObj } from '../deps.js';

import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';

Deno.test('test eqObj()', async (t) => {
  await t.step('test with non-objects', async () => {
    assert(eqObj({}, {}));
    assertFalse(eqObj({}, { a: 5 }));

    assert(eqObj(null, null));
    assertFalse(eqObj({}, null));

    assert(eqObj(undefined, undefined));
    assertFalse(eqObj({}, undefined));

    assert(eqObj(true, true));
    assertFalse(eqObj(true, false));

    assert(eqObj(99, 99));
    assertFalse(eqObj(99, 88));

    assert(eqObj('a', 'a'));
    assertFalse(eqObj('a', 'b'));
  });

  await t.step('test comparing class instance to plain object', async () => {
    class sourceClass {
      /**
       * @param {{a: number, b: number, c: number, d: number}} p
       */
      constructor ({ a, b, c, d }) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
      }
    }

    const source = new sourceClass({ a: 1, b: 2, c: 3, d: 4 });

    assert(eqObj({ d: 4, b: 2, c: 3, a: 1 }, source));
  });

  await t.step('test comparing array, dates, regex', async () => {
    assert(eqObj([1, 2, 3], [1, 2, 3]));
    assertFalse(eqObj([1, 2, 3], [3, 1, 2]));
    assertFalse(eqObj([1, 2, 3], [3, 2, 3]));

    assert(eqObj(new Date('2020-01-01'), new Date('2020-01-01')));
    assertFalse(eqObj(new Date('2020-01-01'), new Date('2020-01-02')));

    assert(eqObj(/abc/, /abc/));
    assertFalse(eqObj(/abc/, /ab/));
  });

  await t.step('class instances with private properties (must compare only public properties)', async () => {
    class sourceClassWithPrivateProperties {
      #c;
      #d;

      /**
       * @param {{a: number, b: number, c: number, d: number}} p
       */
      constructor ({ a, b, c, d }) {
        this.a = a;
        this.b = b;
        this.#c = c;
        this.#d = d;
      }
    }

    const a = new sourceClassWithPrivateProperties({ a: 1, b: 2, c: 3, d: 4 });
    const public_properties_same_as_a = new sourceClassWithPrivateProperties({ a: 1, b: 2, c: 88, d: 99 });
    const different = new sourceClassWithPrivateProperties({ a: 5, b: 2, c: 88, d: 99 });

    assert(eqObj(a, public_properties_same_as_a));
    assertFalse(eqObj(a, different));
  });
});
