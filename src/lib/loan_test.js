import { getMonthlyMortgagePayments, calculatePeriodicPaymentAmountOfAConstantPaymentLoan, calculateAnnuityOfAConstantPaymentLoan } from "./loan.js";
import { financial } from '../deps.js';

import {
    assert,
    assertEquals,
    assertFalse,
    assertThrows,
} from 'https://deno.land/std/testing/asserts.ts';
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
        console.log(getMonthlyMortgagePayments({
            mortgage: 10_000,
            monthlyInterestRate: 0.07 / 12,
            numberPayments: 60
        }));
    });
});
