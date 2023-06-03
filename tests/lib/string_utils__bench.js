// run it with `deno bench --allow-read --allow-write --allow-net`

import {caseInsensitiveCompare} from '../../src/lib/string_utils.js';

Deno.bench("caseInsensitiveCompare - benchmark", () => {
  const loopCount = 10_000_000;

  // loop `loopCount` times
  for (let i = 0; i < loopCount; i++) {
    if (caseInsensitiveCompare('a', 'AAA') === true)
      throw new Error('caseInsensitiveCompare() failed');

    if (caseInsensitiveCompare('aAa', 'AAA') === false)
      throw new Error('caseInsensitiveCompare() failed');
  }
});
