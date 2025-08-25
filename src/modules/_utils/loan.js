export { getPrincipalPaymentsOfAConstantPaymentLoan, calculatePeriodicPaymentAmountOfAConstantPaymentLoan, calculateAnnuityOfAConstantPaymentLoan };

import { schema, validate, addMonthsToLocalDate, stripTimeToLocalDate, roundHalfAwayFromZeroWithPrecision, truncWithPrecision } from '../deps.js';
import { RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS } from '../deps.js';
import { Decimal } from '../deps.js';
import { ROUNDING_MODE_IS_HALF_AWAY_FROM_ZERO } from '../../config/engine.js';
import { DECIMAL_PLACES } from '../../config/engine.js';

// info about loans
/*
see https://www.modefinance.com/en/company/blog/is-risk-contemplated-in-the-amortization-plans-you-work-with
see https://docenti-deps.unisi.it/lucaregis/wp-content/uploads/sites/53/2017/02/LR_Financial_Mathematics_18_19-6.pdf

* Fixed (French amortization method) – fixed installment amounts where the payment of overdue interest and capital share vary
* Fixed capital (Italian amortization method) – varying installment amounts where the payment of overdue interest share varies, while the capital share remains fixed
* Bullet amortization method – installments composed only of interest shares, while the final installment is equal to the initial capital amount plus the final interest share
* Balloon amortization method – only part of the capital amount is paid in installments until maturity and the rest in one final macro installment
* Custom amortization method – the installments are composed of capital share chosen one by one from the user

info about interest rates calculation methods: "365/365" | "365/360" | "30/360"  // Actual/365 (aka 365/365), Actual/360 (aka 365/360)
https://www.adventuresincre.com/lenders-calcs/
*/

// home   https://github.com/lmammino/financial  // backup repository   https://github.com/77it/financial
// npm   https://www.npmjs.com/package/financial/
// file index   https://cdn.jsdelivr.net/npm/financial@0.2.4/dist/

// @deno-types="../../../vendor/financial/index.d.ts"
import * as financial from '../../../vendor/financial/financial.esm.js';

/**
 * @param {Object} p
 * @param {number} p.annualInterestRate
 * @param {number} p.yearlyNrOfPayments
 * @param {number} p.totalNrOfPayments
 * @param {number} p.startingPrincipal
 * @return {number}
 */
function calculatePeriodicPaymentAmountOfAConstantPaymentLoan ({
  annualInterestRate,
  yearlyNrOfPayments,
  totalNrOfPayments,
  startingPrincipal
}) {
  // alternative formula, commented out
  // return startingPrincipal * (annualInterestRate / yearlyNrOfPayments) / (1 - Math.pow(1 / (1 + (annualInterestRate / yearlyNrOfPayments)), totalNrOfPayments));
  return -1 * financial.pmt(annualInterestRate / yearlyNrOfPayments, totalNrOfPayments, startingPrincipal, 0, financial.PaymentDueTime.End);
}

/**
 * compute the Annuity (annual sum of Principal And Interests) of a french amortization schedule (a series of constant payments at regular intervals)
 *
 * @param {Object} p
 * @param {number} p.annualInterestRate
 * @param {number} p.nrOfYears
 * @param {number} p.startingPrincipal
 * @return {number}
 */
function calculateAnnuityOfAConstantPaymentLoan ({
  annualInterestRate,
  nrOfYears,
  startingPrincipal
}) {
  // alternative formula, commented out
  //return startingPrincipal * (annualInterestRate + (annualInterestRate / (Math.pow((1 + annualInterestRate), nrOfYears) - 1)));
  return calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
    annualInterestRate: annualInterestRate,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: nrOfYears,
    startingPrincipal: startingPrincipal
  });
}

/**
 * Compute the principal schedule (no interest calculation) of a French amortization plan (a series of constant payments at regular intervals)
 *
 * @param {Object} p
 * @param {Date} p.startDate Start date of the loan, when the principal is disbursed (no payments at this date)
 * @param {Date} p.firstScheduledPaymentDate Start date of the loan, used to calculate the first scheduled payment date; when the starting date is an end of month, next dates are also end of months
 * @param {number} p.startingPrincipal
 * @param {number} p.annualInterestRate
 * @param {number} p.nrOfPaymentsIncludingGracePeriod
 * @param {number} p.numberOfPaymentsInAYear  1 | 2 | 3 | 4 | 6 | 12: 12 for monthly, 6 for bimonthly, ..., 1 for yearly
 * @param {number} [p.gracePeriodNrOfPayments=0] optional, number of payments with interest-only payments
 * @param {number} [p.precision=DECIMAL_PLACES] optional, number of decimals to round the interest and principal payments, default is engine const DECIMAL_PLACES
 * @return {{date: Date[], paymentNo: number[], principalPayment: number[], totalMortgageRemaining: number[]}}
 */
function getPrincipalPaymentsOfAConstantPaymentLoan ({
  startDate,
  firstScheduledPaymentDate,
  startingPrincipal,
  annualInterestRate,
  nrOfPaymentsIncludingGracePeriod,
  numberOfPaymentsInAYear,
  gracePeriodNrOfPayments = 0,
  precision = DECIMAL_PLACES
}) {
  //XXXXX: valutare se inserire la data di inizio finanziamento/erogazione, con capitale zero, e la prima scadenza da cui calcolare interessi;
  //loanStartDate + firstScheduledPaymentDate;


  if (!RELEASE__DISABLE_SANITIZATIONS_VALIDATIONS_AND_CHECKS)
    validate({
      value:
        {
          startDate,
          firstScheduledPaymentDate,
          startingPrincipal,
          annualInterestRate,
          nrOfPaymentsIncludingGracePeriod,
          numberOfPaymentsInAYear,
          gracePeriodNrOfPayments,
          precision
        },
      validation:
        {
          startDate: schema.DATE_TYPE,
          firstScheduledPaymentDate: schema.DATE_TYPE,
          startingPrincipal: schema.NUMBER_TYPE,
          annualInterestRate: schema.NUMBER_TYPE,
          nrOfPaymentsIncludingGracePeriod: schema.NUMBER_TYPE,
          numberOfPaymentsInAYear: [1, 2, 3, 4, 6, 12],
          gracePeriodNrOfPayments: schema.NUMBER_TYPE,
          precision: schema.NUMBER_TYPE
        }
    });

  if (annualInterestRate < 0)
    throw new Error(`Validation error: annual interest rate is ${annualInterestRate}, must be >= 0`);

  if (nrOfPaymentsIncludingGracePeriod <= 0)
    throw new Error(`Validation error: total number of payments including grace period is ${nrOfPaymentsIncludingGracePeriod}, must be > 0`);

  if (gracePeriodNrOfPayments < 0)
    throw new Error(`Validation error: grace period number of payments is ${gracePeriodNrOfPayments}, must be >= 0`);

  if (gracePeriodNrOfPayments >= nrOfPaymentsIncludingGracePeriod)
    throw new Error(`Validation error: grace period payments (${gracePeriodNrOfPayments}) cannot be greater than or equal to total number of payments including grace period (${nrOfPaymentsIncludingGracePeriod})`);

  if (precision < 0 || precision > 20)
    throw new Error(`Validation error: precision is ${precision}, must be between 0 and 20`);

  const numberOfPaymentsWithoutGracePeriod = nrOfPaymentsIncludingGracePeriod - gracePeriodNrOfPayments;

  const _round = ROUNDING_MODE_IS_HALF_AWAY_FROM_ZERO ? roundHalfAwayFromZeroWithPrecision : truncWithPrecision;

  // Calculate the monthly mortgage payment. To get a monthly payment, we divide the interest rate by 12, and so on
  // Multiply by -1, since it default to a negative value
  const mortgagePayment = _round(-1 * financial.pmt(annualInterestRate / numberOfPaymentsInAYear, numberOfPaymentsWithoutGracePeriod, startingPrincipal, 0, financial.PaymentDueTime.End), precision);

  const mortgageArray = {
    /** @type {Date[]} */ date: [],
    /** @type {number[]} */ paymentNo: [],
    // /** @type {number[]} */ interestPayment: [],  // disabled, because the computation of the interest payment is done outside with another function
    /** @type {number[]} */ principalPayment: [],
    /** @type {number[]} */ totalMortgageRemaining: []
  };

  // first payment (payment zero), without payments and full principal remaining
  mortgageArray.date.push(stripTimeToLocalDate(startDate));
  mortgageArray.paymentNo.push(0);
  mortgageArray.principalPayment.push(0);
  mortgageArray.totalMortgageRemaining.push(startingPrincipal);

  let currDate = stripTimeToLocalDate(firstScheduledPaymentDate);

  // Here we loop through each gracePeriodNrOfPayments payment (only interest)
  for (let currPaymentNo = 1; currPaymentNo <= gracePeriodNrOfPayments; currPaymentNo++) {
    // The interest payment portion of the period
    // disabled, because the computation of the interest payment is done outside with another function
    //const interestPayment = _round(-1 * financial.ipmt(annualInterestRate / numberOfPaymentsInAYear, 1, numberOfPaymentsWithoutGracePeriod, startingPrincipal), precision);

    mortgageArray.date.push(currDate);
    mortgageArray.paymentNo.push(currPaymentNo);
    //mortgageArray.interestPayment.push(interestPayment);  // disabled, because the computation of the interest payment is done outside with another function
    mortgageArray.principalPayment.push(0);
    mortgageArray.totalMortgageRemaining.push(startingPrincipal);

    // increment the current date by the number of months in a year divided by the number of payments in a year;
    // is done at the end of the loop, so the first payment date is the same as the first scheduled payment date
    // and if we don't have a grace period, the first payment date is the same as the first scheduled payment date
    currDate = addMonthsToLocalDate(currDate, 12 / numberOfPaymentsInAYear);
  }

  // We use "let" here since the value will change, i.e. we make mortgage payments each month, so our mortgage remaining will decrease
  let mortgageRemaining = new Decimal(startingPrincipal);

  // Here we loop through each payment (starting from 1) and figure out the interest and principal payments
  for (let currPaymentNo = 1; currPaymentNo <= numberOfPaymentsWithoutGracePeriod; currPaymentNo++) {
    // The interest payment portion of that month
    const interestPayment = _round(-1 * financial.ipmt(annualInterestRate / numberOfPaymentsInAYear, currPaymentNo, numberOfPaymentsWithoutGracePeriod, startingPrincipal), precision);

    let principalPayment = _round(mortgagePayment - interestPayment, precision);  // The principal payment portion of that month
    if (currPaymentNo === numberOfPaymentsWithoutGracePeriod)  // if we reached the last payment, the last payment is the residual principal
      principalPayment = mortgageRemaining.toNumber();

    // Calculate the remaining mortgage amount, which you do by subtracting the principal payment
    mortgageRemaining = mortgageRemaining.minus(principalPayment);

    mortgageArray.date.push(currDate);
    mortgageArray.paymentNo.push(currPaymentNo + gracePeriodNrOfPayments);
    // mortgageArray.interestPayment.push(interestPayment);  // disabled, because the computation of the interest payment is done outside with another function
    mortgageArray.principalPayment.push(principalPayment);
    mortgageArray.totalMortgageRemaining.push(mortgageRemaining.toNumber());

    // increment the current date by the number of months in a year divided by the number of payments in a year;
    // is done at the end of the loop, so the first payment date is the same as the first scheduled payment date
    // or the first payment date after the grace period, if any.
    currDate = addMonthsToLocalDate(currDate, 12 / numberOfPaymentsInAYear);
  }

  // coherence test
  if (mortgageRemaining.toNumber() !== 0)
    throw new Error(`Internal error, at the end of the mortgage calculation, residual mortgage must be zero.`);

  return mortgageArray;
}
