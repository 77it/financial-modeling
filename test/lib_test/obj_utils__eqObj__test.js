import { eqObj } from '../deps.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

//#region test eqObj()
  t('test with non-objects', async () => {
    assert(eqObj({}, {}));
    assert(!eqObj({}, { a: 5 }));

    assert(eqObj(null, null));
    assert(!eqObj({}, null));

    assert(eqObj(undefined, undefined));
    assert(!eqObj({}, undefined));

    assert(eqObj(true, true));
    assert(!eqObj(true, false));

    assert(eqObj(99, 99));
    assert(!eqObj(99, 88));

    assert(eqObj('a', 'a'));
    assert(!eqObj('a', 'b'));
  });

  t('test comparing class instance to plain object', async () => {
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

  t('test comparing array, dates, regex', async () => {
    assert(eqObj([1, 2, 3], [1, 2, 3]));
    assert(!eqObj([1, 2, 3], [3, 1, 2]));
    assert(!eqObj([1, 2, 3], [3, 2, 3]));

    assert(eqObj(new Date('2020-01-01'), new Date('2020-01-01')));
    assert(!eqObj(new Date('2020-01-01'), new Date('2020-01-02')));

    assert(eqObj(/abc/, /abc/));
    assert(!eqObj(/abc/, /ab/));
  });

  t('class instances with private properties (must compare only public properties)', async () => {
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
    assert(!eqObj(a, different));
  });
//#endregion test eqObj()
