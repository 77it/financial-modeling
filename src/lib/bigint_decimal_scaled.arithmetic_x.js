//<file bigint_decimal_scaled.arithmetic_x.js>

/*
██████╗ ███████╗ ██████╗██╗███╗   ███╗ █████╗ ██╗
██╔══██╗██╔════╝██╔════╝██║████╗ ████║██╔══██╗██║
██║  ██║█████╗  ██║     ██║██╔████╔██║███████║██║
██║  ██║██╔══╝  ██║     ██║██║╚██╔╝██║██╔══██║██║
██████╔╝███████╗╚██████╗██║██║ ╚═╝ ██║██║  ██║███████╗
╚═════╝ ╚══════╝ ╚═════╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝

███████╗ ██████╗ █████╗ ██╗     ███████╗██████╗
██╔════╝██╔════╝██╔══██╗██║     ██╔════╝██╔══██╗
███████╗██║     ███████║██║     █████╗  ██║  ██║
╚════██║██║     ██╔══██║██║     ██╔══╝  ██║  ██║
███████║╚██████╗██║  ██║███████╗███████╗██████╔╝
╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝

██████╗ ██╗ ██████╗ ██╗███╗   ██╗████████╗
██╔══██╗██║██╔════╝ ██║████╗  ██║╚══██╔══╝
██████╔╝██║██║  ███╗██║██╔██╗ ██║   ██║
██╔══██╗██║██║   ██║██║██║╚██╗██║   ██║
██████╔╝██║╚██████╔╝██║██║ ╚████║   ██║
╚═════╝ ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝   ╚═╝

 █████╗ ██████╗ ██╗████████╗██╗  ██╗███╗   ███╗███████╗████████╗██╗ ██████╗
██╔══██╗██╔══██╗██║╚══██╔══╝██║  ██║████╗ ████║██╔════╝╚══██╔══╝██║██╔════╝
███████║██████╔╝██║   ██║   ███████║██╔████╔██║█████╗     ██║   ██║██║
██╔══██║██╔══██╗██║   ██║   ██╔══██║██║╚██╔╝██║██╔══╝     ██║   ██║██║
██║  ██║██║  ██║██║   ██║   ██║  ██║██║ ╚═╝ ██║███████╗   ██║   ██║╚██████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝

███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
█████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
 */

// NOTE: This library performs decimal arithmetic at a fixed global scale (MATH_SCALE).
// Like any fixed-scale system, chaining many rounded operations can accumulate +/- 1 ulp effects.
// This is expected; if you need to carry extra precision across long iterative sequences,
// consider doing those steps at a guard scale (see fxDivGuarded note) and round back once at the boundary.

export {
  DSB,  // functions shortcuts
  ensureBigIntScaled,
  stringToBigIntScaled,
  numberToBigIntScaled,
  bigIntScaledToString,
  roundToAccounting,
  fxAdd, fxSub, fxMul, fxDiv,
  // ergonomic (coercing) API
  add, sub, mul, div,
};
export { _TEST_ONLY__reset, _TEST_ONLY__set, MATH_SCALE as _TEST_ONLY__MATH_SCALE, SCALE_FACTOR as _TEST_ONLY__SCALE_FACTOR, MAX_POW10 as _TEST_ONLY__MAX_POW10, POW10 as _TEST_ONLY__POW10 };
export { roundInt as _INTERNAL_roundInt }

import { BIGINT_DECIMAL_SCALE as CFG_SCALE, ACCOUNTING_DECIMAL_PLACES as CFG_DECIMAL_PLACES, ROUNDING_MODE as CFG_ROUNDING, ROUNDING_MODES } from '../config/engine.js';

// Exported functions shortcuts: being the sanitization to this format called DECIMAL_SCALED_BIGINT we decided to export a shortcut name DSB
const DSB = Object.freeze({
  from: ensureBigIntScaled,
  fromString: stringToBigIntScaled,
  fromNumber: numberToBigIntScaled,
  toString: bigIntScaledToString,
  round: roundToAccounting,

  // ergonomic (coercing) API
  add, sub, mul, div,

  // strict BigInt-only core (fast paths for hot loops)
  fxAdd, fxSub, fxMul, fxDiv,
});

//#region settings  // same code as in `bigint_decimal_scaled.EXPERIMENTAL_finance_x.js`
/** @type {number} */
let MATH_SCALE = CFG_SCALE;
/** @type {number} */
let ACCOUNTING_DECIMAL_PLACES = CFG_DECIMAL_PLACES;
/** @type {ROUNDING_MODES} */
let ROUNDING_MODE = CFG_ROUNDING;

// ------------------------ pow10 cache ------------------------
/** Precompute 10^n up to a safe bound (adjust if you ever need larger exponents). */
let MAX_POW10 = Math.max(2 * MATH_SCALE, 100);
let POW10 = [1n];
for (let i = 1; i <= MAX_POW10; i++) POW10[i] = POW10[i - 1] * 10n;
// ------------------------ scale factors ------------------------
let SCALE_FACTOR = pow10n(MATH_SCALE);
// ------------------------ accounting grid ------------------------
let GRID_FACTOR = pow10n(MATH_SCALE - ACCOUNTING_DECIMAL_PLACES);

/**
 * @internal
 * This is a function used for testing purposes, to set the bigint decimal scale, accounting decimal places and rounding mode.
 * @param {Object} opt
 * @param {number} opt.decimalScale
 * @param {number} opt.accountingDecimalPlaces
 * @param {ROUNDING_MODES} opt.roundingMode
 */
function _TEST_ONLY__set({decimalScale, accountingDecimalPlaces, roundingMode}) {
  if (!Number.isInteger(decimalScale)) {
    throw new TypeError('decimalScale must be an integer');
  }
  if (decimalScale < 0) {
    throw new RangeError('decimalScale must be >= 0');
  }
  if (!Number.isInteger(accountingDecimalPlaces)) {
    throw new TypeError('accountingDecimalPlaces must be an integer');
  }
  if (accountingDecimalPlaces < 0) {
    throw new RangeError('accountingDecimalPlaces must be >= 0');
  }
  if (accountingDecimalPlaces > decimalScale) {
    throw new RangeError('accountingDecimalPlaces cannot exceed decimalScale');
  }
  if (roundingMode !== ROUNDING_MODES.HALF_UP && roundingMode !== ROUNDING_MODES.HALF_EVEN) {
    throw new RangeError(`roundingMode must be "${ROUNDING_MODES.HALF_UP}" or "${ROUNDING_MODES.HALF_EVEN}"`);
  }

  MATH_SCALE = decimalScale;
  ACCOUNTING_DECIMAL_PLACES = accountingDecimalPlaces;
  ROUNDING_MODE = roundingMode;

  // ------------------------ pow10 cache ------------------------
  MAX_POW10 = Math.max(2 * MATH_SCALE, 100);
  POW10 = [1n];
  for (let i = 1; i <= MAX_POW10; i++) POW10[i] = POW10[i - 1] * 10n;
  // ------------------------ scale factors ------------------------
  SCALE_FACTOR = pow10n(MATH_SCALE);
  // ------------------------ accounting grid ------------------------
  GRID_FACTOR = pow10n(MATH_SCALE - ACCOUNTING_DECIMAL_PLACES);
}

/**
 * @internal
 * This is a function used for testing purposes, to reset to default values the bigint decimal scale, accounting decimal places and rounding mode.
 */
function _TEST_ONLY__reset() {
  _TEST_ONLY__set({
    decimalScale: CFG_SCALE,
    accountingDecimalPlaces: CFG_DECIMAL_PLACES,
    roundingMode: CFG_ROUNDING,
  });
}

//#endregion settings

//#region Exported functions

//#region ------------------------ toBigIntScaled ------------------------

/**
 * Parse a decimal string into a BigInt at MATH_SCALE, with a
 * **fast path** for plain decimals and a **slow path** for e-notation.
 *
 * Parse decimal with or without scientific notation (fast plain path, slow sci path).
 *
 * @example
 * stringToBigIntScaled("123.45")        // → 1234500000000000000000n
 * stringToBigIntScaled("-1.2e-3")       // → -0000000000000012000000n
 * stringToBigIntScaled("9.999...e15")   // preserves all input digits, rounds as needed
 *
 * @param {string} s
 * @returns {bigint} BigInt scaled by 10^MATH_SCALE
 * @throws {SyntaxError} on invalid/empty input
 */
function stringToBigIntScaled(s) {
  const str = String(s).trim();
  if (!str) throw new SyntaxError("Empty number");
  return hasENotation(str) ? parseSciDecimal(str) : parsePlainDecimal_fast(str);
}

/**
 * Convert a finite JavaScript Number to a BigInt scaled at MATH_SCALE,
 * *first* converting the number to a normalized string (e.g., "1e-7", "0.1").
 * This keeps a single canonical parsing/rounding path (the string parser).
 *
 * @param {number} x - finite JS number
 * @returns {bigint} BigInt scaled by 10^MATH_SCALE
 * @throws {TypeError} if x is not a finite number (NaN, ±Infinity)
 */
function numberToBigIntScaled(x) {
  if (typeof x !== "number" || !Number.isFinite(x)) {
    throw new TypeError("numberToBigIntScaled expects a finite number");
  }
  // String(x) yields ECMAScript's normalized numeric string (often exp-form),
  // which your parser already handles (fast plain path or sci-notation path).
  return stringToBigIntScaled(String(x));
}

//#endregion ------------------------ toBigIntScaled ------------------------

//#region ------------------------ formatting ------------------------

/**
 * Convert a scaled BigInt to string.
 *
 * @param {bigint} sig - The scaled integer.
 * @param {{trim?: boolean}} [opts] - Formatting options.
 *   - trim: whether to trim trailing zeros (default: true).
 * @returns {string} String representation.
 */
function bigIntScaledToString(sig, opts) {
  const trim = opts?.trim !== false; // default true, only false if explicitly set

  // Fast path: zero handling must honor fixed-scale vs trim
  if (sig === 0n) {
    if (MATH_SCALE === 0) return "0";
    return trim ? "0" : "0." + "0".repeat(MATH_SCALE);
  }

  // Non-zero: format at fixed scale
  let s = sig.toString();
  const neg = s[0] === "-";
  if (neg) s = s.slice(1);

  if (MATH_SCALE === 0) return (neg ? "-" : "") + s;

  if (s.length <= MATH_SCALE) {
    s = "0".repeat(MATH_SCALE - s.length + 1) + s;
  }
  const i = s.length - MATH_SCALE;
  let out = (neg ? "-" : "") + s.slice(0, i) + "." + s.slice(i);

  // Optional trimming (no-op unless there are trailing zeros)
  if (trim) {
    out = out.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "");
  }
  return out;
}

//#endregion ------------------------ formatting ------------------------

//#region ------------------------ arithmetic ------------------------

/**
 * Add two scale-MATH_SCALE BigInts.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function fxAdd(a, b) { return a + b; }

/**
 * Subtract b from a, both scale-MATH_SCALE.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function fxSub(a, b) { return a - b; }

/**
 * Multiply two scale-MATH_SCALE BigInts → scale-MATH_SCALE, with rounding.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function fxMul(a, b) {
  const raw = a * b;               // scale 2*MATH_SCALE
  const q = raw / SCALE_FACTOR;    // truncate back to MATH_SCALE
  const r = raw % SCALE_FACTOR;
  if (r === 0n) return q === 0n ? 0n : q;
  const out = roundInt(q, r, SCALE_FACTOR);
  return out === 0n ? 0n : out;    // normalize -0n
}

/**
 * Divide a by b (both scaled by MATH_SCALE) → result at scale MATH_SCALE.
 * Uses integer arithmetic with guard digits to ensure correct rounding.
 *
 * Remainder sign alignment:
 *   - `%` yields a remainder with the same sign as the dividend (`num`, i.e., `a`).
 *   - For rounding we need the remainder’s sign to encode the RESULT’s sign (the sign of `a/b`),
 *     which flips when `b` is negative. Hence `rAdj = (b < 0n ? -r : r)`.
 *
 * @param {bigint} a - dividend, scaled by MATH_SCALE
 * @param {bigint} b - divisor, scaled by MATH_SCALE
 * @returns {bigint} quotient, scaled by MATH_SCALE
 * @throws {RangeError} if dividing by zero
 */
function fxDiv(a, b) {
  if (b === 0n) throw new RangeError("Division by zero");
  const num = a * SCALE_FACTOR;      // promote to preserve scale
  const q = num / b;                 // truncated toward zero
  const r = num % b;                 // sign(r) == sign(num) == sign(a)
  if (r === 0n) return q === 0n ? 0n : q;

  // Round in the direction of the RESULT (a/b), not the dividend (a).
  // Align remainder’s sign to match sign(q) / sign(a/b).
  const absB = (b < 0n ? -b : b);
  const rAdj = (b < 0n ? -r : r);

  const out = roundInt(q, rAdj, absB);   // <-- no guard
  return out === 0n ? 0n : out;
}

// UNUSED FUNCTION
/**
 * Divide two BigInt fixed-point values at the global `MATH_SCALE`,
 * carrying an **extra guard digit** (×10) to reduce rounding drift.
 *
 * ### How it works
 * - Multiplies the dividend by `SCALE_FACTOR × 10n` instead of just `SCALE_FACTOR`.
 * - Performs integer division and rounding in the guarded domain.
 * - Drops the guard digit once at the end to return to `MATH_SCALE`.
 *
 * ### Behavior vs. `fxDiv`
 * - `fxDiv` (unguarded) matches Decimal.js exactly at `MATH_SCALE`.
 * - `fxDivGuarded` may differ by ±1 ulp on HALF_EVEN ties, because it
 *   “peeks” one digit further before rounding.
 *
 * ### When to use
 * - Use in **internal high-precision workflows** (e.g. iterative methods,
 *   Newton iterations, chained guard-scale operations) where carrying one extra
 *   digit reduces *cumulative* rounding error. Round back to `MATH_SCALE` once
 *   at the boundary of the algorithm.
 * - **Do not** use when you need strict bit-for-bit agreement with Decimal.js
 *   or other decimal libraries at the configured scale.
 *
 * @param {bigint} a - Dividend at `MATH_SCALE`.
 * @param {bigint} b - Divisor at `MATH_SCALE` (≠ 0n).
 * @returns {bigint} Quotient at `MATH_SCALE`, rounded according to `ROUNDING_MODE`.
 * @throws {RangeError} If `b === 0n`.
 */
/*
function fxDivGuarded(a, b) {
  if (b === 0n) throw new RangeError("Division by zero");

  // Promote to preserve scale. Add a single guard digit (×10) to avoid
  // rounding on a truncated last digit for extreme quotients.
  const GUARD = 10n; // one guard digit
  const num = a * SCALE_FACTOR * GUARD;

  // Single integer division; compute remainder without `%` to avoid a second div.
  let q = num / b;
  let r = num - q * b;             // sign(r) == sign(num) == sign(a)

  if (r === 0n) {
    // Exact division: drop guard and return (also normalizes -0n on the way out)
    const outExact = q / GUARD;
    return outExact === 0n ? 0n : outExact;
  }

  // Round in the direction of the RESULT (a/b), not the dividend (a).
  // Align remainder’s sign to match sign(q) / sign(a/b).
  const absB = (b < 0n ? -b : b);
  const rAdj = (b < 0n ? -r : r);

  // Round q using the configured mode (HALF_UP / HALF_EVEN).
  q = roundInt(q, rAdj, absB, GUARD);

  // Drop the guard digit to return at scale=MATH_SCALE.
  const out = q / GUARD;

  // Normalize -0n → 0n
  return out === 0n ? 0n : out;
}
*/

//#endregion ------------------------ arithmetic ------------------------

//#region ------------------------ rounding ------------------------

/**
 * Snap a scaled BigInt to the accounting grid (4 dp) but KEEP scale.
 * @param {bigint} sig
 * @returns {bigint}
 */
function roundToAccounting(sig) {
  const q = sig / GRID_FACTOR; // integer at ACCOUNTING_DECIMAL_PLACES dp
  const r = sig % GRID_FACTOR;
  if (r === 0n) return sig === 0n ? 0n : sig;
  const qRounded = roundInt(q, r, GRID_FACTOR);
  const snapped = qRounded * GRID_FACTOR;
  return snapped === 0n ? 0n : snapped;
}

//#endregion ------------------------ rounding ------------------------

//#region ------------------------ arithmetic with automatic conversion ------------------------

/**
 * Convert an input to a scaled BigInt if needed.
 * Fast path for bigint; falls back to your converters for number/string.
 * @param {bigint|number|string} x
 * @returns {bigint}
 * @throws {TypeError} on unsupported types (null, undefined, boolean, object, symbol, function)
 */
function ensureBigIntScaled(x) {
  switch (typeof x) {
    case 'bigint':
      return x;
    case 'number':
      return numberToBigIntScaled(x);
    case 'string':
      return stringToBigIntScaled(x);
    default:
      throw new TypeError(`Expected bigint|number|string, got ${typeof x}`);
  }
}

/**
 * Add two scale-MATH_SCALE values. Accepts bigint/number/string with fast path for bigint.
 * @param {bigint|number|string} a
 * @param {bigint|number|string} b
 * @returns {bigint}
 */
function add(a, b) {
  if (typeof a === "bigint" && typeof b === "bigint") return fxAdd(a, b);
  return fxAdd(ensureBigIntScaled(a), ensureBigIntScaled(b));
}

/**
 * Subtract b from a. Accepts bigint/number/string with fast path for bigint.
 * @param {bigint|number|string} a
 * @param {bigint|number|string} b
 * @returns {bigint}
 */
function sub(a, b) {
  if (typeof a === "bigint" && typeof b === "bigint") return fxSub(a, b);
  return fxSub(ensureBigIntScaled(a), ensureBigIntScaled(b));
}

/**
 * Multiply two scale-MATH_SCALE values → scale-MATH_SCALE, with rounding.
 * Accepts bigint/number/string with fast path for bigint.
 * @param {bigint|number|string} a
 * @param {bigint|number|string} b
 * @returns {bigint}
 */
function mul(a, b) {
  if (typeof a === "bigint" && typeof b === "bigint") return fxMul(a, b);
  return fxMul(ensureBigIntScaled(a), ensureBigIntScaled(b));
}

/**
 * Divide a by b (both scaled by MATH_SCALE) → result at scale MATH_SCALE.
 * Accepts bigint/number/string with fast path for bigint.
 * @param {bigint|number|string} a
 * @param {bigint|number|string} b
 * @returns {bigint}
 */
function div(a, b) {
  if (typeof a === "bigint" && typeof b === "bigint") return fxDiv(a, b);
  return fxDiv(ensureBigIntScaled(a), ensureBigIntScaled(b));
}

//#endregion ------------------------ arithmetic with automatic conversion ------------------------

//#endregion Exported functions

//#region private functions

/**
 * Check if a string has scientific notation (e.g., "1e10").
 * @param {string} s
 * @returns {boolean}
 */
function hasENotation(s) {
  // single pass; avoids scanning twice with .includes('e') || .includes('E')
  // (A tiny hand-rolled scan is typically faster than regex for short/medium inputs.)
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 69 /*E*/ || c === 101 /*e*/) return true;
  }
  return false;
}

/**
 * @param {number} n
 * @returns {bigint} 10^n (n >= 0)
 * @throws {RangeError} if n is excessively large (abuse guard)
 */
function pow10n(n) {
  if (n <= MAX_POW10) return POW10[n];
  // --- changed: use exponentiation-by-squaring for the rare slow path; guard size ---
  if (n > 1_000_000) {
    throw new RangeError(`Exponent ${n} exceeds maximum safe value 1000000`);
  }
  let base = 10n;
  let result = 1n;
  let exp = n;
  while (exp > 0) {
    if (exp & 1) result *= base;
    base *= base;
    exp >>= 1;
  }
  return result;
  // --- end changed ---
}

// ------------------------ rounding core ------------------------
/**
 * @internal used only here and in bigInt Decimal Scaled Financial library
 *
 * Round integer quotient q with remainder r over divisor d, according to
 * configured ROUNDING_MODE (ROUNDING_MODES.HALF_UP or ROUNDING_MODES.HALF_EVEN).
 *
 * Contract (subtle but important):
 *   - q is the **truncated** integer result at the *target* scale.
 *   - r’s **sign encodes rounding direction** and MUST match the intended
 *     result’s sign (i.e., the sign of the final quotient). Callers are
 *     responsible for adjusting r’s sign accordingly (see fxDiv for example).
 *   - d is the positive divisor (abs value if original divisor was negative).
 *   - guard > 1n if upstream added guard digits (e.g., ×10), otherwise 1n.
 *
 * @param {bigint} q - truncated quotient
 * @param {bigint} r - remainder (signed; if guarded, includes that scale)
 * @param {bigint} d - positive divisor
 * @param {bigint} [guard=1n] - guard factor used upstream
 * @returns {bigint} rounded quotient
 */
function roundInt(q, r, d, guard = 1n) {
  // remainder’s sign encodes rounding direction (matches result’s sign by contract)
  const sign = r >= 0n ? 1n : -1n;
  const absR = r >= 0n ? r : -r;

  // Compare in the guarded domain to avoid losing information:
  // 2*|r| ? d*guard
  const lhs = absR * 2n;
  const rhs = d * guard;

  // Step size to change the *target-scale* integer by 1
  const step = (guard === 1n) ? 1n : guard;

  if (ROUNDING_MODE === ROUNDING_MODES.HALF_UP) {
    return lhs >= rhs ? q + sign * step : q;
  }
  // HALF_EVEN
  if (lhs > rhs) return q + sign * step;
  if (lhs < rhs) return q;

  // exact half → nearest even
  // check parity at the *target* unit (drop guard if present)
  const baseQ = (guard === 1n) ? q : (q / guard);
  const isEven = (baseQ & 1n) === 0n;
  return isEven ? q : (q + sign * step);
}

// ------------------------ parsing ------------------------

/**
 * Fast path: parse a plain decimal string (no e/E) into BigInt at MATH_SCALE.
 * - No regex
 * - No padEnd
 * - No leading-zeros regex
 * - Only one final allocation for BigInt()
 *
 * Rounding on discarded digits:
 *   - >5 : round away from zero
 *   - <5 : no bump
 *   - ==5 and only zeros after (an exact tie):
 *        * HALF_UP  → bump away from zero
 *        * HALF_EVEN→ parity of the last kept unit (nearest even)
 *
 * NOTE: This function now honors the global ROUNDING_MODE on ties,
 *       matching the scientific-notation path.
 *
 * @param {string} str
 * @returns {bigint} scaled BigInt at MATH_SCALE
 * @throws {SyntaxError} on malformed numbers
 */
function parsePlainDecimal_fast(str) {
  let i = 0, sign = 1n;

  // --- Parse optional sign ---
  if (i < str.length) {
    const c0 = str.charCodeAt(i);
    if (c0 === 43 /* + */) { i++; }
    else if (c0 === 45 /* - */) { sign = -1n; i++; }
  }

  // --- Parse integer digits ---
  const startInt = i;
  while (i < str.length) {
    const c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) { i++; continue; }
    break;
  }
  const intStart = startInt;
  const intEnd = i; // [intStart, intEnd)

  // --- Parse optional fractional part ---
  let frStart = -1, frEnd = -1;
  if (i < str.length && str.charCodeAt(i) === 46 /* . */) {
    i++;
    frStart = i;
    while (i < str.length) {
      const c = str.charCodeAt(i);
      if (c >= 48 && c <= 57) { i++; continue; }
      break;
    }
    frEnd = i;
    if (frStart === frEnd && intEnd === intStart) {
      // ".", "+.", "-." are invalid (lonely sign alone is accepted elsewhere)
      throw new SyntaxError(`Invalid number: ${str}`);
    }
  }

  // --- No trailing garbage allowed ---
  if (i !== str.length) throw new SyntaxError(`Invalid number: ${str}`);

  const frLen = (frStart >= 0) ? (frEnd - frStart) : 0;

  // --- Rounding decision ---
  // bump = 0 (none), 1 (bump away from zero), 2 (tie → parity check per HALF_EVEN)
  let bump = 0;
  let keepFrLen = frLen <= MATH_SCALE ? frLen : MATH_SCALE;

  if (frLen > MATH_SCALE) {
    const firstDiscardCode = str.charCodeAt(frStart + MATH_SCALE) - 48;
    let restHasNonZero = false;
    for (let k = frStart + MATH_SCALE + 1; k < frEnd; k++) {
      if (str.charCodeAt(k) !== 48 /* 0 */) { restHasNonZero = true; break; }
    }

    if (firstDiscardCode > 5 || (firstDiscardCode === 5 && restHasNonZero)) {
      bump = 1; // round away from zero
    } else if (firstDiscardCode === 5 && !restHasNonZero) {
      // EXACT tie: follow global mode
      bump = (ROUNDING_MODE === ROUNDING_MODES.HALF_UP) ? 1 : 2; // HALF_EVEN → parity check later
    }
    keepFrLen = MATH_SCALE;
  }

  // --- Strip leading zeros from integer part ---
  let nzInt = intStart;
  while (nzInt < intEnd && str.charCodeAt(nzInt) === 48 /* 0 */) nzInt++;

  // --- Count digits to keep ---
  const intDigitsLen = nzInt < intEnd ? (intEnd - nzInt) : 0;
  const frDigitsLen  = keepFrLen > 0 ? keepFrLen : 0;
  const keptFrEnd    = (frStart >= 0) ? (frStart + keepFrLen) : -1;
  const padZeros     = MATH_SCALE - frDigitsLen;

  // --- Detect all-zero case among kept digits ---
  let keptFrHasNonZero = false;
  if (frDigitsLen > 0) {
    for (let k = frStart; k < keptFrEnd; k++) {
      if (str.charCodeAt(k) !== 48 /* 0 */) { keptFrHasNonZero = true; break; }
    }
  }
  const allZeroSoFar = (intDigitsLen === 0 && !keptFrHasNonZero);

  // --- Early return only when there's truly nothing to round/bump ---
  // At scale=0 a tie (e.g., "0.5") must still go through bump logic.
  if (allZeroSoFar && MATH_SCALE === 0 && bump === 0) return 0n;

  // --- Early return: common path with no bump and frLen<=scale ---
  if (bump === 0 && frLen <= MATH_SCALE) {
    const intDigits = intDigitsLen > 0 ? str.slice(nzInt, intEnd) : "";
    const frDigits  = frDigitsLen  > 0 ? str.slice(frStart, keptFrEnd) : "";
    let digitsStr = (intDigits || frDigits ? (intDigits + frDigits) : "0");
    if (padZeros > 0) digitsStr += "0".repeat(padZeros);
    const sig = BigInt(digitsStr);
    const out = sign * sig;
    return out === 0n ? 0n : out;
  }

  // --- Build digit string ---
  let digitsStr;
  if (!allZeroSoFar) {
    const parts = [];
    if (intDigitsLen > 0) parts.push(str.slice(nzInt, intEnd));
    if (frDigitsLen  > 0) parts.push(str.slice(frStart, keptFrEnd));
    if (padZeros     > 0) parts.push("0".repeat(padZeros));
    digitsStr = parts.join("");
  } else {
    digitsStr = "0" + (MATH_SCALE > 0 ? "0".repeat(MATH_SCALE) : "");
  }

  // --- Convert to BigInt once ---
  let sig = BigInt(digitsStr);

  // --- Apply rounding bump if needed ---
  if (bump !== 0) {
    if (bump === 1) {
      // HALF_UP tie or >5 → away from zero (apply before sign)
      sig += 1n;
    } else {
      // HALF_EVEN tie: parity of last kept unit at target scale
      if ((sig & 1n) === 1n) sig += 1n;
    }
  }

  const out = sign * sig;
  return out === 0n ? 0n : out; // normalize -0n
}

/**
 * Full path: parse decimal with optional scientific notation (e/E).
 * Keeps all mantissa digits; applies rounding only if exponent forces
 * dropping digits to land exactly at MATH_SCALE.
 *
 * Tie handling is unified with the plain path by delegating to `roundInt`,
 * which honors the global `ROUNDING_MODE`.
 *
 * @param {string} str
 * @returns {bigint} BigInt at scale = MATH_SCALE
 * @throws {SyntaxError|RangeError} on malformed numbers / extreme exponents
 */
function parseSciDecimal(str) {
  let i = 0, sign = 1n;

  // optional sign
  const c0 = str.charCodeAt(0);
  if (c0 === 43 /*+*/) i++;
  else if (c0 === 45 /*-*/) { sign = -1n; i++; }

  // INT part
  const startInt = i;
  while (i < str.length && str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) i++;
  const intHadDigits = i > startInt;
  const INT = str.slice(startInt, i);

  // optional fraction
  let FR = "";
  let frHadDigits = false;
  if (i < str.length && str.charCodeAt(i) === 46 /* '.' */) {
    i++;
    const startFr = i;
    while (i < str.length && str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) i++;
    FR = str.slice(startFr, i);
    frHadDigits = (i > startFr);
    // Disallow strings like "." or "+." or "-." (no int and no frac digits)
    if (!intHadDigits && !frHadDigits) throw new SyntaxError(`Invalid number: ${str}`);
  }

  // Require at least one mantissa digit somewhere before exponent
  if (!intHadDigits && !frHadDigits) {
    throw new SyntaxError(`Invalid number: ${str}`);
  }

  // optional exponent
  let exp = 0;
  if (i < str.length && (str[i] === "e" || str[i] === "E")) {
    i++;
    const sgn = (i < str.length && (str[i] === "+" || str[i] === "-")) ? str[i++] : "+";
    const startE = i;
    while (i < str.length && str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) i++;
    if (startE === i) throw new SyntaxError(`Invalid exponent: ${str}`);
    // --- added: exponent guards (fast on normal inputs, prevents abuse) ---
    const expStr = str.slice(startE, i);
    if (expStr.length > 9) throw new RangeError(`Exponent too large: ${str}`);
    const eAbs = parseInt(expStr, 10);
    if (!Number.isFinite(eAbs) || eAbs > 1_000_000) {
      throw new RangeError(`Exponent exceeds maximum safe value: ${str}`);
    }
    // --- end added ---
    exp = (sgn === "-") ? -eAbs : eAbs;
  }

  if (i !== str.length) throw new SyntaxError(`Invalid trailing characters: ${str}`);

  // Combine mantissa; compute scale shift k
  const FRlen = FR.length;
  const digitsStr = (INT + FR).replace(/^0+(?=\d)/, "") || "0";
  let sig = BigInt(digitsStr);
  const k = MATH_SCALE - FRlen + exp;

  if (k >= 0) {
    sig *= pow10n(k);
    const out = sign * sig;
    return out === 0n ? 0n : out;
  } else {
    const drop = -k;
    const div = pow10n(drop);
    const num = sign * sig;
    const q = num / div;
    const r = num % div;
    const out = (r === 0n ? q : roundInt(q, r, div)); // honors ROUNDING_MODE
    return out === 0n ? 0n : out;
  }
}

//#endregion private functions
