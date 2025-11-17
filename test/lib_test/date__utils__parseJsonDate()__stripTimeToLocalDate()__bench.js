/*
    CPU | 12th Gen Intel(R) Core(TM) i5-1240P
Runtime | Deno 2.1.9 (x86_64-pc-windows-msvc)

benchmark                                          time/iter (avg)        iter/s      (min … max)           p75      p99     p995
-------------------------------------------------- ----------------------------- --------------------- --------------------------
parseTextToLocalDate() benchmark: 1.000.000 loop             1.0 s           1.0 (949.6 ms …    1.1 s)    1.1 s    1.1 s    1.1 s
stripTimeToLocalDate() benchmark: 1.000.000 loop          445.9 ms           2.2 (376.3 ms … 532.4 ms) 464.9 ms 532.4 ms 532.4 ms
 */

// run it with `deno bench --allow-import`

import { parseTextToLocalDate, stripTimeToLocalDate } from '../../src/lib/date_utils.js';

const loopCount = 1_000_000;

Deno.bench(`parseTextToLocalDate() benchmark: ${loopCount.toLocaleString('it-IT')} loop`, () => {
  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const parsed = parseTextToLocalDate('2022-12-25').getTime();
  }
});

Deno.bench(`stripTimeToLocalDate() benchmark: ${loopCount.toLocaleString('it-IT')} loop`, () => {
  const date = new Date(2025, 12, 25, 10, 10)

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const stripped = stripTimeToLocalDate(date);
  }
});
