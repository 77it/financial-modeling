import { splitAndSortFinancialScheduleDSB } from '../../../../src/engine/simobject/utils/split_and_sort_financialschedule_dsb.js';
import { bigIntScaledToString, ensureBigIntScaled } from '../../../../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('splitAndSortFinancialScheduleDSB() tests #0, THROWS if split with Indefinite less than value & no schedule', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 6;
  /** @type {*[]} */
  const _financialSchedule__scheduledAmounts = [];
  /** @type {*[]} */
  const _financialSchedule__scheduledDates = [];

  assert.throws(() => splitAndSortFinancialScheduleDSB({
    value,
    financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
    financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
    financialSchedule__scheduledDates: _financialSchedule__scheduledDates
  }));
});

t('splitAndSortFinancialScheduleDSB() tests #1, split with Indefinite + Schedule & some zero entries & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 10;
  const _financialSchedule__scheduledAmounts = [690, 0, 100, 100, 0, 100, 0];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-06'), new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-07')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = ensureBigIntScaled(10);
  const expected_financialSchedule__scheduledAmounts = [
    ensureBigIntScaled(0),
    ensureBigIntScaled(100),
    ensureBigIntScaled(100),
    ensureBigIntScaled(0),
    ensureBigIntScaled(100),
    ensureBigIntScaled(690),
    ensureBigIntScaled(0)
  ];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } =
    splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates,
    });

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #1bis, NEGATIVE & DUPLICATE DATES & split with Indefinite + Schedule & some zero entries & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 10;
  const _financialSchedule__scheduledAmounts = [690, -200, 0, 400, 0, 100, 0];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-06'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-07')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = ensureBigIntScaled(10);
  const expected_financialSchedule__scheduledAmounts = [
    ensureBigIntScaled(-200),
    ensureBigIntScaled(0),
    ensureBigIntScaled(400),
    ensureBigIntScaled(0),
    ensureBigIntScaled(100),
    ensureBigIntScaled(690),
    ensureBigIntScaled(0)
  ];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-01'), new Date('2021-01-04'),
    new Date('2021-01-05'), new Date('2021-01-06'), new Date('2021-01-07')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } =
    splitAndSortFinancialScheduleDSB({
        value,
        financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
        financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
        financialSchedule__scheduledDates: _financialSchedule__scheduledDates,
      });

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #2, split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 6;
  const _financialSchedule__scheduledAmounts = [100, 100, 100];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = ensureBigIntScaled(6);
  const expected_financialSchedule__scheduledAmounts = [
    ensureBigIntScaled(331.3333333333),
    ensureBigIntScaled(331.3333333333),
    ensureBigIntScaled(331.3333333334),
  ];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    });

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #2bis, NEGATIVE & split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 6;
  const _financialSchedule__scheduledAmounts = [100, -100, 300];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = ensureBigIntScaled(6);
  const expected_financialSchedule__scheduledAmounts = [
    ensureBigIntScaled(-331.3333333333),
    ensureBigIntScaled(994),
    ensureBigIntScaled(331.3333333333)
  ];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    });

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #2ter, ALL NEGATIVE VALUE & split with Indefinite + Incomplete Schedule (Schedule + Indefinite < Principal) & reorder', async () => {
  const value = -1000;
  const _financialSchedule__amountWithoutScheduledDate = -6;
  const _financialSchedule__scheduledAmounts = [-100, -100, -100];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-03'), new Date('2021-01-01'), new Date('2021-01-02')
  ];

  const expected_financialSchedule__amountWithoutScheduledDate = ensureBigIntScaled(-6);
  const expected_financialSchedule__scheduledAmounts = [
    ensureBigIntScaled(-331.3333333333),
    ensureBigIntScaled(-331.3333333333),
    ensureBigIntScaled(-331.3333333334),
  ];
  const expected_financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03')
  ];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    });

  assert.deepStrictEqual(financialSchedule__amountWithoutScheduledDate, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(financialSchedule__scheduledAmounts, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, expected_financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #3, split with Indefinite + Schedule testing conversion to number', async () => {
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

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    });

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = Number(bigIntScaledToString(financialSchedule__amountWithoutScheduledDate));
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => Number(bigIntScaledToString(principal)));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #4, split with Indefinite + Schedule testing conversion to string', async () => {
  const value = 1000;
  const _financialSchedule__amountWithoutScheduledDate = 0;
  const _financialSchedule__scheduledAmounts = [333, 0, 333, 333];
  const _financialSchedule__scheduledDates = [
    new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04')
  ];

  // expected values
  const expected_financialSchedule__amountWithoutScheduledDate = '0';
  const expected_financialSchedule__scheduledAmounts = ['333.3333333333', '0', '333.3333333333', '333.3333333334'];

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    });

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = bigIntScaledToString(financialSchedule__amountWithoutScheduledDate);
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => bigIntScaledToString(principal));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #5, split with Indefinite without Schedule', async () => {
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

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    });

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = Number(bigIntScaledToString(financialSchedule__amountWithoutScheduledDate));
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => Number(bigIntScaledToString(principal)));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});

t('splitAndSortFinancialScheduleDSB() tests #6, split without Indefinite and no Schedule -> all to Indefinite', async () => {
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

  const { financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates } = splitAndSortFinancialScheduleDSB({
      value,
      financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
      financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
      financialSchedule__scheduledDates: _financialSchedule__scheduledDates
    });

  // convert BigInt to Number
  const _financialSchedule__amountWithoutScheduledDateNumber = Number(bigIntScaledToString(financialSchedule__amountWithoutScheduledDate));
  const _financialSchedule__scheduledAmountsNumber = financialSchedule__scheduledAmounts.map((principal) => Number(bigIntScaledToString(principal)));

  // assert
  assert.deepStrictEqual(_financialSchedule__amountWithoutScheduledDateNumber, expected_financialSchedule__amountWithoutScheduledDate);
  assert.deepStrictEqual(_financialSchedule__scheduledAmountsNumber, expected_financialSchedule__scheduledAmounts);
  assert.deepStrictEqual(financialSchedule__scheduledDates, financialSchedule__scheduledDates);
});
