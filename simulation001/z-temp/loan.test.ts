import { Loan } from "./loan.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("Loan.calculatePeriodicPaymentAmountOfAConstantPaymentLoan #1", () => {
    const ppa: number = Loan.calculatePeriodicPaymentAmountOfAConstantPaymentLoan(0.07, 1, 10, 10_000);
    assertEquals(ppa.toFixed(11), "1423.77502727365");
});

Deno.test("Loan.calculatePeriodicPaymentAmountOfAConstantPaymentLoan #2", () => {
    const ppa: number = Loan.calculatePeriodicPaymentAmountOfAConstantPaymentLoan(0.07, 12, 120, 10_000);
    assertEquals(ppa.toFixed(11), "116.10847921862");
});

Deno.test("Loan.calculateAnnuityOfAConstantPaymentLoan", () => {
    const ppa: number = Loan.calculateAnnuityOfAConstantPaymentLoan(0.07, 10, 10_000);
    assertEquals(ppa.toFixed(11), "1423.77502727365");
});
