import { SplitAndSortPrincipal } from '../../../../src/engine/simobject/utils/split_and_sort_principal.js';
import { bigIntToNumberWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_number_with_decimals.js';
import { bigIntToStringWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_string_with_decimals.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const decimalPlaces = 4;
const roundingModeIsRound = true;

t('SplitAndSortPrincipal() tests #1, split with Indefinite + Schedule & some zero entries & reorder', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 10;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [690, 0, 100, 100, 0, 100, 0];
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [
    new Date('2021-01-06'), new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-07')
  ];

  const expectedPrincipalIndefiniteExpiryDate = 10_0000n;
  const expectedPrincipalAmortizationSchedule = [0n, 100_0000n, 100_0000n, 0n, 100_0000n, 690_0000n, 0n];
  const expectedPrincipalAmortizationDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } =
    SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date,
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(principalIndefiniteExpiryDate, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationSchedule, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, expectedPrincipalAmortizationDates);
});

t('SplitAndSortPrincipal() tests #1bis, NEGATIVE & DUPLICATE DATES & split with Indefinite + Schedule & some zero entries & reorder', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 10;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [690, -200, 0, 400, 0, 100, 0];
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [
    new Date('2021-01-06'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-07')
  ];

  const expectedPrincipalIndefiniteExpiryDate = 10_0000n;
  const expectedPrincipalAmortizationSchedule = [-200_0000n, 0n, 400_0000n, 0n, 100_0000n, 690_0000n, 0n];
  const expectedPrincipalAmortizationDates = [
    new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } =
    SplitAndSortPrincipal({
        value,
        bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
        bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
        bs_Principal__PrincipalToPay_AmortizationSchedule__Date,
      }, {
        decimalPlaces,
        roundingModeIsRound
      }
    );

  assert.deepStrictEqual(principalIndefiniteExpiryDate, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationSchedule, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, expectedPrincipalAmortizationDates);
});

t('SplitAndSortPrincipal() tests #2, split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 6;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [100, 100, 100];
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expectedPrincipalIndefiniteExpiryDate = 6_0000n;
  const expectedPrincipalAmortizationSchedule = [331_3333n, 331_3333n, 331_3334n];
  const expectedPrincipalAmortizationDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } = SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(principalIndefiniteExpiryDate, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationSchedule, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, expectedPrincipalAmortizationDates);
});

t('SplitAndSortPrincipal() tests #2bis, NEGATIVE & split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 6;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [100, -100, 300];
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expectedPrincipalIndefiniteExpiryDate = 6_0000n;
  const expectedPrincipalAmortizationSchedule = [-331_3333n, 994_0000n, 331_3333n];
  const expectedPrincipalAmortizationDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } = SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(principalIndefiniteExpiryDate, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationSchedule, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, expectedPrincipalAmortizationDates);
});

t('SplitAndSortPrincipal() tests #2ter, ALL NEGATIVE VALUE & split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = -1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = -6;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [-100, -100, -100];
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expectedPrincipalIndefiniteExpiryDate = -6_0000n;
  const expectedPrincipalAmortizationSchedule = [-331_3333n, -331_3333n, -331_3334n];
  const expectedPrincipalAmortizationDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } = SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(principalIndefiniteExpiryDate, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationSchedule, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, expectedPrincipalAmortizationDates);
});

t('SplitAndSortPrincipal() tests #3, split with Indefinite + Schedule testing conversion to number', async () => {
  const value = 999;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 10;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [0, 1, 1, 1, 0, 2];
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = 10;
  const expectedPrincipalAmortizationSchedule = [0, 197.8, 197.8, 197.8, 0, 395.6];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } = SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToNumberWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, bs_Principal__PrincipalToPay_AmortizationSchedule__Date);
});

t('SplitAndSortPrincipal() tests #4, split with Indefinite + Schedule testing conversion to string', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 0;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [333, 0, 333, 333];
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04')
  ];

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = '0.0000';
  const expectedPrincipalAmortizationSchedule = ['333.3333', '0.0000', '333.3333', '333.3334'];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } = SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToStringWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToStringWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, bs_Principal__PrincipalToPay_AmortizationSchedule__Date);
});

t('SplitAndSortPrincipal() tests #5, split with Indefinite without Schedule', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 1000;
  /** @type {number[]} */
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [];
  /** @type {Date[]} */
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [];

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = 1000;
  /** @type {number[]} */
  const expectedPrincipalAmortizationSchedule = [];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } = SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToNumberWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, bs_Principal__PrincipalToPay_AmortizationSchedule__Date);
});

t('SplitAndSortPrincipal() tests #6, split without Indefinite and no Schedule -> all to Indefinite', async () => {
  const value = 1000;
  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = 0;
  /** @type {number[]} */
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = [];
  /** @type {Date[]} */
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = [];

  // expected values
  const expectedPrincipalIndefiniteExpiryDate = 1000;
  /** @type {number[]} */
  const expectedPrincipalAmortizationSchedule = [];

  const { principalIndefiniteExpiryDate, principalAmortizationSchedule, principalAmortizationDates } = SplitAndSortPrincipal({
      value,
      bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
      bs_Principal__PrincipalToPay_AmortizationSchedule__Date
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const principalIndefiniteExpiryDateNumber = bigIntToNumberWithDecimals(principalIndefiniteExpiryDate, decimalPlaces);
  const principalAmortizationScheduleNumber = principalAmortizationSchedule.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(principalIndefiniteExpiryDateNumber, expectedPrincipalIndefiniteExpiryDate);
  assert.deepStrictEqual(principalAmortizationScheduleNumber, expectedPrincipalAmortizationSchedule);
  assert.deepStrictEqual(principalAmortizationDates, bs_Principal__PrincipalToPay_AmortizationSchedule__Date);
});
