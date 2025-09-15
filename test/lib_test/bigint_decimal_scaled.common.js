//<file bigint_decimal_scaled.common.js>
// Shared helpers for tests/benches (ESM)
import process from "node:process";
import { Decimal } from "../../vendor/decimaljs/decimal.js";

export const MATH_SCALE = 20;
export const ACCOUNTING_DECIMAL_PLACES = 4;

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
//@ts-ignore .
export const pad = (s, w) => (s = String(s), s.length >= w ? s : " ".repeat(w - s.length) + s);
//@ts-ignore .
export const maybeGC = () => { if (globalThis.gc) globalThis.gc(); };

/** Convert Decimal to our scale-20 BigInt via toFixed(MATH_SCALE). */
//@ts-ignore .
export function decToSig20(d) {
    const s = d.toFixed(MATH_SCALE);
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const [int, frac = ""] = t.split(".");
    const merged = (int + frac.padEnd(MATH_SCALE, "0")).replace(/^0+(?=\d)/, "") || "0";
    const sig = BigInt(merged);
    return neg ? -sig : sig;
}

/** Snap Decimal to accounting grid (4 dp), re-upscale to scale-20 BigInt. */
//@ts-ignore .
export function decSnapToAccountingSig20(d, roundingMode) {
    const prev = Decimal.rounding;
    Decimal.set({ rounding: roundingMode });
    const s = d.toFixed(ACCOUNTING_DECIMAL_PLACES);
    Decimal.set({ rounding: prev });
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const [int, frac = ""] = t.split(".");
    const merged = int + frac.padEnd(ACCOUNTING_DECIMAL_PLACES, "0")
      + "0".repeat(MATH_SCALE - ACCOUNTING_DECIMAL_PLACES);
    const mergedClean = merged.replace(/^0+(?=\d)/, "") || "0";
    const sig = BigInt(mergedClean);
    return neg ? -sig : sig;
}

//@ts-ignore .
export function bench(name, fn, { warmup = 1, iters = 5 } = {}) {
    for (let i = 0; i < warmup; i++) fn();
    maybeGC();
    const start = process.hrtime.bigint();
    for (let i = 0; i < iters; i++) fn();
    const end = process.hrtime.bigint();
    const ns = Number(end - start);
    const opsPerSec = (iters * 1e9) / ns;
    console.log(`${pad(name, 40)}  ${opsPerSec.toFixed(1)} ops/sec`);
}

/** pow10n (handy for pow checks) */
//@ts-ignore .
export function pow10n(n) { let p = 1n; for (let i = 0; i < n; i++) p *= 10n; return p; }

/** Random mixed-format decimal strings (plain + e-notation). */
//@ts-ignore .
export function genDecimalStrings(rng, n) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
        const int = Math.floor(rng() * 1e6);
        const fracLen = Math.floor(rng() * 14);
        let frac = "";
        for (let k = 0; k < fracLen; k++) frac += Math.floor(rng() * 10);
        const sign = rng() < 0.5 ? "" : "-";
        const base = `${sign}${int}.${frac || "0"}`;
        if (rng() < 0.25) {
            const e = Math.floor(rng() * 14) - 7;
            out[i] = `${base}e${e >= 0 ? "+" : ""}${e}`;
        } else {
            out[i] = base;
        }
    }
    return out;
}
//@ts-ignore .
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
