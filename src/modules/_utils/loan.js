export { getMortgagePaymentsOfAConstantPaymentLoan, calculatePeriodicPaymentAmountOfAConstantPaymentLoan, calculateAnnuityOfAConstantPaymentLoan };

import { schema } from '../deps.js';
import { validate } from '../deps.js';
import { addMonthsToLocalDate } from '../deps.js';

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
  //return startingPrincipal * (annualInterestRate + (annualInterestRate / (Math.pow((1 + annualInterestRate), nrOfYears) - 1)));
  return calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
    annualInterestRate: annualInterestRate,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: nrOfYears,
    startingPrincipal: startingPrincipal
  });
}


/**
 * Compute the full schedule of a French amortization schedule (a series of constant payments at regular intervals)
 *
 * @param {Object} p
 * @param {Date} p.startDate
 * @param {number} p.startingPrincipal
 * @param {number} p.annualInterestRate
 * @param {number} p.numberOfPayments
 * @param {number} p.numberOfPaymentsInAYear  12 for monthly, 6 for bimonthly, ..., 1 for yearly
 * @param {number} [p.gracePeriod=0] optional, number of periods with interest-only payments
 * @return {{date: Date, paymentNo: number, interestPayment: number, principalPayment: number, totalMortgageRemaining: number}[]}
 */
function getMortgagePaymentsOfAConstantPaymentLoan ({ startDate, startingPrincipal, annualInterestRate, numberOfPayments , numberOfPaymentsInAYear, gracePeriod=0}) {
  validate(
    { value:
        {
          startDate,
          startingPrincipal,
          annualInterestRate,
          numberOfPayments,
          numberOfPaymentsInAYear,
          gracePeriod
        },
      validation:
        {
          startDate: schema.DATE_TYPE,
          startingPrincipal: schema.NUMBER_TYPE,
          annualInterestRate: schema.NUMBER_TYPE,
          numberOfPayments: schema.NUMBER_TYPE,
          numberOfPaymentsInAYear: schema.NUMBER_TYPE,
          gracePeriod: schema.NUMBER_TYPE
        }
    });

  const numberOfPaymentsWithoutGracePeriod = numberOfPayments - gracePeriod;
  if (!(numberOfPaymentsWithoutGracePeriod > 0))
    throw new Error(`Validation error: number of payments without grace period is ${numberOfPaymentsWithoutGracePeriod}, must be > 0`);

  if (!((numberOfPaymentsInAYear > 0) && (numberOfPaymentsInAYear <= 12) && (12 % numberOfPaymentsInAYear === 0)))
    throw new Error(`Validation error: number of payments in a year is ${numberOfPaymentsInAYear}, must be > 0, < 12 and a number between 1|2|3|4|6|12`);

  let currDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);  // clone startDate removing time

  // Calculate the monthly mortgage payment. To get a monthly payment, we divide the interest rate by 12
  // Multiply by -1, since it default to a negative value
  const mortgagePayment = -1 * financial.pmt(annualInterestRate / numberOfPaymentsInAYear, numberOfPaymentsWithoutGracePeriod, startingPrincipal, 0, financial.PaymentDueTime.End);

  const mortgageArray = [];

  // first payment, without payments and full principal
  mortgageArray.push({
    date: currDate,
    paymentNo: 0,
    interestPayment: 0,
    principalPayment: 0,
    totalMortgageRemaining: startingPrincipal
  });

  // Here we loop through each gracePeriod payment (only interest)
  for (let currPaymentNo = 1; currPaymentNo <= gracePeriod; currPaymentNo++) {
    // The interest payment portion of the period
    const interestPayment = startingPrincipal * annualInterestRate / numberOfPaymentsInAYear;

    currDate = addMonthsToLocalDate(currDate, 12 / numberOfPaymentsInAYear);

    mortgageArray.push({
      date: currDate,
      paymentNo: currPaymentNo,
      interestPayment: interestPayment,
      principalPayment: 0,
      totalMortgageRemaining: startingPrincipal
    });
  }

  // We use "let" here since the value will change, i.e. we make mortgage payments each month, so our total
  let mortgageRemaining = startingPrincipal;

  // Here we loop through each payment (starting from 1) and figure out the interest and principal payments
  for (let currPaymentNo = 1; currPaymentNo <= numberOfPaymentsWithoutGracePeriod; currPaymentNo++) {
    // The interest payment portion of that month
    const interestPayment = -1 * financial.ipmt(annualInterestRate / numberOfPaymentsInAYear, currPaymentNo, numberOfPaymentsWithoutGracePeriod, startingPrincipal);

    let principalPayment = mortgagePayment - interestPayment;
    if (currPaymentNo === numberOfPaymentsWithoutGracePeriod)  // if we reached the last payment, the last payment is the residual principal
      principalPayment = mortgageRemaining;

    // Calculate the remaining mortgage amount, which you do by subtracting the principal payment
    mortgageRemaining = mortgageRemaining - principalPayment;

    currDate = addMonthsToLocalDate(currDate, 12 / numberOfPaymentsInAYear);

    mortgageArray.push({
      date: currDate,
      paymentNo: currPaymentNo + gracePeriod,
      interestPayment: interestPayment,
      principalPayment: principalPayment,
      totalMortgageRemaining: mortgageRemaining
    });
  }

  // coherence test
  if (mortgageRemaining !== 0)
    throw new Error(`Internal error, at the end of the mortgage calculation, residual mortgage must be zero.`);

  return mortgageArray;
}
