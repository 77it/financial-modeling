// run it with `deno bench --allow-read --allow-write --allow-net`

import { parseJsonToLocalDate } from '../../src/lib/date_utils.js';

Deno.bench("parseJsonToLocalDate() benchmark", () => {
  const loopCount = 1_000_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    if (parseJsonToLocalDate('2022-12-25').getTime() !== new Date(2022, 11, 25).getTime())
      throw new Error('parseJsonToLocalDate() failed');
  }
});
