import { eq2 } from '../../src/lib/obj_utils.js';
import { _extractKeys } from '../lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('test extractKeys() with invalid values', async () => {
  assert(eq2({}, _extractKeys({})));
  //@ts-ignore
  assert(eq2({}, _extractKeys(null)));
});

t('test extractKeys() test extracting keys from a class', async () => {
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

  assert(eq2({ d: 4, b: 2, c: 3, a: 1 }, _extractKeys(source)));
});
