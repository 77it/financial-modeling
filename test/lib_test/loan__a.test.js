// test with   deno --test --allow-import

import { getPrincipalPaymentsOfAConstantPaymentLoan, calculatePeriodicPaymentAmountOfAConstantPaymentLoan, calculateAnnuityOfAConstantPaymentLoan } from '../../src/modules/_utils/loan.js';

// @deno-types="../../vendor/financial/index.d.ts"
import * as financial from '../../vendor/financial/financial.esm.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

//#region test my loan code, with comparison with `financial` library
t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #0 zero interest, annual, 10 installments', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
    annualInterestRate: 0,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: 10,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(ppa_myCode.toFixed(11), '1000.00000000000');

  const ppa_financial = financial.pmt(0, 10, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
});

t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #0b zero interest, monthly, 12 installments', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
    annualInterestRate: 0,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: 12,
    startingPrincipal: 12_000
  });
  assert.deepStrictEqual(ppa_myCode.toFixed(11), '1000.00000000000');

  const ppa_financial = financial.pmt(0, 12, 12_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
});

t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #1', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
    annualInterestRate: 0.07,
    yearlyNrOfPayments: 1,
    totalNrOfPayments: 10,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(ppa_myCode.toFixed(11), '1423.77502727365');

  const ppa_financial = financial.pmt(0.07, 10, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
});

t('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #2', async () => {
  const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
    annualInterestRate: 0.07,
    yearlyNrOfPayments: 12,
    totalNrOfPayments: 120,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(ppa_myCode.toFixed(11), '116.10847921862');

  const ppa_financial = financial.pmt(0.07 / 12, 120, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
});

t('calculateAnnuityOfAConstantPaymentLoan', async () => {
  const ppa_myCode = calculateAnnuityOfAConstantPaymentLoan({
    annualInterestRate: 0.07,
    nrOfYears: 10,
    startingPrincipal: 10_000
  });
  assert.deepStrictEqual(ppa_myCode.toFixed(11), '1423.77502727365');

  const ppa_financial = financial.pmt(0.07, 10, 10_000, 0, financial.PaymentDueTime.End);
  assert.deepStrictEqual((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
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
