/*
    CPU | 12th Gen Intel(R) Core(TM) i5-1240P
Runtime | Deno 2.1.9 (x86_64-pc-windows-msvc)

benchmark                               time/iter (avg)        iter/s      (min … max)           p75      p99     p995
--------------------------------------- ----------------------------- --------------------- --------------------------
deepFreeze() string                              6.8 ms         147.6 (  5.5 ms …  10.2 ms)   7.6 ms  10.2 ms  10.2 ms
deepFreeze() simple object benchmark           284.6 ms           3.5 (263.1 ms … 306.4 ms) 299.0 ms 306.4 ms 306.4 ms
deepFreeze() array benchmark                   553.5 ms           1.8 (507.2 ms … 578.1 ms) 565.6 ms 578.1 ms 578.1 ms
deepFreeze() complex object benchmark             1.5 s           0.7 (   1.4 s …    1.6 s)    1.5 s    1.6 s    1.6 s
 */

// run it with `deno bench --allow-import`

import { deepFreeze } from '../../src/lib/obj_utils.js';

const loopCount = 1_000_000;

Deno.bench("deepFreeze() string", () => {
  const notFreezableValue = 'abc';

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    deepFreeze(notFreezableValue);
  }
});

Deno.bench("deepFreeze() simple object benchmark", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const simpleObjectToFreeze = {a: 999};
    deepFreeze(simpleObjectToFreeze);
  }
});

Deno.bench("deepFreeze() array benchmark", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const arrayToFreeze = [1, 2, 3, 4, 5];
    deepFreeze(arrayToFreeze);
  }
});

Deno.bench("deepFreeze() complex object benchmark", () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const complexObjectToFreeze = {};
    complexObjectToFreeze.a = 99;
    complexObjectToFreeze.b = 55;
    complexObjectToFreeze.c = {};
    //@ts-ignore
    complexObjectToFreeze.c.a = 88;
    //@ts-ignore
    complexObjectToFreeze.c.b = 77;
    //@ts-ignore
    complexObjectToFreeze.c.e = [1, 2, 3, 4, 5];
    deepFreeze(complexObjectToFreeze);
  }
});
