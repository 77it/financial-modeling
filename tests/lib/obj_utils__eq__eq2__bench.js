// run it with `deno bench`

import { eq, eq2 } from '../../src/lib/obj_utils.js';

const loopCount = 1_000_000;

Deno.bench("eq2() string & string", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    eq2('hello world', '  HELLO WORLD  ');
  }
});

Deno.bench("eq2() string & not string", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    eq2('hello world', 999);
  }
});

Deno.bench("eq() string & not string", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    eq('hello world', 999);
  }
});

Deno.bench("eq() object & object", () => {
  const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
  const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    eq(objectA, objectB);
  }
});

Deno.bench("eq2() object & object", () => {
  const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
  const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    eq2(objectA, objectB);
  }
});
