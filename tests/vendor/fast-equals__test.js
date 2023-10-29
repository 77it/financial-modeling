import { deepEqual } from '../../vendor/fast-equals/fast-equals.js';

import { assert, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';

Deno.test('test fast-equals.js/deepEqual()', async (t) => {
  await t.step('object', async () => {
    const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
    const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
    const objectC_shuffled = { foo2: { baz: '1000' }, foo: { baz: '999', bar: 'baz' } };
    const objectD_different = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1001' } };

    assertFalse(objectA === objectB);
    assert(deepEqual(objectA, objectB));
    assert(deepEqual(objectA, objectC_shuffled));
    assertFalse(deepEqual(objectA, objectD_different));
  });

  await t.step('array', async () => {
    const arrayA = [1, 2, 3, 'a', 'b', 'c'];
    const arrayB = [1, 2, 3, 'a', 'b', 'c'];
    const arrayC_shuffled = [1, 2, 3, 'b', 'a', 'c'];

    assertFalse(arrayA === arrayB);
    assert(deepEqual(arrayA, arrayB));
    assertFalse(deepEqual(arrayA, arrayC_shuffled));
    assertFalse(deepEqual(arrayA, 999));
    assertFalse(deepEqual(arrayA, new Date('2020-01-01')));
  });

  await t.step('string', async () => {
    const stringA = 'hello world';
    const stringB = 'hello world';
    const stringC_different = 'hello world!';

    assert(deepEqual(stringA, stringB));
    assertFalse(deepEqual(stringA, stringC_different));
    assertFalse(deepEqual(stringA, 999));
  });

  await t.step('number', async () => {
    const numberA = 123;
    const numberB = 123;
    const numberC_different = 999;

    assert(deepEqual(numberA, numberB));
    assertFalse(deepEqual(numberA, numberC_different));
    assertFalse(deepEqual(numberA, 'abc'));
  });

  await t.step('boolean', async () => {
    const booleanA = true;
    const booleanB = true;
    const booleanC_different = false;

    assert(deepEqual(booleanA, booleanB));
    assertFalse(deepEqual(booleanA, booleanC_different));
    assertFalse(deepEqual(booleanA, 999));
  });

  await t.step('date', async () => {
    const dateA = new Date('2020-01-01');
    const dateB = new Date('2020-01-01');
    const dateC_different = new Date('2022-01-01');

    assert(deepEqual(dateA, dateB));
    assertFalse(deepEqual(dateA, dateC_different));
    assertFalse(deepEqual(dateA, 99n));
  });

  await t.step('bigint', async () => {
    const bigintA = 123n;
    const bigintB = 123n;
    const bigintC = 999n;

    assert(deepEqual(bigintA, bigintB));
    assertFalse(deepEqual(bigintA, bigintC));
    assertFalse(deepEqual(bigintA, 123));
  });
});
