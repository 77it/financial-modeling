// run it with `deno bench`

import { deepFreeze } from '../../src/lib/obj_utils.js';

const loopCount = 1_000_000;

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
