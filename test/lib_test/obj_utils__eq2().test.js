// @ts-nocheck

// test equality function eq2(), that provides equality of two values, with deep comparison of objects and arrays,
// that internally calls deepEqual from fast-equals, https://github.com/planttheidea/fast-equals
// if a and b are strings, they are compared after trim & case insensitive.

import { eq2 } from '../../src/lib/obj_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

//#region test fast-equals.js through eq2() #1
t('eq2() test - eq2() test - object', async () => {
  const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000', x: 1000n } };
  const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000', x: 1000n } };
  const objectC_shuffled = { foo2: { x: 1000n, baz: '1000' }, foo: { baz: '999', bar: 'baz' } };
  const objectD_different = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1001' } };

  assert(objectA !== objectB);
  assert(eq2(objectA, objectB));
  assert(eq2(objectA, objectC_shuffled));
  assert(!eq2(objectA, objectD_different));
});

t('eq2() test - array', async () => {
  const arrayA = [1, 2, 3, 'a', 'b', 'c'];
  const arrayB = [1, 2, 3, 'a', 'b', 'c'];
  const arrayC_shuffled = [1, 2, 3, 'b', 'a', 'c'];

  assert(arrayA !== arrayB);
  assert(eq2(arrayA, arrayB));
  assert(!eq2(arrayA, arrayC_shuffled));
  assert(!eq2(arrayA, 999));
  assert(!eq2(arrayA, new Date('2020-01-01')));
});

t('eq2() test - string', async () => {
  const stringA = 'hello world';
  const stringB = 'hello world';
  const stringC_different = 'hello world!';

  assert(eq2(stringA, stringB));
  assert(!eq2(stringA, stringC_different));
  assert(!eq2(stringA, 999));
});

t('eq2() test - number', async () => {
  const numberA = 123;
  const numberB = 123;
  const numberC_different = 999;

  assert(eq2(numberA, numberB));
  assert(!eq2(numberA, numberC_different));
  assert(!eq2(numberA, 'abc'));
});

t('eq2() test - boolean', async () => {
  const booleanA = true;
  const booleanB = true;
  const booleanC_different = false;

  assert(eq2(booleanA, booleanB));
  assert(!eq2(booleanA, booleanC_different));
  assert(!eq2(booleanA, 999));
});

t('eq2() test - date', async () => {
  const dateA = new Date('2020-01-01');
  const dateB = new Date('2020-01-01');
  const dateC_different = new Date('2022-01-01');

  assert(eq2(dateA, dateB));
  assert(!eq2(dateA, dateC_different));
  assert(!eq2(dateA, 99n));
});

t('eq2() test - bigint', async () => {
  const bigintA = 123n;
  const bigintB = 123n;
  const bigintC = 999n;

  assert(eq2(bigintA, bigintB));
  assert(!eq2(bigintA, bigintC));
  assert(!eq2(bigintA, 123));
});
//#endregion test fast-equals.js through eq2() #1

//#region test fast-equals.js through eq2() #2
t('eq2() test - string', async () => {
  const string = 'hello world';
  const string_whitespace = '  hello world  ';
  const string_whitespace_uppercase = '  HELLO WORLD  ';
  const string_uppercase = 'HELLO WORLD';
  const string_different = 'hello world!';

  assert(eq2(string, string_whitespace));
  assert(eq2(string, string_whitespace_uppercase));
  assert(eq2(string, string_uppercase));
  assert(!eq2(string, string_different));
  assert(!eq2(string, 999));
});

t('eq2() test - object', async () => {
  const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
  const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
  const objectC_shuffled = { foo2: { baz: '1000' }, foo: { baz: '999', bar: 'baz' } };
  const objectD_different = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1001' } };

  assert(eq2(objectA, objectB));
  assert(eq2(objectA, objectC_shuffled));
  assert(!eq2(objectA, objectD_different));
});

t('eq2() test - class instances with private properties (must compare only public properties)', async () => {
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

  assert(eq2(a, public_properties_same_as_a));
  assert(!eq2(a, different));
});
//#endregion test fast-equals.js through eq2() #2
