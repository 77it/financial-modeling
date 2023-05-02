import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../../deps.js';

import { splitPrincipal, bigIntToNumberWithDecimals, bigIntToStringWithDecimals } from '../../../src/engine/simobject/utils/simobject_utils.js';

const decimalPlaces = 4;
const roundingModeIsRound = true;

Deno.test('splitPrincipal() tests #1, split with Indefinite + Schedule', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 10;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [100, 100, 100, 690];
  const decimalPlaces = 4;
  const roundingModeIsRound = true;

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule } = splitPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  const expectedPrincipalIndefiniteExpiryDate = 10_0000n;
  const expectedPrincipalAmortizationSchedule = [100_0000n, 100_0000n, 100_0000n, 690_0000n];

  assertEquals(principalIndefiniteExpiryDate, expectedPrincipalIndefiniteExpiryDate);
  assertEquals(principalAmortizationSchedule, expectedPrincipalAmortizationSchedule);
});

Deno.test('splitPrincipal() tests #2, split with Indefinite + Schedule testing conversion to number', async () => {
  const value = 999;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 10;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [1, 1, 1, 2];
  const decimalPlaces = 4;
  const roundingModeIsRound = true;

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule } = splitPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToNumberWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = 10;
  const expectedPrincipalAmortizationSchedule = [197.8, 197.8, 197.8, 395.6];

  // assert
  assertEquals(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assertEquals(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
});

Deno.test('splitPrincipal() tests #3, split with Indefinite + Schedule testing conversion to string', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 0;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [333, 333, 333];
  const decimalPlaces = 4;
  const roundingModeIsRound = true;

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule } = splitPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToStringWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToStringWithDecimals(principal, decimalPlaces));

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = '0.0000';
  const expectedPrincipalAmortizationSchedule = ['333.3333', '333.3333', '333.3334'];

  // assert
  assertEquals(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assertEquals(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
});

Deno.test('splitPrincipal() tests #4, split with Indefinite without Schedule', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 1000;
  /** @type {number[]} */
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [];
  const decimalPlaces = 4;
  const roundingModeIsRound = true;

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule } = splitPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToNumberWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = 1000;
  /** @type {number[]} */
  const expectedPrincipalAmortizationSchedule = [];

  // assert
  assertEquals(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assertEquals(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
});

Deno.test('splitPrincipal() tests #5, split without Indefinite and no Schedule', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 0;
  /** @type {number[]} */
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [];
  const decimalPlaces = 4;
  const roundingModeIsRound = true;

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule } = splitPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToNumberWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = 1000;
  /** @type {number[]} */
  const expectedPrincipalAmortizationSchedule = [];

  // assert
  assertEquals(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assertEquals(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
});
