export { stringToBigIntScaled, bigIntScaledToString, fxAdd, fxSub, fxMul, fxDiv, reduceToAccounting, _TEST_ONLY__set };

import { BIGINT_DECIMAL_SCALE as CFG_SCALE, ACCOUNTING_DECIMAL_PLACES as CFG_DECIMAL_PLACES, ROUNDING_MODE as CFG_ROUNDING, /* used only for types */ ROUNDING_MODES } from '../config/engine.js';

//#region settings  // same code as in `bigint_decimal_scaled.finance.js`
/** @type {number} */
let MATH_SCALE = CFG_SCALE;
/** @type {number} */
let ACCOUNTING_DECIMAL_PLACES = CFG_DECIMAL_PLACES;
/** @type {string} */
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
 * @param {string} opt.roundingMode
 */
function _TEST_ONLY__set({decimalScale, accountingDecimalPlaces, roundingMode}) {
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

//#endregion settings

//#region Exported functions

const SCIENTIFIC_NOTATION_REGEX = /[eE]/;

/**
 * @public
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
 * @throws {Error} on invalid format
 */
function stringToBigIntScaled(s) {
  const str = String(s).trim();
  if (!str) throw new Error("Empty number");
  // Quick dispatch: plain decimal? take the fast path.
  if (!SCIENTIFIC_NOTATION_REGEX.test(str)) return parsePlainDecimal(str);
  // Otherwise, handle scientific notation.
  return parseSciDecimal(str);
}

// ------------------------ formatting ------------------------

/**
 * Convert a scaled BigInt to a decimal string.
 * @param {bigint} sig BigInt at MATH_SCALE
 * @param {{ trim?: boolean }} [opts] trim: remove trailing zeros and dot
 * @returns {string}
 */
function bigIntScaledToString(sig, opts) {
  const trim = !!(opts && opts.trim);
  let s = sig.toString();
  const neg = s[0] === "-";
  if (neg) s = s.slice(1);

  if (MATH_SCALE === 0) return (neg ? "-" : "") + s;

  if (s.length <= MATH_SCALE) {
    s = "0".repeat(MATH_SCALE - s.length + 1) + s;
  }
  const i = s.length - MATH_SCALE;
  let out = (neg ? "-" : "") + s.slice(0, i) + "." + s.slice(i);

  if (trim) {
    out = out.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "");
  }
  return out;
}

// ------------------------ arithmetic ------------------------

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
 * Divide a by b (both at scale MATH_SCALE) → scale-MATH_SCALE, with rounding.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
function fxDiv(a, b) {
  if (b === 0n) throw new RangeError("Division by zero");
  const num = a * SCALE_FACTOR;    // promote to preserve scale
  const q = num / b;
  const r = num % b;               // sign(r) == sign(num) == sign(a)
  if (r === 0n) return q === 0n ? 0n : q;
  // Round in the direction of the RESULT (a/b), not the dividend (a).
  // Align remainder’s sign to match sign(q) / sign(a/b).
  const absB = (b < 0n ? -b : b);
  const rAdj = (b < 0n ? -r : r);
  const out = roundInt(q, rAdj, absB);
  return out === 0n ? 0n : out;
}

/**
 * Snap a scaled BigInt to the accounting grid (4 dp) but KEEP scale.
 * @param {bigint} sig
 * @returns {bigint}
 */
function reduceToAccounting(sig) {
  const q = sig / GRID_FACTOR; // integer at ACCOUNTING_DECIMAL_PLACES dp
  const r = sig % GRID_FACTOR;
  if (r === 0n) return sig === 0n ? 0n : sig;
  const qRounded = roundInt(q, r, GRID_FACTOR);
  const snapped = qRounded * GRID_FACTOR;
  return snapped === 0n ? 0n : snapped;
}

//#endregion Exported functions

//#region private functions

/**
 * @param {number} n
 * @returns {bigint} 10^n (n >= 0)
 */
function pow10n(n) {
  if (n <= MAX_POW10) return POW10[n];
  // very rare path; only loops if exponent > MAX_POW10
  let p = POW10[MAX_POW10];
  for (let i = MAX_POW10; i < n; i++) p *= 10n;
  return p;
}

// ------------------------ rounding core ------------------------
/**
 * Integer rounding helper on a truncated quotient/remainder pair.
 *
 * Supported modes:
 * - HALF_EVEN (banker's): ties go to the nearest even last digit.
 * - HALF_UP:              ties (>= .5) round away from zero.
 *
 * Adjusts the truncated quotient `q` based on remainder `r` and positive divisor `d`.
 *
 * Contract:
 * - `q` is the quotient truncated toward zero.
 * - `r` is the remainder, with its sign already aligned to the sign of the result (`q`).
 * - `d` is the positive divisor magnitude (rounding threshold base).
 * - `r = 0n` is handled upstream.
 *
 * In effect:
 * - HALF_EVEN: ties round to the nearest even result digit.
 * - HALF_UP:   ties round away from zero.
 *
 * @param {bigint} q - truncated integer quotient
 * @param {bigint} r - remainder (sign matches the result’s sign)
 * @param {bigint} d - positive divisor magnitude
 * @returns {bigint} adjusted quotient
 */
function roundInt(q, r, d) {
  // r's sign encodes rounding direction (must match result's sign by contract)
  const sign  = r >= 0n ? 1n : -1n;
  const absR  = r >= 0n ? r : -r;
  const twice = absR * 2n;

  if (ROUNDING_MODE === "HALF_UP") {
    return twice >= d ? q + sign : q;
  }
  // HALF_EVEN
  if (twice > d) return q + sign;
  if (twice < d) return q;

  // exact half → nearest even (check parity of q)
  return (q & 1n) === 0n ? q : (q + sign);
}

// ------------------------ parsing ------------------------

const NUMBERS_REGEX = /[1-9]/;

/**
 * Fast path: parse a plain decimal string (no e/E) into BigInt at MATH_SCALE.
 * Accepts optional sign and a single '.' decimal point.
 * Rounds HALF_EVEN if more than MATH_SCALE fractional digits are present.
 *
 * @param {string} str
 * @returns {bigint} BigInt at scale = MATH_SCALE
 */
function parsePlainDecimal(str) {
  let i = 0, sign = 1n;
  const c0 = str.charCodeAt(0);
  if (c0 === 43 /*+*/) i++;
  else if (c0 === 45 /*-*/) { sign = -1n; i++; }

  // Integer part
  const startInt = i;
  while (i < str.length) {
    const c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) { i++; continue; }
    break;
  }
  let INT = str.slice(startInt, i);
  if (INT.length === 0) INT = "0";

  // Optional fractional part
  let FR = "";
  if (i < str.length && str[i] === ".") {
    i++;
    const startFr = i;
    while (i < str.length) {
      const c = str.charCodeAt(i);
      if (c >= 48 && c <= 57) { i++; continue; }
      break;
    }
    FR = str.slice(startFr, i);
    if (FR.length === 0 && INT === "0") throw new Error(`Invalid number: ${str}`);
  }

  // No trailing garbage allowed
  if (i !== str.length) throw new Error(`Invalid number: ${str}`);

  // Fit fractional digits to MATH_SCALE (pad or round)
  let bump = 0n; // 0=none, 1=round up, 2=tie (decide by parity)
  if (FR.length > MATH_SCALE) {
    const keep = FR.slice(0, MATH_SCALE);
    const firstDiscard = FR.charCodeAt(MATH_SCALE) - 48; // 0..9
    const rest = FR.slice(MATH_SCALE + 1);
    FR = keep;
    if (firstDiscard > 5 || (firstDiscard === 5 && NUMBERS_REGEX.test(rest))) bump = 1n;
    else if (firstDiscard === 5 && !NUMBERS_REGEX.test(rest)) bump = 2n;
  }
  FR = FR.padEnd(MATH_SCALE, "0");

  // Merge and strip leading zeros (leave at least one digit)
  let merged = (INT + FR).replace(/^0+(?=\d)/, "");
  if (merged === "") merged = "0";
  let sig = BigInt(merged);

  if (bump !== 0n) {
    if (bump === 1n) {
      sig += 1n; // away from zero (sign applied after)
    } else {
      // tie: HALF_EVEN → parity of last kept digit
      if ((sig % 2n) !== 0n) sig += 1n;
    }
  }

  const out = sign * sig;
  return out === 0n ? 0n : out;
}

/**
 * Full path: parse decimal with optional scientific notation (e/E).
 * Keeps all digits; only rounds if exponent requires dropping digits
 * to land exactly at MATH_SCALE.
 *
 * @param {string} str
 * @returns {bigint} BigInt at scale = MATH_SCALE
 */
function parseSciDecimal(str) {
  let i = 0, sign = 1n;
  const c0 = str.charCodeAt(0);
  if (c0 === 43 /*+*/) i++;
  else if (c0 === 45 /*-*/) { sign = -1n; i++; }

  // Mantissa: integer and optional fraction
  const startInt = i;
  while (i < str.length && str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) i++;
  let INT = str.slice(startInt, i);
  if (INT === "") INT = "0";

  let FR = "";
  if (i < str.length && str[i] === ".") {
    i++;
    const startFr = i;
    while (i < str.length && str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) i++;
    FR = str.slice(startFr, i);
    if (FR === "" && INT === "0") throw new Error(`Invalid number: ${str}`);
  }

  // Optional exponent
  let exp = 0;
  if (i < str.length && (str[i] === "e" || str[i] === "E")) {
    i++;
    const sgn = (i < str.length && (str[i] === "+" || str[i] === "-")) ? str[i++] : "+";
    const startE = i;
    while (i < str.length && str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) i++;
    if (startE === i) throw new Error(`Invalid exponent: ${str}`);
    const eAbs = parseInt(str.slice(startE, i), 10);
    exp = (sgn === "-") ? -eAbs : +eAbs;
  }
  if (i !== str.length) throw new Error(`Invalid trailing characters: ${str}`);

  // Combine mantissa digits and compute scale shift.
  // Value = (INT.FR) * 10^exp = (digits / 10^{FRlen}) * 10^exp
  // Want sig * 10^{-MATH_SCALE} == value  ⇒  sig = digits * 10^{MATH_SCALE - FRlen + exp}
  const FRlen = FR.length;
  const digitsStr = (INT + FR).replace(/^0+(?=\d)/, "") || "0";
  let sig = BigInt(digitsStr);
  const k = MATH_SCALE - FRlen + exp;

  if (k >= 0) {
    // multiply by 10^k
    sig *= pow10n(k);
    const out = sign * sig;
    return out === 0n ? 0n : out;
  } else {
    // divide by 10^{-k} with rounding
    const drop = -k;
    const div = pow10n(drop);
    const num = sign * sig;
    const q = num / div;
    const r = num % div;
    const out = (r === 0n ? q : roundInt(q, r, div));
    return out === 0n ? 0n : out;
  }
}

//#endregion private functions
