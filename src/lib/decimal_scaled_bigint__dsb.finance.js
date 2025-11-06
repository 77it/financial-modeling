//<file decimal_scaled_bigint__dsb.finance.js>

/*
for easiness of implementation this module ported the `pmt` function from `financial.js` library,
internally using `decimal.js` for calculations, and converting the result to our DSB (Decimal Scaled BigInt) format.
we didn't use our DSB library because we didn't implement fractional powers yet.
 */

export { fxPmt, FXPMT_PAYMENT_DUE_TIME };

import { Decimal } from '../../vendor/decimaljs/decimal.js';
import { bigIntScaledToString, ensureBigIntScaled, stringToBigIntScaled } from './decimal_scaled_bigint__dsb.arithmetic_x.js';

const FXPMT_PAYMENT_DUE_TIME = Object.freeze({
  BEGIN: "begin",
  END: "end",
});

// porting of function pmt
// from https://github.com/77it/financial-modeling/blob/2f0c357ee7e451c12783d17667889963ad3c14e7/vendor/financial/financial.esm.js#L160
/**
 * Compute the payment against loan principal plus interest.
 *
 * @param {number} rate - Rate of interest (per period)
 * @param {number} nper - Number of compounding periods (e.g., number of payments)
 * @param {bigint|string|number} pv - Present value (e.g., an amount borrowed), will be converted to Decimal Scaled BigInt before calculation
 * @param {number} [fv=0] - Future value (e.g., 0)
 * @param {'begin'|'end'} [when=FXPMT_PAYMENT_DUE_TIME.END] - When payments are due
 * @returns {bigint} the (fixed) periodic payment in DSB (Decimal Scaled BigInt) format
 *
 * ## Examples
 *
 * What is the monthly payment needed to pay off a $200,000 loan in 15
 * years at an annual interest rate of 7.5%?
 *
 * ```javascript
 * import { pmt } from 'financial'
 *
 * pmt(0.075/12, 12*15, 200000) // -1854.0247200054619
 * ```
 *
 * In order to pay-off (i.e., have a future-value of 0) the $200,000 obtained
 * today, a monthly payment of $1,854.02 would be required.  Note that this
 * example illustrates usage of `fv` having a default value of 0.
 *
 * ## Notes
 *
 * The payment is computed by solving the equation:
 *
 * ```
 * fv + pv * (1 + rate) ** nper + pmt * (1 + rate*when) / rate * ((1 + rate) ** nper - 1) == 0
 * ```
 *
 * or, when `rate == 0`:
 *
 * ```
 * fv + pv + pmt * nper == 0
 * ```
 *
 * for `pmt`.
 *
 * Note that computing a monthly mortgage payment is only
 * one use for this function.  For example, `pmt` returns the
 * periodic deposit one must make to achieve a specified
 * future balance given an initial deposit, a fixed,
 * periodically compounded interest rate, and the total
* number of periods.
 *
 * ## References
 *
 * [Wheeler, D. A., E. Rathke, and R. Weir (Eds.) (2009, May)](http://www.oasis-open.org/committees/documents.php?wg_abbrev=office-formulaOpenDocument-formula-20090508.odt).
 */
function fxPmt(rate, nper, pv, fv = 0, when= FXPMT_PAYMENT_DUE_TIME.END) {
  // convert pv to DSB -> String -> Decimal
  const pvD = new Decimal(bigIntScaledToString(ensureBigIntScaled(pv)));

  // Convert all other inputs to Decimal for consistent precision
  const rateD = new Decimal(rate);
  const nperD = new Decimal(nper);
  const fvD = new Decimal(fv);

  const isRateZero = rateD.isZero();

  const tempD = rateD.plus(1).pow(nperD);
  const whenMult = when === FXPMT_PAYMENT_DUE_TIME.BEGIN ? 1 : 0;
  const maskedRateD = isRateZero ? new Decimal(1) : rateD;
  const factD = isRateZero ? nperD : (new Decimal(1).plus(maskedRateD.mul(whenMult))).mul(tempD.minus(1)).div(maskedRateD);
  const pmtD = fvD.plus(pvD.mul(tempD)).div(factD).neg();

  // Convert the result to scaled BigInt
  return stringToBigIntScaled(pmtD.toString());
}
