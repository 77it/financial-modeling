// see https://nodejs.org/api/test.html

export { test2 as test };

import { test } from 'node:test';
import process from 'node:process';

/**
 * @param {string} name
 * @param {any} testFn
 */
function test2(name, testFn) {
  if (typeof Deno !== "undefined") {
    Deno.test(name, testFn);
  } else {
    process.nextTick(() => {
      test(name, testFn);
    });
  }
}
