// deno --allow-import

import { cachedParseJSONrelaxed } from '../../src/lib/json.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

// #region simple tests
t("cachedParseJSONrelaxed parses valid JSON", () => {
  const input = "{a: 1, b: 'ciao'}";
  const result = cachedParseJSONrelaxed(input);
  assert.deepStrictEqual(result, { a: "1", b: "ciao" });
});

t("cachedParseJSONrelaxed returns input on invalid JSON", () => {
  const input = "{a: , b: }"; // invalid
  const result = cachedParseJSONrelaxed(input);
  assert.deepStrictEqual(result, input);
});

t("cachedParseJSONrelaxed caches and freezes result", () => {
  const input = "{x: 10}";
  const first = cachedParseJSONrelaxed(input);
  const second = cachedParseJSONrelaxed(input);

  // Same object reference should come from cache
  assert.deepStrictEqual(first, second);

  // Frozen object should not be mutable
  assert.throws(() => {
    first.x = 20;
  });
});
// #endregion
