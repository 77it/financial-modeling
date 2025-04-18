/**
 * When payments are due
 *
 * @since v0.0.12
 */
export declare enum PaymentDueTime {
    /** Payments due at the beginning of a period (1) */
    Begin = "begin",// 1
    /** Payments are due at the end of a period (0) */
    End = "end"
}
/**
 * Compute the future value.
 *
 * @param rate - Rate of interest as decimal (not per cent) per period
 * @param nper - Number of compounding periods
 * @param pmt - A fixed payment, paid either at the beginning or ar the end (specified by `when`)
 * @param pv - Present value
 * @param when - When payment was made
 *
 * @returns The value at the end of the `nper` periods
 *
 * @since v0.0.12
 *
 * ## Examples
 *
 * What is the future value after 10 years of saving $100 now, with
 * an additional monthly savings of $100. Assume the interest rate is
 * 5% (annually) compounded monthly?
 *
 * ```javascript
 * import { fv } from 'financial'
 *
 * fv(0.05 / 12, 10 * 12, -100, -100) // 15692.928894335748
 * ```
 *
 * By convention, the negative sign represents cash flow out (i.e. money not
 * available today).  Thus, saving $100 a month at 5% annual interest leads
 * to $15,692.93 available to spend in 10 years.
 *
 * ## Notes
 *
 * The future value is computed by solving the equation:
 *
 * ```
 * fv + pv * (1+rate) ** nper + pmt * (1 + rate * when) / rate * ((1 + rate) ** nper - 1) == 0
 * ```
 *
 * or, when `rate == 0`:
 *
 * ```
 * fv + pv + pmt * nper == 0
 * ```
 *
 * ## References
 *
 * [Wheeler, D. A., E. Rathke, and R. Weir (Eds.) (2009, May)](http://www.oasis-open.org/committees/documents.php?wg_abbrev=office-formulaOpenDocument-formula-20090508.odt).
 */
export declare function fv(rate: number, nper: number, pmt: number, pv: number, when?: PaymentDueTime): number;
/**
 * Compute the payment against loan principal plus interest.
 *
 * @param rate - Rate of interest (per period)
 * @param nper - Number of compounding periods (e.g., number of payments)
 * @param pv - Present value (e.g., an amount borrowed)
 * @param fv - Future value (e.g., 0)
 * @param when - When payments are due
 *
 * @returns the (fixed) periodic payment
 *
 * @since v0.0.12
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
export declare function pmt(rate: number, nper: number, pv: number, fv?: number, when?: PaymentDueTime): number;
/**
 * Compute the number of periodic payments.
 *
 * @param rate - Rate of interest (per period)
 * @param pmt - Payment
 * @param pv - Present value
 * @param fv - Future value
 * @param when - When payments are due
 *
 * @returns The number of periodic payments
 *
 * @since v0.0.12
 *
 * ## Examples
 *
 * If you only had $150/month to pay towards the loan, how long would it take
 * to pay-off a loan of $8,000 at 7% annual interest?
 *
 * ```javascript
 * import { nper } from 'financial'
 *
 * Math.round(nper(0.07/12, -150, 8000), 5) // 64.07335
 * ```
 *
 * So, over 64 months would be required to pay off the loan.
 *
 * ## Notes
 *
 * The number of periods `nper` is computed by solving the equation:
 *
 * ```
 * fv + pv * (1+rate) ** nper + pmt * (1+rate * when) / rate * ((1+rate) ** nper-1) = 0
 * ```
 *
 * but if `rate = 0` then:
 *
 * ```
 * fv + pv + pmt * nper = 0
 * ```
 */
export declare function nper(rate: number, pmt: number, pv: number, fv?: number, when?: PaymentDueTime): number;
/**
 * Compute the interest portion of a payment.
 *
 * @param rate - Rate of interest as decimal (not per cent) per period
 * @param per - Interest paid against the loan changes during the life or the loan. The `per` is the payment period to calculate the interest amount
 * @param nper - Number of compounding periods
 * @param pv - Present value
 * @param fv - Future value
 * @param when - When payments are due
 *
 * @returns Interest portion of payment
 *
 * @since v0.0.12
 *
 * ## Examples
 *
 * What is the amortization schedule for a 1 year loan of $2500 at
 * 8.24% interest per year compounded monthly?
 *
 * ```javascript
 * const principal = 2500
 * const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
 * const ipmts = periods.map((per) => f.ipmt(0.0824 / 12, per, 1 * 12, principal))
 * expect(ipmts).toEqual([
 *   -17.166666666666668,
 *   -15.789337457350777,
 *   -14.402550587464257,
 *   -13.006241114404524,
 *   -11.600343649629737,
 *   -10.18479235559687,
 *   -8.759520942678298,
 *   -7.324462666057678,
 *   -5.879550322604295,
 *   -4.424716247725826,
 *   -2.9598923121998877,
 *   -1.4850099189833388
 * ])
 * const interestpd = ipmts.reduce((a, b) => a + b, 0)
 * expect(interestpd).toBeCloseTo(-112.98308424136215, 6)
 * ```
 *
 * The `periods` variable represents the periods of the loan.  Remember that financial equations start the period count at 1!
 *
 * ## Notes
 *
 * The total payment is made up of payment against principal plus interest.
 *
 * ```
 * pmt = ppmt + ipmt
 * ```
 */
export declare function ipmt(rate: number, per: number, nper: number, pv: number, fv?: number, when?: PaymentDueTime): number;
/**
 * Compute the payment against loan principal.
 *
 * @param rate - Rate of interest (per period)
 * @param per - Amount paid against the loan changes.  The `per` is the period of interest.
 * @param nper - Number of compounding periods
 * @param pv - Present value
 * @param fv - Future value
 * @param when - When payments are due
 *
 * @returns the payment against loan principal
 *
 * @since v0.0.14
 */
export declare function ppmt(rate: number, per: number, nper: number, pv: number, fv?: number, when?: PaymentDueTime): number;
/**
 * Calculates the present value of an annuity investment based on constant-amount
 * periodic payments and a constant interest rate.
 *
 * @param rate - Rate of interest (per period)
 * @param nper - Number of compounding periods
 * @param pmt - Payment
 * @param fv - Future value
 * @param when - When payments are due
 *
 * @returns the present value of a payment or investment
 *
 * @since v0.0.15
 *
 * ## Examples
 *
 * What is the present value (e.g., the initial investment)
 * of an investment that needs to total $15692.93
 * after 10 years of saving $100 every month?  Assume the
 * interest rate is 5% (annually) compounded monthly.
 *
 * ```javascript
 * import { pv } from 'financial'
 *
 * pv(0.05/12, 10*12, -100, 15692.93) // -100.00067131625819
 * ```
 *
 * By convention, the negative sign represents cash flow out
 * (i.e., money not available today).  Thus, to end up with
 * $15,692.93 in 10 years saving $100 a month at 5% annual
 * interest, one's initial deposit should also be $100.
 *
 * ## Notes
 *
 * The present value is computed by solving the equation:
 *
 * ```
 * fv + pv * (1 + rate) ** nper + pmt * (1 + rate * when) / rate * ((1 + rate) ** nper - 1) = 0
 * ```
 *
 * or, when `rate = 0`:
 *
 * ```
 * fv + pv + pmt * nper = 0
 * ```
 *
 * for `pv`, which is then returned.
 *
 * ## References
 *
 * [Wheeler, D. A., E. Rathke, and R. Weir (Eds.) (2009, May)](http://www.oasis-open.org/committees/documents.php?wg_abbrev=office-formulaOpenDocument-formula-20090508.odt).
 */
export declare function pv(rate: number, nper: number, pmt: number, fv?: number, when?: PaymentDueTime): number;
/**
 * Compute the rate of interest per period
 *
 * @param nper - Number of compounding periods
 * @param pmt - Payment
 * @param pv - Present value
 * @param fv - Future value
 * @param when - When payments are due ('begin' or 'end')
 * @param guess - Starting guess for solving the rate of interest
 * @param tol - Required tolerance for the solution
 * @param maxIter - Maximum iterations in finding the solution
 *
 * @returns the rate of interest per period (or `NaN` if it could
 *  not be computed within the number of iterations provided)
 *
 * @since v0.0.16
 *
 * ## Notes
 *
 * Use Newton's iteration until the change is less than 1e-6
 * for all values or a maximum of 100 iterations is reached.
 * Newton's rule is:
 *
 * ```
 * r_{n+1} = r_{n} - g(r_n)/g'(r_n)
 * ```
 *
 * where:
 *
 * - `g(r)` is the formula
 * - `g'(r)` is the derivative with respect to r.
 *
 *
 * The rate of interest is computed by iteratively solving the
 * (non-linear) equation:
 *
 * ```
 * fv + pv * (1+rate) ** nper + pmt * (1+rate * when) / rate * ((1+rate) ** nper - 1) = 0
 * ```
 *
 * for `rate.
 *
 * ## References
 *
 * [Wheeler, D. A., E. Rathke, and R. Weir (Eds.) (2009, May)](http://www.oasis-open.org/committees/documents.php?wg_abbrev=office-formulaOpenDocument-formula-20090508.odt).
 */
export declare function rate(nper: number, pmt: number, pv: number, fv: number, when?: PaymentDueTime, guess?: number, tol?: number, maxIter?: number): number;
/**
 * Return the Internal Rate of Return (IRR).
 *
 * This is the "average" periodically compounded rate of return
 * that gives a net present value of 0.0; for a more complete
 * explanation, see Notes below.
 *
 * @param values - Input cash flows per time period.
 *   By convention, net "deposits"
 *   are negative and net "withdrawals" are positive.  Thus, for
 *   example, at least the first element of `values`, which represents
 *   the initial investment, will typically be negative.
 * @param guess - Starting guess for solving the Internal Rate of Return
 * @param tol - Required tolerance for the solution
 * @param maxIter - Maximum iterations in finding the solution
 *
 * @returns Internal Rate of Return for periodic input values
 *
 * @since v0.0.17
 *
 * ## Notes
 *
 * The IRR is perhaps best understood through an example (illustrated
 * using `irr` in the Examples section below).
 *
 * Suppose one invests 100
 * units and then makes the following withdrawals at regular (fixed)
 * intervals: 39, 59, 55, 20.  Assuming the ending value is 0, one's 100
 * unit investment yields 173 units; however, due to the combination of
 * compounding and the periodic withdrawals, the "average" rate of return
 * is neither simply 0.73/4 nor (1.73)^0.25-1.
 * Rather, it is the solution (for `r`) of the equation:
 *
 * ```
 * -100 + 39/(1+r) + 59/((1+r)^2) + 55/((1+r)^3) + 20/((1+r)^4) = 0
 * ```
 *
 * In general, for `values` = `[0, 1, ... M]`,
 * `irr` is the solution of the equation:
 *
 * ```
 * \\sum_{t=0}^M{\\frac{v_t}{(1+irr)^{t}}} = 0
 * ```
 *
 * ## Example
 *
 * ```javascript
 * import { irr } from 'financial'
 *
 * irr([-100, 39, 59, 55, 20]) // 0.28095
 * irr([-100, 0, 0, 74]) // -0.0955
 * irr([-100, 100, 0, -7]) // -0.0833
 * irr([-100, 100, 0, 7]) // 0.06206
 * irr([-5, 10.5, 1, -8, 1]) // 0.0886
 * ```
 *
 * ## References
 *
 * - L. J. Gitman, "Principles of Managerial Finance, Brief," 3rd ed.,
 *  Addison-Wesley, 2003, pg. 348.
 */
export declare function irr(values: number[], guess?: number, tol?: number, maxIter?: number): number;
/**
 * Returns the NPV (Net Present Value) of a cash flow series.
 *
 * @param rate - The discount rate
 * @param values - The values of the time series of cash flows.  The (fixed) time
 * interval between cash flow "events" must be the same as that for
 * which `rate` is given (i.e., if `rate` is per year, then precisely
 * a year is understood to elapse between each cash flow event).  By
 * convention, investments or "deposits" are negative, income or
 * "withdrawals" are positive; `values` must begin with the initial
 * investment, thus `values[0]` will typically be negative.
 * @returns The NPV of the input cash flow series `values` at the discount `rate`.
 *
 * @since v0.0.18
 *
 * ## Warnings
 *
 * `npv considers a series of cashflows starting in the present (t = 0).
 * NPV can also be defined with a series of future cashflows, paid at the
 * end, rather than the start, of each period. If future cashflows are used,
 * the first cashflow `values[0]` must be zeroed and added to the net
 * present value of the future cashflows. This is demonstrated in the
 * examples.
 *
 * ## Notes
 *
 * Returns the result of:
 *
 * ```
 * \\sum_{t=0}^{M-1}{\\frac{values_t}{(1+rate)^{t}}}
 * ```
 *
 * ## Examples
 *
 * Consider a potential project with an initial investment of $40 000 and
 * projected cashflows of $5 000, $8 000, $12 000 and $30 000 at the end of
 * each period discounted at a rate of 8% per period. To find the project's
 * net present value:
 *
 * ```javascript
 * import {npv} from 'financial'
 *
 * const rate = 0.08
 * const cashflows = [-40_000, 5000, 8000, 12000, 30000]
 * npv(rate, cashflows) // 3065.2226681795255
 * ```
 *
 * It may be preferable to split the projected cashflow into an initial
 * investment and expected future cashflows. In this case, the value of
 * the initial cashflow is zero and the initial investment is later added
 * to the future cashflows net present value:
 *
 * ```javascript
 * const initialCashflow = cashflows[0]
 * cashflows[0] = 0
 *
 * npv(rate, cashflows) + initialCashflow // 3065.2226681795255
 * ```
 *
 * ## References
 *
 * L. J. Gitman, "Principles of Managerial Finance, Brief,"
 * 3rd ed., Addison-Wesley, 2003, pg. 346.
 */
export declare function npv(rate: number, values: number[]): number;
/**
 * Calculates the Modified Internal Rate of Return.
 *
 * @param values - Cash flows (must contain at least one positive and one negative
 *   value) or nan is returned.  The first value is considered a sunk
 *   cost at time zero.
 * @param financeRate - Interest rate paid on the cash flows
 * @param reinvestRate - Interest rate received on the cash flows upon reinvestment
 *
 * @returns Modified internal rate of return
 *
 * @since v0.1.0
 */
export declare function mirr(values: number[], financeRate: number, reinvestRate: number): number;
