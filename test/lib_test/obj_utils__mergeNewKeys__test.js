import { eq2, mergeNewKeys } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('test mergeNewKeys() - object with inherited keys', async () => {
  const source = { a: 1, b: 2, c: 3, d: 4 };
  const source_proto = { e: 3, f: 4 };
  // set prototype of source
  Object.setPrototypeOf(source, source_proto);

  const target = { a: 88, b: 99, x: 100, y: 200 };

  // merge new keys from source to target
  mergeNewKeys({ target, source });

  // expected
  const expected = { a: 88, b: 99, x: 100, y: 200, c: 3, d: 4 };

  // assert
  assert(eq2(expected, target));
});

t('test mergeNewKeys() - test with source as a class', async () => {
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

  const target = { a: 88, b: 99, x: 100, y: 200 };

  // merge new keys from source to target
  mergeNewKeys({ target, source });

  // expected
  const expected = { a: 88, b: 99, x: 100, y: 200, c: 3, d: 4 };

  // assert
  assert(eq2(expected, target));
});

t('test mergeNewKeys() - test with failures', async () => {
  const target = { a: 88, b: 99, x: 100, y: 200 };

  // assert
  assert(eq2(target, mergeNewKeys({ target, source: null })));
  assert(eq2(target, mergeNewKeys({ target, source: 'aaa' })));
  assert(eq2(target, mergeNewKeys({ target, source: 999 })));
});
