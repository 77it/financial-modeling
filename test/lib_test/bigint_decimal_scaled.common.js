//<file bigint_decimal_scaled.common.js>
// Shared helpers for tests/benches (ESM)
import process from "node:process";
import { Decimal } from "../../vendor/decimaljs/decimal.js";

/**
 * Hard-coded configurations to run benches/tests against.
 * Edit this array to change which scales you benchmark.
 *
 * decprec rule of thumb: max(2*scale + 10, floor)
 * Increase decprec if you ever see Decimal.js baselines disagreeing on nasty cases.
 */
export const RUN_CONFIGS = [
    { scale: 10, acc: 2, decprec: Math.max(2 * 10 + 10, 40) }, // → 40
    { scale: 20, acc: 4, decprec: Math.max(2 * 20 + 10, 40) }, // → 50
    { scale: 30, acc: 4, decprec: Math.max(2 * 30 + 10, 40) }, // → 70
];

/**
 * Some benches/tests may want the "current" scale info.
 * We keep default values equal to the most common production choice (20/4),
 * but benches/tests should iterate RUN_CONFIGS explicitly rather than rely on these.
 */
export const MATH_SCALE = 20;
export const ACCOUNTING_DECIMAL_PLACES = 4;

/** Try to give GC an opportunity, without assuming it's enabled. */
export function maybeGC() {
    //@ts-ignore .
    try { if (typeof globalThis.gc === "function") globalThis.gc(); } catch {}
}

/**
 * Simple, fast xorshift32 RNG for reproducible data.
 * @param {number} seed
 * @returns {() => number} in [0,1)
 */
//@ts-ignore .
export function makeRng(seed) {
    let x = seed >>> 0;
    return () => {
        x ^= x << 13; x >>>= 0;
        x ^= x >> 17; x >>>= 0;
        x ^= x << 5;  x >>>= 0;
        return x / 0x100000000;
    };
}

/**
 * Convert a Decimal to our BigInt fixed-point at given `scale` using toFixed(scale).
 * @param {Decimal} d
 * @param {number} scale
 * @returns {bigint}
 */
//@ts-ignore .
export function decToSig(d, scale) {
    const s = d.toFixed(scale);
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const [int, frac = ""] = t.split(".");
    const merged = (int + frac.padEnd(scale, "0")).replace(/^0+(?=\d)/, "") || "0";
    const sig = BigInt(merged);
    return neg ? -sig : sig;
}

/**
 * Snap Decimal to accounting grid (acc) with Decimal's rounding, then re-upscale to `scale` BigInt.
 * @param {Decimal} d
 * @param {number} roundingMode - Decimal.ROUND_xxx
 * @param {number} scale
 * @param {number} acc
 * @returns {bigint}
 */
//@ts-ignore .
export function decSnapToAccountingSig(d, roundingMode, scale, acc) {
    const prev = Decimal.rounding;
    Decimal.set({ rounding: roundingMode });
    const s = d.toFixed(acc);
    Decimal.set({ rounding: prev });
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const [int, frac = ""] = t.split(".");
    const merged = int + frac.padEnd(acc, "0") + "0".repeat(scale - acc);
    const mergedClean = merged.replace(/^0+(?=\d)/, "") || "0";
    const sig = BigInt(mergedClean);
    return neg ? -sig : sig;
}

/**
 * Micro-bench harness. Measures total time for `iters` calls of `fn`.
 * Logs "<name>: X.XX ms" and returns elapsed milliseconds.
 * @param {string} name
 * @param {() => void} fn
 * @param {{warmup?: number, iters?: number}} [opts]
 */
//@ts-ignore .
export function bench(name, fn, { warmup = 1, iters = 5 } = {}) {
    for (let i = 0; i < warmup; i++) fn();
    maybeGC();
    const start = process.hrtime.bigint();
    for (let i = 0; i < iters; i++) fn();
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    console.log(`${name}: ${ms.toFixed(2)} ms`);
    return ms;
}

/** pow10n (handy for pow checks) */
//@ts-ignore .
export function pow10n(n) { let p = 1n; for (let i = 0; i < n; i++) p *= 10n; return p; }

/**
 * Generate N decimal strings with varied magnitudes and signs.
 * @param {number} N
 * @param {() => number} rng
 * @param {{minExp?: number, maxExp?: number, maxIntDigits?: number, maxFracDigits?: number}} [opts]
 * @returns {string[]}
 */
export function genDecimalStrings(N, rng, opts = {}) {
    const {
        minExp = -4,
        maxExp = 6,
        maxIntDigits = 6,
        maxFracDigits = 10,
    } = opts;
    const out = new Array(N);
    for (let i = 0; i < N; i++) {
        // pick sign
        const sign = rng() < 0.5 ? "-" : "";
        // control magnitude with a crude exponent bucket
        const bucket = Math.floor(rng() * (maxExp - minExp + 1)) + minExp;
        const intDigits = Math.max(1, Math.min(maxIntDigits, bucket >= 0 ? bucket + 1 : 1));
        const fracDigits = Math.max(0, Math.min(maxFracDigits, bucket < 0 ? -bucket + 1 : 6));
        let intPart = "";
        for (let d = 0; d < intDigits; d++) {
            const v = d === 0 ? (1 + Math.floor(rng() * 9)) : Math.floor(rng() * 10);
            intPart += String(v);
        }
        let fracPart = "";
        for (let d = 0; d < fracDigits; d++) fracPart += String(Math.floor(rng() * 10));
        out[i] = fracDigits ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
    }
    return out;
}

/**
 * Make a pairwise permutation from an array (pseudo-random but stable).
 * @template T
 * @param {T[]} arr
 * @returns {[T[], T[]]}
 */
export function genPairs(arr) {
    const n = arr.length;
    const A = new Array(n), B = new Array(n);
    for (let i = 0; i < n; i++) {
        const j = (i * 48271 + 1) % n; // cheap LCG-ish pairing
        A[i] = arr[i];
        B[i] = arr[j];
    }
    return [A, B];
}
