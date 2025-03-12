/*
    CPU | 12th Gen Intel(R) Core(TM) i5-1240P
Runtime | Deno 2.1.9 (x86_64-pc-windows-msvc)

benchmark                          time/iter (avg)        iter/s      (min … max)           p75      p99     p995
---------------------------------- ----------------------------- --------------------- --------------------------
parseJsonToLocalDate() benchmark             1.3 s           0.8 (   1.2 s …    1.4 s)    1.3 s    1.4 s    1.4 s
 */

// run it with `deno bench --allow-import`

import { parseJsonToLocalDate } from '../../src/lib/date_utils.js';

Deno.bench("parseJsonToLocalDate() benchmark", () => {
  const loopCount = 1_000_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    if (parseJsonToLocalDate('2022-12-25').getTime() !== new Date(2022, 11, 25).getTime())
      throw new Error('parseJsonToLocalDate() failed');
  }
});
