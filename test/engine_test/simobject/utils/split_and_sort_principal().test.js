import { splitAndSortFinancialSchedule } from '../../../../src/engine/simobject/utils/split_and_sort_financialschedule.js';
import { bigIntToNumberWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_number_with_decimals.js';
import { bigIntToStringWithDecimals } from '../../../../src/engine/simobject/utils/bigint_to_string_with_decimals.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

const decimalPlaces = 4;
const roundingModeIsRound = true;

t('splitAndSortFinancialSchedule() tests #0, THROWS if split with Indefinite less than value & no schedule', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 6;
  /** @type {*[]} */
  const _financialSchedule__scheduledAmounts = [];
  /** @type {*[]} */
  const _financialSchedule__scheduledDates = [];

  assert.throws(() => splitAndSortFinancialSchedule({
    value,
    financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
    financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
    financialSchedule__scheduledDates: _financialSchedule__scheduledDates
  }, {
    decimalPlaces,
    roundingModeIsRound
  }));
});

t('splitAndSortFinancialSchedule() tests #1, split with Indefinite + Schedule & some zero entries & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 10;
  const _financialSchedule__scheduledAmounts = [690, 0, 100, 100, 0, 100, 0];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-06'), new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-07')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = 10_0000n;
  const expected_financialSchedule__scheduledAmounts = [0n, 100_0000n, 100_0000n, 0n, 100_0000n, 690_0000n, 0n];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } =
    splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates,
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #1bis, NEGATIVE & DUPLICATE DATES & split with Indefinite + Schedule & some zero entries & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 10;
  const _financialSchedule__scheduledAmounts = [690, -200, 0, 400, 0, 100, 0];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-06'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-07')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = 10_0000n;
  const expected_financialSchedule__scheduledAmounts = [-200_0000n, 0n, 400_0000n, 0n, 100_0000n, 690_0000n, 0n];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } =
    splitAndSortFinancialSchedule({
        value,
        financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
        financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
        financialSchedule__scheduledDates: _financialSchedule__scheduledDates,
      }, {
        decimalPlaces,
        roundingModeIsRound
      }
    );

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #2, split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 6;
  const _financialSchedule__scheduledAmounts = [100, 100, 100];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = 6_0000n;
  const expected_financialSchedule__scheduledAmounts = [331_3333n, 331_3333n, 331_3334n];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #2bis, NEGATIVE & split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 6;
  const _financialSchedule__scheduledAmounts = [100, -100, 300];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = 6_0000n;
  const expected_financialSchedule__scheduledAmounts = [-331_3333n, 994_0000n, 331_3333n];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #2ter, ALL NEGATIVE VALUE & split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = -1000;
  const _financialSchedule__amountWithoutScheduledDate = -6;
  const _financialSchedule__scheduledAmounts = [-100, -100, -100];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = -6_0000n;
  const expected_financialSchedule__scheduledAmounts = [-331_3333n, -331_3333n, -331_3334n];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #3, split with Indefinite + Schedule testing conversion to number', async () => {
  const value = 999;
  const _financialSchedule__amountWithoutScheduledDate = 10;
  const _financialSchedule__scheduledAmounts = [0, 1, 1, 1, 0, 2];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  // expected values
  const expected_financialSchedule__amountWithoutScheduledDate = 10;
  const expected_financialSchedule__scheduledAmounts = [0, 197.8, 197.8, 197.8, 0, 395.6];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = bigIntToNumberWithDecimals(financialSchedule__amountWithoutScheduledDate, decimalPlaces);
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #4, split with Indefinite + Schedule testing conversion to string', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 0;
  const _financialSchedule__scheduledAmounts = [333, 0, 333, 333];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04')
  ];

  // expected values
  const expected_financialSchedule__amountWithoutScheduledDate = '0.0000';
  const expected_financialSchedule__scheduledAmounts = ['333.3333', '0.0000', '333.3333', '333.3334'];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = bigIntToStringWithDecimals(financialSchedule__amountWithoutScheduledDate, decimalPlaces);
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => bigIntToStringWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #5, split with Indefinite without Schedule', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 1000;
  /** @type {number[]} */
  const _financialSchedule__scheduledAmounts = [];
  /** @type {Date[]} */
  const _financialSchedule__scheduledDates = [];

  // expected values
  const expected_financialSchedule__amountWithoutScheduledDate = 1000;
  /** @type {number[]} */
  const expected_financialSchedule__scheduledAmounts = [];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = bigIntToNumberWithDecimals(financialSchedule__amountWithoutScheduledDate, decimalPlaces);
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});

t('splitAndSortFinancialSchedule() tests #6, split without Indefinite and no Schedule -> all to Indefinite', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 0;
  /** @type {number[]} */
  const _financialSchedule__scheduledAmounts = [];
  /** @type {Date[]} */
  const _financialSchedule__scheduledDates = [];

  // expected values
  const expected_financialSchedule__amountWithoutScheduledDate = 1000;
  /** @type {number[]} */
  const expected_financialSchedule__scheduledAmounts = [];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialSchedule({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    }, {
      decimalPlaces,
      roundingModeIsRound
    }
  );

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = bigIntToNumberWithDecimals(financialSchedule__amountWithoutScheduledDate, decimalPlaces);
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => bigIntToNumberWithDecimals(principal, decimalPlaces));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});
