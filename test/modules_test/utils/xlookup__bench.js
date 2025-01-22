// run it with `deno bench`
/*
benchmark             time/iter (avg)        iter/s      (min … max)           p75      p99     p995
--------------------- ----------------------------- --------------------- --------------------------
xlookup - benchmark           90.6 ms          11.0 ( 82.2 ms … 107.1 ms)  94.7 ms 107.1 ms 107.1 ms
 */

import { xlookup } from '../../../src/modules/_utils/search/xlookup.js';

Deno.bench('xlookup - benchmark', () => {
  const loopCount = 1_000_000;

  const lookup_array = [99, 1, 'two', 3, 'four', 99, ' FiVe ', 6, 'seven'];
  const return_array = ['ninenine', 'one', 2, 'three', 4, 'NINENINE', 5, 'six', 7];

  const p = { lookup_value: 99, lookup_array, return_array, return_first_match: false };

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const aaa = xlookup(p);
    if (aaa !== 'NINENINE')
      throw new Error('xlookup() failed');
  }
});
