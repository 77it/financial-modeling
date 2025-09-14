import { BIGINT_DECIMAL_SCALE as CFG_SCALE, ACCOUNTING_DECIMAL_PLACES as CFG_DECIMAL_PLACES, ROUNDING_MODE as CFG_ROUNDING, /* used only for types */ ROUNDING_MODES} from '../config/engine.js';

export { _TEST_ONLY__set, getSettings };

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

/**
 * Get settings.
 * @return {{ MATH_SCALE: number, ACCOUNTING_DECIMAL_PLACES: number, ROUNDING_MODE: string }} test_roundingMode
 */
function getSettings() {
  return { MATH_SCALE: MATH_SCALE, ACCOUNTING_DECIMAL_PLACES: ACCOUNTING_DECIMAL_PLACES, ROUNDING_MODE: ROUNDING_MODE};
}

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
    if (firstDiscard > 5 || (firstDiscard === 5 && /[1-9]/.test(rest))) bump = 1n;
    else if (firstDiscard === 5 && !/[1-9]/.test(rest)) bump = 2n;
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
 * @throws {Error} on invalid format
 */
export function stringToBigIntScaled(s) {
  const str = String(s).trim();
  if (!str) throw new Error("Empty number");
  // Quick dispatch: plain decimal? take the fast path.
  if (!/[eE]/.test(str)) return parsePlainDecimal(str);
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
export function bigIntScaledToString(sig, opts) {
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
export function fxAdd(a, b) { return a + b; }

/**
 * Subtract b from a, both scale-MATH_SCALE.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function fxSub(a, b) { return a - b; }

/**
 * Multiply two scale-MATH_SCALE BigInts → scale-MATH_SCALE, with rounding.
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export function fxMul(a, b) {
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
export function fxDiv(a, b) {
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
 * Snap a scale-20 BigInt to the accounting grid (4 dp) but KEEP scale 20.
 * @param {bigint} sig
 * @returns {bigint}
 */
export function reduceToAccounting(sig) {
  const q = sig / GRID_FACTOR; // integer at ACCOUNTING_DECIMAL_PLACES dp
  const r = sig % GRID_FACTOR;
  if (r === 0n) return sig === 0n ? 0n : sig;
  const qRounded = roundInt(q, r, GRID_FACTOR);
  const snapped = qRounded * GRID_FACTOR;
  return snapped === 0n ? 0n : snapped;
}

/*
****************************************************************************************************
****************************************************************************************************
****************************************************************************************************
****************************************************************************************************
****************************************************************************************************

██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ ███████╗
██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝███████╗
██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║
██║  ██║███████╗███████╗██║     ███████╗██║  ██║███████║
╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝

****************************************************************************************************
****************************************************************************************************
****************************************************************************************************
****************************************************************************************************
****************************************************************************************************
*/

// ============================
// Financial helpers (BigInt FP)
// ============================

// ---------- Core utilities ----------

/**
 * Fixed-scale integer power with adaptive guard scale.
 * Exponentiation-by-squaring at guard precision, then round once to base scale.
 *
 * @param {bigint} base - scaled base at scale = MATH_SCALE
 * @param {number|bigint} n - exponent (>= 0)
 * @returns {bigint} result at scale = MATH_SCALE
 * @throws {RangeError} if n < 0
 */
export function fxPowInt(base, n) {
  let e = BigInt(n);
  if (e < 0n) throw new RangeError("Exponent must be non-negative");
  if (e === 0n) return SCALE_FACTOR;

  const g = computeGuardDigits(e);
  const SCALE_G = SCALE_FACTOR * pow10n(g);

  let accG = SCALE_G;                   // 1 at guard scale
  let bG   = scaleUpWithGuard(base, g); // base at guard scale

  while (e > 0n) {
    if (e & 1n) accG = fxMulAtScale(accG, bG, SCALE_G);
    e >>= 1n;
    if (e) bG = fxMulAtScale(bG, bG, SCALE_G);
  }
  return scaleDownWithGuard(accG, g);
}

/**
 * Discount factor: DF = 1 / (1 + r)^n
 * @param {bigint} r - rate per period (e.g., 0.05 → stringToBigIntScaled("0.05"))
 * @param {number|bigint} n - non-negative integer periods
 * @returns {bigint} DF at MATH_SCALE
 */
export function fxDiscountFactor(r, n) {
  const onePlusR = fxAdd(SCALE_FACTOR, r);
  const pow = fxPowInt(onePlusR, n);
  return fxDiv(SCALE_FACTOR, pow);
}

/**
 * Compound factor: CF = (1 + r)^n
 * @param {bigint} r
 * @param {number|bigint} n
 * @returns {bigint}
 */
export function fxCompoundFactor(r, n) {
  return fxPowInt(fxAdd(SCALE_FACTOR, r), n);
}

// ---------- PV / FV / PMT ----------

/**
 * Future Value: FV = PV * (1+r)^n
 * @param {bigint} pv
 * @param {bigint} r
 * @param {number|bigint} n
 * @returns {bigint}
 */
export function fxFutureValue(pv, r, n) {
  return fxMul(pv, fxCompoundFactor(r, n));
}

/**
 * Present Value of a single future cashflow: PV = FV / (1+r)^n
 * @param {bigint} fv
 * @param {bigint} r
 * @param {number|bigint} n
 * @returns {bigint}
 */
export function fxPresentValue(fv, r, n) {
  return fxMul(fv, fxDiscountFactor(r, n));
}

/**
 * PMT for an ordinary annuity (or annuity-due if `due=true`), all at BigInt fixed-point.
 * Formula (ordinary): PMT = r * (PV * (1+r)^n + FV) / ((1+r)^n - 1)
 * If due=true (annuity due), divide by (1+r).
 *
 * Does the full algebra at a guard scale and rounds once back to MATH_SCALE.
 *
 * @param {bigint} r - rate per period, scale=MATH_SCALE
 * @param {number|bigint} n - number of periods (>=1)
 * @param {bigint} pv - present value, scale=MATH_SCALE
 * @param {bigint} [fv=0n] - future value target
 * @param {boolean} [due=false] - true for annuity-due
 * @returns {bigint} payment per period, scale=MATH_SCALE
 */
export function fxPmt(r, n, pv, fv = 0n, due = false) {
  const N = BigInt(n);
  if (N <= 0n) throw new RangeError("n must be >= 1");
  if (r === 0n) {
    // PMT = (PV + FV) / n
    return fxDiv(fxAdd(pv, fv), stringToBigIntScaled(String(n)));
  }

  // Compute entirely at a guard scale; then snap once to base scale.
  const g = Math.max(6, computeGuardDigits(N));
  const SCALE_G = SCALE_FACTOR * pow10n(g);

  // (1+r) at guard scale
  const onePlusR_G = scaleUpWithGuard(fxAdd(SCALE_FACTOR, r), g);

  // powG = (1+r)^N at guard scale (exp-by-squaring using guard-scale mul)
  let e = N;
  let accG = SCALE_G;     // 1.0 at guard scale
  let bG   = onePlusR_G;  // base at guard scale
  while (e > 0n) {
    if (e & 1n) accG = fxMulAtScale(accG, bG, SCALE_G);
    e >>= 1n;
    if (e) bG = fxMulAtScale(bG, bG, SCALE_G);
  }
  const powG = accG;

  // Lift inputs to guard scale
  const pvG = scaleUpWithGuard(pv, g);
  const fvG = scaleUpWithGuard(fv, g);
  const rG  = scaleUpWithGuard(r,  g);

  // num = r * (pv * pow + fv)   ; den = pow - 1
  const numLeftG = fxMulAtScale(pvG, powG, SCALE_G);
  const numG     = fxMulAtScale(rG, numLeftG + fvG, SCALE_G);
  const denG     = powG - SCALE_G;

  let pmtG = fxDivAtScale(numG, denG, SCALE_G);
  if (due) pmtG = fxDivAtScale(pmtG, onePlusR_G, SCALE_G);

  return scaleDownWithGuard(pmtG, g);
}

// ---------- NPV / IRR ----------

/**
 * Net Present Value at fixed decimal scale with adaptive guard precision.
 * Computes:
 *   NPV = Σ_{t=0..T-1} CF[t] / (1 + r)^t
 * All intermediate ops are done at guard scale to suppress cumulative drift,
 * then we round once back to base scale.
 *
 * Contract:
 * - `rate` is scaled at base scale (MATH_SCALE), e.g. -0.058817 → scaled bigint.
 * - `cashflows` are scaled at base scale.
 * - Returns base-scale bigint.
 *
 * @param {bigint} rate - periodic rate at scale = MATH_SCALE
 * @param {bigint[]} cashflows - cash flows at scale = MATH_SCALE
 * @returns {bigint} NPV at scale = MATH_SCALE
 */
export function fxNPV(rate, cashflows) {
  const T = BigInt(cashflows.length);
  if (T === 0n) return 0n;

  // Guard digits sized to number of steps (one mul and one div per t)
  const g = computeGuardDigits(T);
  const SCALE_G = SCALE_FACTOR * pow10n(g);

  // Lift inputs to guard scale
  const onePlusR_base = fxAdd(SCALE_FACTOR, rate);            // base scale
  const onePlusR_G    = scaleUpWithGuard(onePlusR_base, g);   // guard scale

  let dfG  = SCALE_G;   // discount factor for t=0 at guard scale (== 1)
  let sumG = 0n;

  for (let i = 0; i < cashflows.length; i++) {
    const cfG = scaleUpWithGuard(cashflows[i], g);
    // sum += cf[i] * df
    const termG = fxMulAtScale(cfG, dfG, SCALE_G);
    sumG = fxAddAtScale(sumG, termG, SCALE_G);

    // df /= (1 + r) for next period (stay at guard scale)
    if (i + 1 < cashflows.length) {
      dfG = fxDivAtScale(dfG, onePlusR_G, SCALE_G);
    }
  }

  // Round back to base scale once
  return scaleDownWithGuard(sumG, g);
}

/**
 * Internal Rate of Return (IRR) via bisection on NPV.
 * - Searches r in [minRate, maxRate] and returns r where NPV≈0.
 * - Works with standard cashflows where cf[0] and sum of others have opposite signs.
 * - All rates returned are BigInt at MATH_SCALE.
 *
 * @param {bigint[]} cashflows - cf[0..T] at MATH_SCALE
 * @param {object} [opts]
 * @param {bigint} [opts.minRate=stringToBigIntScaled("-0.9999")] inclusive lower bound
 * @param {bigint} [opts.maxRate=stringToBigIntScaled("10")] inclusive upper bound (1000%)
 * @param {number} [opts.maxIter=128] iterations
 * @param {bigint} [opts.tol=pow10n(MATH_SCALE-8)] tolerance on |NPV| (≈1e-12 if scale=20)
 * @returns {bigint} r at MATH_SCALE
 */
export function fxIrr(cashflows,
  {
    minRate = stringToBigIntScaled("-0.9999"),
    maxRate = stringToBigIntScaled("10"),
    maxIter = 128,
    tol = pow10n(Math.max(0, MATH_SCALE - 8)), // ~1e-12 @ scale 20
  } = {}
) {
  let lo = minRate, hi = maxRate;
  let fLo = fxNPV(lo, cashflows);
  let fHi = fxNPV(hi, cashflows);

  // Ensure a bracket (if not, try to expand hi quickly up to a cap)
  let expand = 0;
  while ((fLo > 0n && fHi > 0n) || (fLo < 0n && fHi < 0n)) {
    if (expand++ > 16) throw new Error("IRR: failed to bracket root");
    hi = fxAdd(hi, fxAdd(SCALE_FACTOR, hi)); // hi = hi + (1+hi) ~ geometric expand
    fHi = fxNPV(hi, cashflows);
  }

  // Bisection
  for (let i = 0; i < maxIter; i++) {
    const mid = fxDiv(fxAdd(lo, hi), stringToBigIntScaled("2"));
    const fMid = fxNPV(mid, cashflows);
    const absMid = fMid >= 0n ? fMid : -fMid;
    if (absMid <= tol) return mid;

    // Pick sub-interval with sign change
    if ((fLo <= 0n && fMid >= 0n) || (fLo >= 0n && fMid <= 0n)) {
      hi = mid; fHi = fMid;
    } else {
      lo = mid; fLo = fMid;
    }
  }
  // Best effort: return midpoint
  return fxDiv(fxAdd(lo, hi), stringToBigIntScaled("2"));
}

// ---------- Convenience helpers ----------

/**
 * Parse a percentage string/number to a rate BigInt at MATH_SCALE.
 * Example: "5" -> 0.05, "2.5" -> 0.025
 * @param {string|number} p
 * @returns {bigint}
 */
export function fxFromPercent(p) {
  const x = stringToBigIntScaled(String(p));
  return fxDiv(x, stringToBigIntScaled("100"));
}

/**
 * Render a rate BigInt to a percentage string with given decimal places.
 * @param {bigint} r - rate at MATH_SCALE (e.g., 0.05)
 * @param {number} [dp=4] decimal places in the percent string
 * @returns {string}
 */
export function fxToPercentString(r, dp = 4) {
  const hundred = stringToBigIntScaled("100");
  const asPct = fxMul(r, hundred);
  // format with exactly dp decimals
  const SCALE = MATH_SCALE;
  const drop = SCALE - dp;
  if (drop <= 0) {
    // up-scale (rare)
    const s = asPct.toString() + "0".repeat(-drop);
    const neg = s[0] === "-";
    const t = neg ? s.slice(1) : s;
    const i = t.length - SCALE;
    return (neg ? "-" : "") + t.slice(0, i) + "." + t.slice(i);
  }
  // down-scale with HALF_EVEN to dp:
  const div = pow10n(drop);
  let q = asPct / div;
  const rmd = asPct % div;
  if (rmd !== 0n) {
    // HALF_EVEN rounding
    const sign = rmd >= 0n ? 1n : -1n;
    const absR = rmd < 0n ? -rmd : rmd;
    const twice = absR * 2n;
    if (twice > div) q += sign;
    else if (twice === div) {
      const last = (q >= 0n ? q : -q) % 10n;
      if (last % 2n !== 0n) q += sign;
    }
  }
  // build string with exactly dp decimals
  let s = q.toString();
  const neg = s[0] === "-";
  if (neg) s = s.slice(1);
  if (s.length <= dp) s = "0".repeat(dp - s.length + 1) + s;
  const i = s.length - dp;
  return (neg ? "-" : "") + s.slice(0, i) + "." + s.slice(i);
}

/**
 * Level-payment annuity schedule generator (interest-first).
 * Returns:
 *  - payment per period (BigInt at MATH_SCALE)
 *  - array of rows { interest, principal, balance } (all BigInt at MATH_SCALE)
 *
 * @param {bigint} principal
 * @param {bigint} ratePerPeriod
 * @param {number} periods
 * @param {boolean} [due=false] - if true, payments at beginning
 * @returns {{ payment: bigint, rows: Array<{interest: bigint, principal: bigint, balance: bigint}> }}
 */
export function fxAmortizationSchedule(principal, ratePerPeriod, periods, due = false) {
  const n = Number(periods);
  if (!Number.isInteger(n) || n <= 0) throw new RangeError("periods must be positive integer");

  let bal = principal;
  const pmt = fxPmt(ratePerPeriod, n, principal, 0n, due);
  const rows = [];

  for (let k = 1; k <= n; k++) {
    if (due && k === 1) {
      // payment at start: reduce principal immediately
      const principalPart = pmt; // at start, no interest accrued yet
      bal = fxSub(bal, principalPart);
      rows.push({ interest: 0n, principal: principalPart, balance: bal });
      continue;
    }
    const interest = fxMul(bal, ratePerPeriod);
    let principalPart = fxSub(pmt, interest);
    if (k === n) {
      // last row adjustment: pay off remaining balance exactly
      principalPart = bal;
    }
    bal = fxSub(bal, principalPart);
    rows.push({ interest, principal: principalPart, balance: bal });
  }

  return { payment: pmt, rows };
}

/*
██╗███╗   ██╗████████╗███████╗██████╗ ███╗   ██╗ █████╗ ██╗
██║████╗  ██║╚══██╔══╝██╔════╝██╔══██╗████╗  ██║██╔══██╗██║
██║██╔██╗ ██║   ██║   █████╗  ██████╔╝██╔██╗ ██║███████║██║
██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██║╚██╗██║██╔══██║██║
██║██║ ╚████║   ██║   ███████╗██║  ██║██║ ╚████║██║  ██║███████╗
╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝

 ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗     ███████╗ ██████╗ █████╗ ██╗     ███████╗
██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗    ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝
██║  ███╗██║   ██║███████║██████╔╝██║  ██║    ███████╗██║     ███████║██║     █████╗
██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║    ╚════██║██║     ██╔══██║██║     ██╔══╝
╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝    ███████║╚██████╗██║  ██║███████╗███████╗
 ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝     ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝

██╗  ██╗███████╗██╗     ██████╗ ███████╗██████╗ ███████╗
██║  ██║██╔════╝██║     ██╔══██╗██╔════╝██╔══██╗██╔════╝
███████║█████╗  ██║     ██████╔╝█████╗  ██████╔╝███████╗
██╔══██║██╔══╝  ██║     ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║
██║  ██║███████╗███████╗██║     ███████╗██║  ██║███████║
╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝

                    ╔═══════════════╗
                    ║ (NO EXPORTS)  ║
                    ╚═══════════════╝
 */

/**
 * Estimate how many rounded multiplications exp-by-squaring will perform:
 * upper bound ≈ 2 * bitlength(n). We size guard digits so that the total
 * rounding error << 0.5 ulp at base scale after we reduce back.
 *
 * Safe rule: g = (#decimal digits of ops) + 3, min 5.
 * This over-approximates ceil(log10(2*ops)) + 2 and has tiny overhead.
 *
 * @param {bigint} n - exponent (>= 0)
 * @returns {number} guard digits to add on top of MATH_SCALE
 */
function computeGuardDigits(n) {
  if (n <= 1n) return 5;

  // bit length of n
  let bl = 0n, t = n;
  while (t > 0n) { t >>= 1n; bl++; }

  // rough upper bound on multiply count
  const ops = 2n * bl;

  // decimal digits of ops
  let dd = 0n, u = ops;
  while (u > 0n) { u /= 10n; dd++; }

  const g = Number(dd) + 3; // conservative cushion
  return g < 5 ? 5 : g;
}

/**
 * Promote a scaled integer from base scale (MATH_SCALE)
 * to guard scale (MATH_SCALE + g).
 * @param {bigint} sig - value at scale = MATH_SCALE
 * @param {number} g - guard digits to add (>= 1)
 * @returns {bigint} value at scale = MATH_SCALE + g
 */
function scaleUpWithGuard(sig, g) {
  return sig * pow10n(g);
}

/**
 * Reduce from guard scale (MATH_SCALE + g) back to base (MATH_SCALE),
 * using global HALF_* rounding; normalizes -0n.
 * @param {bigint} sigG - value at scale = MATH_SCALE + g
 * @param {number} g - guard digits previously used
 * @returns {bigint} value at scale = MATH_SCALE
 */
function scaleDownWithGuard(sigG, g) {
  const d = pow10n(g);
  const q = sigG / d;
  const r = sigG % d;
  if (r === 0n) return q === 0n ? 0n : q;
  return roundInt(q, r, d) || 0n;
}

/**
 * Multiply two values at the SAME scale and round back to that scale.
 * Uses global HALF_* mode. Normalizes -0n to 0n.
 * @param {bigint} rawA - operand A at scale = SCALE
 * @param {bigint} rawB - operand B at scale = SCALE
 * @param {bigint} SCALE - scaling factor (10^digits), positive
 * @returns {bigint} product at scale = SCALE
 */
function fxMulAtScale(rawA, rawB, SCALE) {
  const raw = rawA * rawB;            // scale = 2*SCALE
  const q = raw / SCALE;              // truncate
  const r = raw % SCALE;
  if (r === 0n) return q === 0n ? 0n : q;
  return roundInt(q, r, SCALE) || 0n;
}

/**
 * Add two fixed-point BigInts already expressed at the same SCALE.
 * SCALE is accepted for API symmetry; it is not
 * used in the arithmetic because addition requires no rescaling.
 *
 * @param {bigint} a - Left operand (fixed-point at SCALE)
 * @param {bigint} b - Right operand (fixed-point at SCALE)
 * @param {bigint} SCALE - [UNUSED] Scale factor (e.g., 10n ** 20n or guard SCALE_G)
 * @returns {bigint} Sum at SCALE
 */
export function fxAddAtScale(a, b, SCALE) {
  return a + b;
}

/**
 * Subtract two fixed-point BigInts already expressed at the same SCALE.
 * SCALE is accepted for API symmetry; it is not
 * used in the arithmetic because addition requires no rescaling.
 * @param {bigint} a - Left operand (fixed-point at SCALE)
 * @param {bigint} b - Right operand (fixed-point at SCALE)
 * @param {bigint} SCALE - [UNUSED] Scale factor (e.g., 10n ** 20n or guard SCALE_G)
 * @returns {bigint} Difference at SCALE
 */
export function fxSubAtScale(a, b, SCALE) {
  // Optional dev guard:
  // if (SCALE <= 0n) throw new RangeError("SCALE must be > 0");
  return a - b;
}

/**
 * Divide two values at the SAME scale and round back to that scale
 * using the global HALF_* rounding mode. Normalizes -0n.
 *
 * Contract:
 * - Numerator and denominator are at scale = SCALE.
 * - Denominator ≠ 0n.
 * - Rounding direction follows the RESULT’s sign (handled via rAdj).
 *
 * @param {bigint} num - numerator at scale = SCALE
 * @param {bigint} den - denominator at scale = SCALE
 * @param {bigint} SCALE - scaling factor (10^digits), positive
 * @returns {bigint} quotient at scale = SCALE
 */
function fxDivAtScale(num, den, SCALE) {
  if (den === 0n) throw new RangeError("Division by zero");
  const wide = num * SCALE;      // promote to preserve scale
  const q = wide / den;
  const r = wide % den;
  if (r === 0n) return q === 0n ? 0n : q;

  const absDen = den < 0n ? -den : den;
  // Align remainder sign to RESULT sign (same rule as fxDiv fix)
  const rAdj = den < 0n ? -r : r;
  const out = roundInt(q, rAdj, absDen);
  return out === 0n ? 0n : out;
}
