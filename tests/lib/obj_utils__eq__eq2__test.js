// @ts-nocheck

// test equality function eq(), that provides equality of two values, with deep comparison of objects and arrays
// that internally calls deepEqual from fast-equals, https://github.com/planttheidea/fast-equals
//
// test also equality function eq2(), that is like eq() but if a and b are strings, they are compared after trim & case insensitive

import { eq, eq2 } from '../../src/lib/obj_utils.js';

import { assert, assertEquals, assertFalse, assertThrows } from '../deps.js';

Deno.test('test fast-equals.js/eq()', async (t) => {
  await t.step('object', async () => {
    const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
    const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
    const objectC_shuffled = { foo2: { baz: '1000' }, foo: { baz: '999', bar: 'baz' } };
    const objectD_different = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1001' } };

    assertFalse(objectA === objectB);
    assert(eq(objectA, objectB));
    assert(eq(objectA, objectC_shuffled));
    assertFalse(eq(objectA, objectD_different));
  });

  await t.step('array', async () => {
    const arrayA = [1, 2, 3, 'a', 'b', 'c'];
    const arrayB = [1, 2, 3, 'a', 'b', 'c'];
    const arrayC_shuffled = [1, 2, 3, 'b', 'a', 'c'];

    assertFalse(arrayA === arrayB);
    assert(eq(arrayA, arrayB));
    assertFalse(eq(arrayA, arrayC_shuffled));
    assertFalse(eq(arrayA, 999));
    assertFalse(eq(arrayA, new Date('2020-01-01')));
  });

  await t.step('string', async () => {
    const stringA = 'hello world';
    const stringB = 'hello world';
    const stringC_different = 'hello world!';

    assert(eq(stringA, stringB));
    assertFalse(eq(stringA, stringC_different));
    assertFalse(eq(stringA, 999));
  });

  await t.step('number', async () => {
    const numberA = 123;
    const numberB = 123;
    const numberC_different = 999;

    assert(eq(numberA, numberB));
    assertFalse(eq(numberA, numberC_different));
    assertFalse(eq(numberA, 'abc'));
  });

  await t.step('boolean', async () => {
    const booleanA = true;
    const booleanB = true;
    const booleanC_different = false;

    assert(eq(booleanA, booleanB));
    assertFalse(eq(booleanA, booleanC_different));
    assertFalse(eq(booleanA, 999));
  });

  await t.step('date', async () => {
    const dateA = new Date('2020-01-01');
    const dateB = new Date('2020-01-01');
    const dateC_different = new Date('2022-01-01');

    assert(eq(dateA, dateB));
    assertFalse(eq(dateA, dateC_different));
    assertFalse(eq(dateA, 99n));
  });

  await t.step('bigint', async () => {
    const bigintA = 123n;
    const bigintB = 123n;
    const bigintC = 999n;

    assert(eq(bigintA, bigintB));
    assertFalse(eq(bigintA, bigintC));
    assertFalse(eq(bigintA, 123));
  });
});

Deno.test('test fast-equals.js/eq2()', async (t) => {
  await t.step('string', async () => {
    const string = 'hello world';
    const string_whitespace = '  hello world  ';
    const string_whitespace_uppercase = '  HELLO WORLD  ';
    const string_uppercase = 'HELLO WORLD';
    const string_different = 'hello world!';

    assert(eq2(string, string_whitespace));
    assert(eq2(string, string_whitespace_uppercase));
    assert(eq2(string, string_uppercase));
    assertFalse(eq2(string, string_different));
    assertFalse(eq2(string, 999));
  });

  await t.step('object', async () => {
    const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
    const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
    const objectC_shuffled = { foo2: { baz: '1000' }, foo: { baz: '999', bar: 'baz' } };
    const objectD_different = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1001' } };

    assert(eq2(objectA, objectB));
    assert(eq2(objectA, objectC_shuffled));
    assertFalse(eq2(objectA, objectD_different));
  });
});
