// test with   deno --test --allow-import

import { DSB, _TEST_ONLY__set } from '../../src/lib/bigint_decimal_scaled.arithmetic.js';
import { ROUNDING_MODES } from '../../src/config/engine.js';

import {
  getPrincipalPaymentsOfAConstantPaymentLoan,
  calculatePeriodicPaymentAmountOfAConstantPaymentLoanDSB,
  calculateAnnuityOfAConstantPaymentLoanDSB,
} from '../../src/modules/_utils/loan.js';

// @deno-types="../../vendor/financial/index.d.ts"
import * as financial from '../../vendor/financial/financial.esm.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

_TEST_ONLY__set({decimalScale: 11, accountingDecimalPlaces: 4, roundingMode: ROUNDING_MODES.HALF_EVEN})

//#region test my loan code, with comparison with `financial` library
t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #0 zero interest, annual, 10 installments', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoanDSB({
    annualInterestRate: 0,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: 10,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(DSB.toString(ppa_myCode), '1000');

  const ppa_financial = financial.pmt(0, 10, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), Number(DSB.toString(ppa_myCode)).toFixed(11));
});

t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #0b zero interest, monthly, 12 installments', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoanDSB({
    annualInterestRate: 0,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: 12,
    startingPrincipal: 12_000
  });
  assert.deepStrictEqual(DSB.toString(ppa_myCode), '1000');

  const ppa_financial = financial.pmt(0, 12, 12_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), Number(DSB.toString(ppa_myCode)).toFixed(11));
});

t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #1', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoanDSB({
    annualInterestRate: 0.07,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: 10,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(DSB.toString(ppa_myCode), '1423.77502727365');

  const ppa_financial = financial.pmt(0.07, 10, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), Number(DSB.toString(ppa_myCode)).toFixed(11));
});

t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #2', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoanDSB({
    annualInterestRate: 0.07,
    yearlyNrOfPayments: 12,
    totalNrOfPayments: 120,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(DSB.toString(ppa_myCode), '116.10847921862');

  const ppa_financial = financial.pmt(0.07 / 12, 120, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), Number(DSB.toString(ppa_myCode)).toFixed(11));
});

t('calculateAnnuityOfAConstantPaymentLoanDSB', async () => {
  const ppa_myCode = calculateAnnuityOfAConstantPaymentLoanDSB({
    annualInterestRate: 0.07,
    nrOfYears: 10,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(DSB.toString(ppa_myCode), '1423.77502727365');

  const ppa_financial = financial.pmt(0.07, 10, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), Number(DSB.toString(ppa_myCode)).toFixed(11));
});
//#endregion test my loan code, with comparison with `financial` library

//#region test getMortgagePayments
t('test #1', async () => {
  console.log(getPrincipalPaymentsOfAConstantPaymentLoan({
    startDate: new Date(2022, 11, 25, 0, 0, 0),
    firstScheduledPaymentDate: new Date(2023, 0, 25, 0, 0, 0),
    startingPrincipal: 10_000,
    annualInterestRate: 0.07,
    numberOfPaymentsInAYear: 12,
    nrOfPaymentsIncludingGracePeriod: 60,
  }));
});

t('test #2, principal as Number.MAX_VALUE, MIN_VALUE, MAX_SAFE_INTEGER, MIN_SAFE_INTEGER', async () => {
  console.log(getPrincipalPaymentsOfAConstantPaymentLoan({
    startDate: new Date(2022, 11, 25, 0, 0, 0),
    firstScheduledPaymentDate: new Date(2023, 0, 25, 0, 0, 0),
    startingPrincipal: Number.MAX_SAFE_INTEGER,
    annualInterestRate: 0.07,
    numberOfPaymentsInAYear: 1,
    nrOfPaymentsIncludingGracePeriod: 4,
    gracePeriodNrOfPayments: 1
  }));

  console.log(getPrincipalPaymentsOfAConstantPaymentLoan({
    startDate: new Date(2022, 11, 25, 0, 0, 0),
    firstScheduledPaymentDate: new Date(2023, 0, 25, 0, 0, 0),
    startingPrincipal: Number.MIN_SAFE_INTEGER,
    annualInterestRate: 0.07,
    numberOfPaymentsInAYear: 1,
    nrOfPaymentsIncludingGracePeriod: 4,
    gracePeriodNrOfPayments: 1
  }));
});

t('test with interest zero', async () => {
  console.log(getPrincipalPaymentsOfAConstantPaymentLoan({
    startDate: new Date(2022, 11, 25, 0, 0, 0),
    firstScheduledPaymentDate: new Date(2023, 0, 25, 0, 0, 0),
    startingPrincipal: 10_000,
    annualInterestRate: 0,
    numberOfPaymentsInAYear: 12,
    nrOfPaymentsIncludingGracePeriod: 5
  }));
});
//#endregion test getMortgagePayments

//#region utility functions for testing
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

//#endregion utility functions for testing