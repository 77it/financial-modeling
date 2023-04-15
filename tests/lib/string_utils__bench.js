// run it with `deno bench --allow-read --allow-write --allow-net`

import {lowerCaseCompare} from '../../src/lib/string_utils.js';

Deno.bench("lowerCaseCompare - benchmark", () => {
  const loopCount = 100_000_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    const aaa = lowerCaseCompare('a', 'AAA');
  }
});
