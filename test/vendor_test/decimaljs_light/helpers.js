// test/helpers.t.js
import assert from 'node:assert';

/**
 * Resolve a cross-runtime `test` function:
 *  - Deno: Deno.test
 *  - Bun:  (await import('bun:test')).test
 *  - Node: node:test
 * @returns {(name: string, fn: () => (void|Promise<void>)) => void}
 */
const t = await (async () => {
  if (typeof Deno !== 'undefined' && Deno?.test) return Deno.test;
  try { return (await import('bun:test')).test; } catch {}
  const { test } = await import('node:test');
  return test;
})();

/**
 * A local `T` compatible shim that DOES NOT use globals.
 * Usage in tests stays the same: T('name', fn), T.assertEqual(...), etc.
 * @type {{
 *   (name: string, fn: () => (void|Promise<void>)): void;
 *   assertEqual: (expected: string|number, actual: unknown) => void;
 *   assertEqualDecimal: (x: unknown, y: unknown) => void;
 *   assertEqualProps: (digits: number[], exponent: number, sign: number, n: { d:number[], e:number, s:number }) => void;
 * }}
 */
export const T = Object.assign(
  function T(/** @type {*} */ name, /** @type {*} */ fn) { t(name, fn); },
  {
    /**
     * Assert that the given test passes.
     * @param {*} test
     */
    assert(test) {
      assert(test);
    },

    /**
     * Assert two values are strictly equal as strings (to mimic old Decimal tests using .valueOf()).
     * @param {string|number} expected
     * @param {unknown} actual
     */
    assertEqual(expected, actual) {
      assert.strictEqual(String(actual), String(expected));
    },

    /**
     * Assert two Decimal instances represent the same numeric value.
     * Note: the test files import Decimal themselves; we don’t touch globals.
     * @param {unknown} x
     * @param {unknown} y
     */
    assertEqualDecimal(x, y) {
      // Avoid importing Decimal here to keep this helper generic.
      // We only compare by .valueOf() string to stay compatible.
      const xv = x && typeof x === 'object' && 'valueOf' in x ? String(x.valueOf()) : undefined;
      const yv = y && typeof y === 'object' && 'valueOf' in y ? String(y.valueOf()) : undefined;
      assert.ok(xv !== undefined && yv !== undefined, 'Both must be Decimal-like');
      assert.strictEqual(xv, yv, 'Decimal value mismatch');
    },

    /**
     * Assert internal props used by a few tests (digits, exponent, sign).
     * @param {number[]} digits
     * @param {number} exponent
     * @param {number} sign
     * @param {{ d:number[], e:number, s:number }} n
     */
    assertEqualProps(digits, exponent, sign, n) {
      assert.ok(Array.isArray(n.d), 'n.d must be array');
      assert.strictEqual(sign, n.s, 'sign mismatch');
      assert.strictEqual(exponent, n.e, 'exponent mismatch');
      assert.strictEqual(digits.length, n.d.length, 'digits length mismatch');
      for (let i = 0; i < digits.length; i++) {
        assert.strictEqual(digits[i], n.d[i], `digit[${i}] mismatch`);
      }
    },

    /**
     * Assert that the given function throws an exception.
     * @param {*} f
     * @param {string} msg
     */
    assertException(f, msg) {
      assert.throws(f, msg);
    },
  }
);
