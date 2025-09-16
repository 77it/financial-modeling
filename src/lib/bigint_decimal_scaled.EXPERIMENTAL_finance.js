//<file bigint_decimal_scaled.EXPERIMENTAL_finance.js>

/*
███████╗██╗  ██╗██████╗ ███████╗██████╗ ██╗███╗   ███╗███████╗███╗   ██╗████████╗ █████╗ ██╗
██╔════╝╚██╗██╔╝██╔══██╗██╔════╝██╔══██╗██║████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██║
█████╗   ╚███╔╝ ██████╔╝█████╗  ██████╔╝██║██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ███████║██║
██╔══╝   ██╔██╗ ██╔═══╝ ██╔══╝  ██╔══██╗██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ██╔══██║██║
███████╗██╔╝ ██╗██║     ███████╗██║  ██║██║██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚══════╝

███████╗██╗   ██╗███╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
██╔════╝██║   ██║████╗  ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
█████╗  ██║   ██║██╔██╗ ██║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
██╔══╝  ██║   ██║██║╚██╗██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
██║     ╚██████╔╝██║ ╚████║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
 */

export { fxPowInt, fxDiscountFactor, fxCompoundFactor, fxFutureValue, fxPresentValue, fxPmt, fxNPV, fxIrr, fxFromPercent, fxToPercentString, fxAmortizationSchedule };

import { stringToBigIntScaled, fxAdd, fxSub, fxMul, fxDiv } from './bigint_decimal_scaled.arithmetic.js';
import { _TEST_ONLY__MATH_SCALE as MATH_SCALE, _TEST_ONLY__SCALE_FACTOR as SCALE_FACTOR, _TEST_ONLY__MAX_POW10 as MAX_POW10, _TEST_ONLY__POW10 as POW10 } from './bigint_decimal_scaled.arithmetic.js';
import { _INTERNAL_roundInt as roundInt } from './bigint_decimal_scaled.arithmetic.js';

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

/**
 * same code as in `bigint_decimal_scaled.arithmetic.js`
 *
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
function fxPowInt(base, n) {
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
function fxDiscountFactor(r, n) {
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
function fxCompoundFactor(r, n) {
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
function fxFutureValue(pv, r, n) {
  return fxMul(pv, fxCompoundFactor(r, n));
}

/**
 * Present Value of a single future cashflow: PV = FV / (1+r)^n
 * @param {bigint} fv
 * @param {bigint} r
 * @param {number|bigint} n
 * @returns {bigint}
 */
function fxPresentValue(fv, r, n) {
  return fxMul(fv, fxDiscountFactor(r, n));
}

/**
 * Compute the periodic **payment** for an annuity using fixed-point BigInt arithmetic
 * at scale `MATH_SCALE`. Supports both **ordinary annuity** (end-of-period payments)
 * and **annuity-due** (beginning-of-period payments), and lets you choose the **sign
 * convention** (pure math vs Excel/Sheets).
 *
 * ### Math
 * Ordinary annuity (payments at period end):
 * ```
 * PMT = r * (PV * (1 + r)^n + FV) / ((1 + r)^n - 1)
 * ```
 * Annuity-due adjusts the ordinary result by dividing by `(1 + r)`:
 * ```
 * PMT_due = PMT_ordinary / (1 + r)
 * ```
 *
 * ### Sign conventions
 * - `"sameAsPV"` (default): **pure math**; the returned `PMT` has the **same sign as `PV`**.
 * - `"excelCompat"`: matches Excel/Google Sheets; `PMT` is **negated** relative to `"sameAsPV"`.
 *
 * ### Rounding & precision
 * - All intermediate operations are performed at a **guard scale** `MATH_SCALE + g` where
 *   `g = max(6, computeGuardDigits(n))`, to limit rounding error. The result is then
 *   reduced **once** back to `MATH_SCALE` using the engine’s global rounding mode
 *   (typically `ROUND_HALF_EVEN`).
 * - Internally, `SCALE_FACTOR = 10^MATH_SCALE`. Guard-scale helpers
 *   (`scaleUpWithGuard`, `scaleDownWithGuard`, `fxMulAtScale`, `fxDivAtScale`) ensure
 *   consistent rounding at the chosen scale.
 *
 * ### Edge cases & invariants
 * - If `r === 0n`, the formula reduces to an arithmetic average:
 *   ```
 *   PMT = (PV + FV) / n
 *   ```
 *   The `due` flag has **no effect** at zero rate.
 * - Division by zero is guarded by the `r === 0n` branch. For non-zero `r`, the denominator
 *   is `(1 + r)^n - 1`. In finance, rates ≤ −100% (e.g., `r <= -SCALE_FACTOR`) are invalid.
 *   Note that exotic values like `r = -2` with even `n` make `(1 + r)^n = 1` and would
 *   **zero the denominator**; such inputs are out of scope for this function.
 * - `n` must be a positive integer (`n >= 1`). A non-integral `n` will cause the internal
 *   `BigInt(n)` coercion to throw.
 *
 * @param {bigint} r
 *   Periodic interest rate **scaled by** `MATH_SCALE`. For example, with `MATH_SCALE = 20`,
 *   a 5% rate is `stringToBigIntScaled("0.05")`. May be negative (but > −1 in practical use).
 *
 * @param {number|bigint} n
 *   Number of periods (must be an integer `>= 1`). Accepts a JS `number` (coerced via
 *   `BigInt(n)`) or a `bigint`. Large `n` increases guard digits via `computeGuardDigits(n)`.
 *
 * @param {bigint} pv
 *   Present value **scaled by** `MATH_SCALE`. Sign indicates direction (cash in/out).
 *
 * @param {bigint} [fv=0n]
 *   Target future value **scaled by** `MATH_SCALE`. Defaults to zero (fully amortizing).
 *
 * @param {boolean} [due=false]
 *   If `true`, computes an **annuity-due** (payments at the **start** of each period).
 *   When `r === 0n`, `due` has no effect.
 *
 * @param {"sameAsPV"|"excelCompat"} [sign="sameAsPV"]
 *   Sign convention for the returned payment:
 *   - `"sameAsPV"`: keep **same sign** as `pv` (library/pure-math convention).
 *   - `"excelCompat"`: **negate** to match Excel/Sheets convention.
 *
 * @returns {bigint}
 *   The periodic payment **scaled by** `MATH_SCALE`. Apply your formatter
 *   (e.g., `bigIntScaledToString`) to render a human-readable decimal string.
 *
 * @throws {RangeError}
 *   If `n <= 0`.
 *
 * @throws {TypeError}
 *   If `n` is not coercible to `BigInt` (e.g., a non-integral `number` like `12.3`,
 *   `NaN`, or an incompatible type).
 *
 * @example
 * // Library/pure-math sign (same as PV)
 * const r  = stringToBigIntScaled("0.05");   // 5% per period
 * const n  = 24;                             // 24 periods
 * const pv = stringToBigIntScaled("10000");  // 10,000 principal
 * const p  = fxPmt(r, n, pv);                // due=false, sign="sameAsPV" (default)
 * console.log(bigIntScaledToString(p));      // payment with SAME sign as PV
 *
 * @example
 * // Excel/Sheets compatible sign (opposite to PV)
 * const pX = fxPmt(r, n, pv, 0n, false, "excelCompat");
 * console.log(bigIntScaledToString(pX));     // payment NEGATED vs pure-math result
 *
 * @example
 * // Annuity-due (payments at period start)
 * const pDue = fxPmt(r, n, pv, 0n, true);    // due=true
 * console.log(bigIntScaledToString(pDue));
 *
 * @example
 * // Zero rate: simple average; `due` has no effect
 * const r0  = stringToBigIntScaled("0");
 * const p0  = fxPmt(r0, 10, stringToBigIntScaled("1000"), 0n, true);
 * // p0 === (pv + fv) / 10, then sign-adjusted if "excelCompat" is chosen.
 */
function fxPmt(r, n, pv, fv = 0n, due = false, sign="sameAsPV") {
  const N = BigInt(n);
  if (N <= 0n) throw new RangeError("n must be >= 1");

  if (r === 0n) {
    // base formula, no sign flip here
    let p = fxDiv(fxAdd(pv, fv), stringToBigIntScaled(String(n)));
    if (sign === "excelCompat") p = -p;
    return p;
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

  let p = scaleDownWithGuard(pmtG, g);
  if (sign === "excelCompat") p = -p;
  return p;
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
function fxNPV(rate, cashflows) {
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
function fxIrr(cashflows,
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
function fxFromPercent(p) {
  const x = stringToBigIntScaled(String(p));
  return fxDiv(x, stringToBigIntScaled("100"));
}

/**
 * Render a rate BigInt to a percentage string with given decimal places.
 * @param {bigint} r - rate at MATH_SCALE (e.g., 0.05)
 * @param {number} [dp=4] decimal places in the percent string
 * @returns {string}
 */
function fxToPercentString(r, dp = 4) {
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
function fxAmortizationSchedule(principal, ratePerPeriod, periods, due = false) {
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
function fxAddAtScale(a, b, SCALE) {
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
function fxSubAtScale(a, b, SCALE) {
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
  const wide = num * SCALE;          // promote to preserve scale
  const q = wide / den;
  const r = wide % den;
  if (r === 0n) return q === 0n ? 0n : q;

  const absDen = den < 0n ? -den : den;
  // Align remainder sign to RESULT sign (same rule as fxDiv)
  const rAdj = den < 0n ? -r : r;

  const out = roundInt(q, rAdj, absDen); // <-- no guard
  return out === 0n ? 0n : out;
}

// UNUSED FUNCTION
/**
 * Divide two BigInt fixed-point values at an **arbitrary SCALE**,
 * carrying an **extra guard digit** (×10) to reduce rounding drift.
 *
 * ### How it works
 * - Multiplies the numerator by `SCALE × 10n` instead of just `SCALE`.
 * - Performs integer division and rounding in the guarded domain.
 * - Drops the guard digit once at the end to return to the caller’s `SCALE`.
 *
 * ### Behavior vs. `fxDivAtScale`
 * - `fxDivAtScale` (unguarded) matches Decimal.js exactly at the given `SCALE`.
 * - `fxDivAtScaleGuarded` may differ by ±1 ulp on HALF_EVEN ties,
 *   because it rounds using the extra digit before reducing.
 *
 * ### When to use
 * - Use inside **guard-scale finance helpers** (`fxPowInt`, `fxPmt`, `fxNPV`),
 *   when you want to minimize cumulative rounding error in intermediate steps.
 * - **Do not** use for regression tests or when matching Decimal.js is required.
 *
 * @param {bigint} num - Numerator at scale = `SCALE`.
 * @param {bigint} den - Denominator at scale = `SCALE` (≠ 0n).
 * @param {bigint} SCALE - Scaling factor (e.g. `10n ** 20n` or guard scale).
 * @returns {bigint} Quotient at the same `SCALE`, rounded according to `ROUNDING_MODE`.
 * @throws {RangeError} If `den === 0n`.
 */
/*
function fxDivAtScaleGuarded(num, den, SCALE) {
  if (den === 0n) throw new RangeError("Division by zero");

  // Promote to preserve scale and add a single guard digit (×10).
  // This avoids rounding on a truncated last digit for extreme quotients.
  const GUARD = 10n;
  const wide  = num * SCALE * GUARD;

  // One division; remainder via subtraction to avoid a second div/mod if desired.
  let q = wide / den;
  let r = wide - q * den; // sign(r) == sign(num)
  if (r === 0n) {
    const exact = q / GUARD;
    return exact === 0n ? 0n : exact;
  }

  const absDen = den < 0n ? -den : den;
  // Align remainder sign to the RESULT (same rule used elsewhere).
  const rAdj = den < 0n ? -r : r;

  // Round at guard precision, then drop guard once.
  q = roundInt(q, rAdj, absDen, GUARD);
  const out = q / GUARD;
  return out === 0n ? 0n : out;
}
*/