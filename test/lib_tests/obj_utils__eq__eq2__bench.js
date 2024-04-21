/*
benchmark                      time (avg)        iter/s             (min … max)       p75       p99      p995
------------------------------------------------------------------------------- -----------------------------
eq2() string & string          32.31 ms/iter          31.0   (29.75 ms … 41.02 ms) 32.32 ms 41.02 ms 41.02 ms
eq2() string & not string       5.41 ms/iter         184.8     (4.56 ms … 8.23 ms) 5.93 ms 7.75 ms 8.23 ms
eq2() object & object         196.78 ms/iter           5.1 (158.24 ms … 265.05 ms) 209.98 ms 265.05 ms 265.05 ms
 */

// run it with `deno bench`

import { eq2 } from '../../src/lib/obj_utils.js';

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

Deno.bench("eq2() object & object", () => {
  const objectA = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };
  const objectB = { foo: { bar: 'baz', baz: '999' }, foo2: { baz: '1000' } };

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    eq2(objectA, objectB);
  }
});
