import { getMortgagePaymentsOfAConstantPaymentLoan, calculatePeriodicPaymentAmountOfAConstantPaymentLoan, calculateAnnuityOfAConstantPaymentLoan } from '../../src/modules/_utils/loan.js';

// home   https://github.com/lmammino/financial  // backup repository   https://github.com/77it/financial
// npm   https://www.npmjs.com/package/financial/v/0.1.3
// file index   https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/
// @deno-types="https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/financial.d.ts"
import * as financial from 'https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/financial.esm.js';

import {
    assert,
    assertEquals,
    assertFalse,
    assertThrows,
} from '../deps.js';
import { pmt } from 'https://cdn.jsdelivr.net/npm/financial@0.1.3/dist/financial.esm.js';

Deno.test('test my loan code, with comparison with `financial` library', async (t) => {
    await t.step('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #1', async () => {
        const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
            annualInterestRate: 0.07,
            yearlyNrOfPayments: 1,
            totalNrOfPayments: 10,
            startingPrincipal: 10_000
        });
        assertEquals(ppa_myCode.toFixed(11), "1423.77502727365");

        const ppa_financial = financial.pmt(0.07, 10, 10_000, 0, financial.PaymentDueTime.End);
        assertEquals((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
    });

    await t.step('calculatePeriodicPaymentAmountOfAConstantPaymentLoan #2', async () => {
        const ppa_myCode = calculatePeriodicPaymentAmountOfAConstantPaymentLoan({
            annualInterestRate: 0.07,
            yearlyNrOfPayments: 12,
            totalNrOfPayments: 120,
            startingPrincipal: 10_000
        });
        assertEquals(ppa_myCode.toFixed(11), "116.10847921862");

        const ppa_financial = financial.pmt(0.07/12, 120, 10_000, 0, financial.PaymentDueTime.End);
        assertEquals((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
    });

    await t.step('calculateAnnuityOfAConstantPaymentLoan', async () => {
        const ppa_myCode = calculateAnnuityOfAConstantPaymentLoan({
            annualInterestRate: 0.07,
            nrOfYears: 10,
            startingPrincipal: 10_000
        });
        assertEquals(ppa_myCode.toFixed(11), "1423.77502727365");

        const ppa_financial = financial.pmt(0.07, 10, 10_000, 0, financial.PaymentDueTime.End);
        assertEquals((ppa_financial * -1).toFixed(11), ppa_myCode.toFixed(11));
    });
});


Deno.test('test getMortgagePayments', async (t) => {
    await t.step('test #1', async () => {
        console.log(getMortgagePaymentsOfAConstantPaymentLoan({
            startDate: new Date(2022, 11, 25, 0, 0, 0),
            startingPrincipal: 10_000,
            annualInterestRate: 0.07,
            numberOfPaymentsInAYear: 12,
            numberOfPayments: 60
        }));
    });

    await t.step('test #2, principal as Number.MAX_VALUE, MIN_VALUE, MAX_SAFE_INTEGER, MIN_SAFE_INTEGER', async () => {
        console.log(getMortgagePaymentsOfAConstantPaymentLoan({
            startDate: new Date(2022, 11, 25, 0, 0, 0),
            startingPrincipal: Number.MAX_SAFE_INTEGER,
            annualInterestRate: 0.07,
            numberOfPaymentsInAYear: 1,
            numberOfPayments: 4,
            gracePeriod: 1
        }));

        console.log(getMortgagePaymentsOfAConstantPaymentLoan({
            startDate: new Date(2022, 11, 25, 0, 0, 0),
            startingPrincipal: Number.MIN_SAFE_INTEGER,
            annualInterestRate: 0.07,
            numberOfPaymentsInAYear: 1,
            numberOfPayments: 4,
            gracePeriod: 1
        }));
    });

    await t.step('test with interest zero', async () => {
        console.log(getMortgagePaymentsOfAConstantPaymentLoan({
            startDate: new Date(2022, 11, 25, 0, 0, 0),
            startingPrincipal: 10_000,
            annualInterestRate: 0,
            numberOfPaymentsInAYear: 12,
            numberOfPayments: 5
        }));
    });
});
