// deno --allow-import

import { cachedParseJSON5relaxed } from '../../src/lib/unused/json5.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

// #region simple tests
t("cachedParseJSON5relaxed parses valid JSON5", () => {
  const input = "{a: 1, b: 'ciao'}";
  const result = cachedParseJSON5relaxed(input);
  assert.deepStrictEqual(result, { a: "1", b: "ciao" });
});

t("cachedParseJSON5relaxed returns input on invalid JSON5", () => {
  const input = "{a: , b: }"; // invalid
  const result = cachedParseJSON5relaxed(input);
  assert.deepStrictEqual(result, input);
});

t("cachedParseJSON5relaxed caches and freezes result", () => {
  const input = "{x: 10}";
  const first = cachedParseJSON5relaxed(input);
  const second = cachedParseJSON5relaxed(input);

  // Same object reference should come from cache
  assert.deepStrictEqual(first, second);

  // Frozen object should not be mutable
  assert.throws(() => {
    first.x = 20;
  });
});
// #endregion
