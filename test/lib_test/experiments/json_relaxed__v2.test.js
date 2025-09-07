import { parseRelaxedJSON } from '../../../src/lib/experiments/json_relaxed__v2.js';

import { strict as assert } from 'node:assert';
import test from 'node:test';

/**
 * @param {string} input The string to be parsed.
 * @returns {{value: any, c: string}} An object with two properties: `value` (the parsed JavaScript value) and `c` (the canonical JSON string of that value).
 */
function j(input) {
  const { value, canonicalJSON } = parseRelaxedJSON(input);
  return { value, c: canonicalJSON };
}

test('quoted strings with colon are preserved', () => {
  assert.equal(j(`"a:b"`).c, `"a:b"`);
  assert.equal(j(`'a:b'`).c, `"a:b"`);
  assert.deepEqual(j(`{k:'a:b'}`).value, { k: "a:b" });
});

test('unquoted identifiers vs objects', () => {
  assert.deepEqual(j(`{a:b}`).value, { a: "b" });
  assert.throws(() => j(`a:b`), /Top-level must be object, array, or quoted string\/number|Expected key|Expected value/);
});

test('numbers become strings; underscores allowed', () => {
  assert.deepEqual(j(`[1_000, -2.5, 6.02e23]`).value, ["1000", "-2.5", "6.02e23"]);
  assert.deepEqual(j(`{n: 0xFF_FF}`).value, { n: "0xFFFF" });
});

test('comments and trailing commas are ignored', () => {
  assert.deepEqual(j(`{a:1, /* x */ b:'y',}`).value, { a: "1", b: "y" });
  assert.deepEqual(j(`[\n // hi\n 'a:b',\n]`).value, ["a:b"]);
});

test('dangerous keys rejected', () => {
  assert.throws(() => j(`{__proto__:1}`), /Illegal key/);
  assert.throws(() => j(`{constructor:1}`), /Illegal key/);
});
