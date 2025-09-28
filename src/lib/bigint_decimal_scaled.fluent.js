import {
  ensureBigIntScaled as libEnsureBigIntScaled,
  bigIntScaledToString,
  roundToAccounting,
  fxAdd, fxSub, fxMul, fxDiv,
} from "./bigint_decimal_scaled.arithmetic.js";

/**
 * Coerce various inputs to a scaled BigInt used internally by the library.
 * Accepts: DSBValue, bigint (already scaled), string, number.
 * @param {DSBValue|bigint|string|number} x
 * @returns {bigint}
 */
function ensureBigIntScaled(x) {
  if (x instanceof DSBValue) return x.sig;

  return libEnsureBigIntScaled(x);
}

/**
 * Immutable fluent value for Decimal-Scaled-BigInt (DSB).
 * Wraps a scaled BigInt (`sig`) and exposes chainable ops that return new instances.
 */
export class DSBValue {
  /**
   * @param {bigint} sig - internal scaled BigInt (already scaled)
   */
  constructor(sig) {
    /** @readonly @type {bigint} */
    this.sig = sig;
    Object.freeze(this);
  }

  /**
   * Create from various inputs (DSBValue|bigint|string|number).
   * @param {DSBValue|bigint|string|number} x
   * @returns {DSBValue}
   */
  static from(x) {
    return x instanceof DSBValue ? x : new DSBValue(ensureBigIntScaled(x));
  }

  /**
   * Add another value.
   * @param {DSBValue|bigint|string|number} y
   * @returns {DSBValue}
   */
  add(y) {
    const r = fxAdd(this.sig, ensureBigIntScaled(y));
    return new DSBValue(r);
  }

  /**
   * Subtract another value (this - y).
   * @param {DSBValue|bigint|string|number} y
   * @returns {DSBValue}
   */
  sub(y) {
    const r = fxSub(this.sig, ensureBigIntScaled(y));
    return new DSBValue(r);
  }

  /**
   * Multiply by another value.
   * @param {DSBValue|bigint|string|number} y
   * @returns {DSBValue}
   */
  mul(y) {
    const r = fxMul(this.sig, ensureBigIntScaled(y));
    return new DSBValue(r);
  }

  /**
   * Divide by another value.
   * Any extra options your fxDiv supports can be passed through.
   * @param {DSBValue|bigint|string|number} y
   * @returns {DSBValue}
   */
  div(y) {
    const r = fxDiv(this.sig, ensureBigIntScaled(y));
    return new DSBValue(r);
  }

  /**
   * Apply accounting rounding (or your chosen rounding mode).
   * Any extra options are forwarded to roundToAccounting.
   * @returns {DSBValue}
   */
  roundAccounting() {
    const r = roundToAccounting(this.sig);
    return new DSBValue(r);
  }

  /**
   * Get the internal scaled BigInt (for interop/serialization).
   * @returns {bigint}
   */
  value() {
    return this.sig;
  }

  /**
   * Convert to string using your library formatter.
   * @param {{trim?: boolean}} [opts]
   * @returns {string}
   */
  toString(opts) {
    return bigIntScaledToString(this.sig, opts);
  }
}

/**
 * Convenience factory for fluent usage.
 * @template T
 * @param {DSBValue|bigint|string|number} x
 * @returns {DSBValue}
 */
export function dsb(x) {
  return DSBValue.from(x);
}
