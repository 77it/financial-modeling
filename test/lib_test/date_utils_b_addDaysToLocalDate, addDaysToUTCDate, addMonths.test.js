// from (with edits) https://github.com/date-fns/date-fns/blob/fadbd4eb7920bf932c25f734f3949027b2fe4887/src/addMonths/test.ts

import { addDaysToLocalDate, addDaysToUTCDate, addMonthsToLocalDate, stripTimeToLocalDate, stripTimeToUTCDate } from '../../src/lib/date_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

//#region addDaysToLocalDate, addDaysToUTCDate
t('addDaysToLocalDate: adds the given number of days', () => {
  const date_20170330 = new Date(1917, 2 /* Mar */, 30, 0, 0, 0);
  const date_20170331 = addDaysToLocalDate(date_20170330, 1);
  const date_20170401 = addDaysToLocalDate(date_20170331, 1);
  const date_20170402 = addDaysToLocalDate(date_20170401, 1);
  const date_20170403 = addDaysToLocalDate(date_20170402, 1);
  assert.deepStrictEqual(date_20170331, new Date(1917, 2 /* Mar */, 31));
  assert.deepStrictEqual(date_20170401, new Date(1917, 3 /* Apr */, 1));
  assert.deepStrictEqual(date_20170402, new Date(1917, 3 /* Apr */, 2));
  assert.deepStrictEqual(date_20170403, new Date(1917, 3 /* Apr */, 3));

  assert.deepStrictEqual(
    addDaysToLocalDate(new Date(2014, 8 /* Sep */, 1), 5),
    new Date(2014, 8 /* Sep */, 6));
  assert.deepStrictEqual(
    addDaysToLocalDate(new Date(2014, 8 /* Sep */, 1), 31),
    new Date(2014, 9 /* Oct */, 2));
  assert.deepStrictEqual(
    addDaysToLocalDate(new Date(2025, 0 /* Sep */, 1), 366),
    new Date(2026, 0 /* Oct */, 2));
});

t('addDaysToLocalDate: test loop from 1900 to 2100 and viceversa', () => {
  const date_19000101 = new Date(1900, 0 /* Jan */, 1);
  const date_21001231 = new Date(2100, 11 /* Dec */, 31);
  let last_date = date_19000101;
  // loop from 1 to 73413 (from 1900-01-01 to 2100-12-31)
  for (let i = 1; i <= 73413; i++) {
    const date = addDaysToLocalDate(date_19000101, i);
    last_date = addDaysToLocalDate(last_date, 1);
    // test that date doesn't contain time
    assert.deepStrictEqual(date.getTime(), stripTimeToLocalDate(date).getTime());
    assert.deepStrictEqual(last_date.getTime(), stripTimeToLocalDate(last_date).getTime());
    // check that date built adding many days to a first date, or a date built one by one, is the same
    assert.deepStrictEqual(last_date.getTime(), date.getTime());
  }
  // check that last date is 2100-12-31
  assert.deepStrictEqual(date_21001231.getTime(), last_date.getTime());

  // loop from 73413 to 1 (from 2100-12-31 to 1900-01-01)
  for (let i = 1; i <= 73413; i++) {
    const date = addDaysToLocalDate(date_21001231, -i);
    last_date = addDaysToLocalDate(last_date, -1);
    // test that date doesn't contain time
    assert.deepStrictEqual(date.getTime(), stripTimeToLocalDate(date).getTime());
    assert.deepStrictEqual(last_date.getTime(), stripTimeToLocalDate(last_date).getTime());
    // check that date built adding many days to a first date, or a date built one by one, is the same
    assert.deepStrictEqual(last_date.getTime(), date.getTime());
  }
  // check that last date is 1900-01-01
  assert.deepStrictEqual(date_19000101.getTime(), last_date.getTime());
});

t('addDaysToUTCDate: adds the given number of days', () => {
  const date_20170330 = new Date(Date.UTC(1917, 2 /* Mar */, 30, 0, 0, 0));
  const date_20170331 = addDaysToUTCDate(date_20170330, 1);
  const date_20170401 = addDaysToUTCDate(date_20170331, 1);
  const date_20170402 = addDaysToUTCDate(date_20170401, 1);
  const date_20170403 = addDaysToUTCDate(date_20170402, 1);
  assert.deepStrictEqual(date_20170331, new Date(Date.UTC(1917, 2 /* Mar */, 31)));
  assert.deepStrictEqual(date_20170401, new Date(Date.UTC(1917, 3 /* Apr */, 1)));
  assert.deepStrictEqual(date_20170402, new Date(Date.UTC(1917, 3 /* Apr */, 2)));
  assert.deepStrictEqual(date_20170403, new Date(Date.UTC(1917, 3 /* Apr */, 3)));

  assert.deepStrictEqual(
    addDaysToUTCDate(new Date(Date.UTC(2014, 8 /* Sep */, 1)), 5),
    new Date(Date.UTC(2014, 8 /* Sep */, 6)));
  assert.deepStrictEqual(
    addDaysToUTCDate(new Date(Date.UTC(2014, 8 /* Sep */, 1)), 31),
    new Date(Date.UTC(2014, 9 /* Oct */, 2)));
  assert.deepStrictEqual(
    addDaysToUTCDate(new Date(Date.UTC(2025, 0 /* Sep */, 1)), 366),
    new Date(Date.UTC(2026, 0 /* Oct */, 2)));
});

t('addDaysToUTCDate: test loop from 1900 to 2100 and viceversa', () => {
  const date_19000101 = new Date(Date.UTC(1900, 0 /* Jan */, 1));
  const date_21001231 = new Date(Date.UTC(2100, 11 /* Dec */, 31));
  let last_date = date_19000101;
  // loop from 1 to 73413 (from 1900-01-01 to 2100-12-31)
  for (let i = 1; i <= 73413; i++) {
    const date = addDaysToUTCDate(date_19000101, i);
    last_date = addDaysToUTCDate(last_date, 1);
    // test that date doesn't contain time
    assert.deepStrictEqual(date.getTime(), stripTimeToUTCDate(date).getTime());
    assert.deepStrictEqual(last_date.getTime(), stripTimeToUTCDate(last_date).getTime());
    // check that date built adding many days to a first date, or a date built one by one, is the same
    assert.deepStrictEqual(last_date.getTime(), date.getTime());
  }
  // check that last date is 2100-12-31
  assert.deepStrictEqual(date_21001231.getTime(), last_date.getTime());

  // loop from 73413 to 1 (from 2100-12-31 to 1900-01-01)
  for (let i = 1; i <= 73413; i++) {
    const date = addDaysToUTCDate(date_21001231, -i);
    last_date = addDaysToUTCDate(last_date, -1);
    // test that date doesn't contain time
    assert.deepStrictEqual(date.getTime(), stripTimeToUTCDate(date).getTime());
    assert.deepStrictEqual(last_date.getTime(), stripTimeToUTCDate(last_date).getTime());
    // check that date built adding many days to a first date, or a date built one by one, is the same
    assert.deepStrictEqual(last_date.getTime(), date.getTime());
  }
  // check that last date is 1900-01-01
  assert.deepStrictEqual(date_19000101.getTime(), last_date.getTime());
});
//#endregion addDaysToLocalDate, addDaysToUTCDate

//#region addMonthsToLocalDate
t('adds the given number of months', () => {
  const result = addMonthsToLocalDate(new Date(2014, 8 /* Sep */, 1), 5);
  assert.deepStrictEqual(result, new Date(2015, 1 /* Feb */, 1));
});

t('does not mutate the original date', () => {
  const date = new Date(2014, 8 /* Sep */, 1);
  addMonthsToLocalDate(date, 12);
  assert.deepStrictEqual(date, new Date(2014, 8 /* Sep */, 1));
});

t('works well also if the desired month has more days than the original date and the provided date is in the last day of a month', () => {
  // Add 4 months to 2015/02/28 => 2015/05/31
  assert.deepStrictEqual(addMonthsToLocalDate(new Date(2015, 1 /* Feb */, 28), 3),
    new Date(2015, 4 /* Maj */, 31));

  // Add 12 months to 2023/02/28 => 2024/02/29  // leap year
  assert.deepStrictEqual(addMonthsToLocalDate(new Date(2023, 1 /* Feb */, 28), 12),
    new Date(2024, 1 /* Feb */, 29));

  // Add 2 months to 2024/02/29 => 2024/04/30  // leap year
  assert.deepStrictEqual(addMonthsToLocalDate(new Date(2024, 1 /* Feb */, 29), 2),
    new Date(2024, 3 /* Apr */, 30));

  // Add 3 months to 2024/02/29 => 2024/05/31  // leap year
  assert.deepStrictEqual(addMonthsToLocalDate(new Date(2024, 1 /* Feb */, 29), 3),
    new Date(2024, 4 /* Maj */, 31));

  // Add 2 months to 2015/02/28 => 2015/04/30
  assert.deepStrictEqual(addMonthsToLocalDate(new Date(2015, 1 /* Feb */, 28), 2),
    new Date(2015, 3 /* Apr */, 30));

  // Add 3 months to 2015/02/28 => 2015/05/31
  assert.deepStrictEqual(addMonthsToLocalDate(new Date(2015, 1 /* Feb */, 28), 3),
    new Date(2015, 4 /* Maj */, 31));
});

t('works well also if the desired month has fewer days and the provided date is in the last day of a month', () => {
  const date = new Date(2014, 11 /* Dec */, 31);
  const result = addMonthsToLocalDate(date, 2);
  assert.deepStrictEqual(result, new Date(2015, 1 /* Feb */, 28));
});

t('[LEAP YEAR / anno bisestile] works well if the desired month has fewer days and the provided date is in the last day of a month', () => {
  const date = new Date(2023, 11 /* Dec */, 31);
  const result = addMonthsToLocalDate(date, 2);
  assert.deepStrictEqual(result, new Date(2024, 1 /* Feb */, 29));
});

t('handles dates before 100 AD', () => {
  const initialDate = new Date(0);
  initialDate.setFullYear(0, 0 /* Jan */, 31);
  initialDate.setHours(0, 0, 0, 0);
  const expectedResult = new Date(0);
  expectedResult.setFullYear(0, 1 /* Feb */, 29);
  expectedResult.setHours(0, 0, 0, 0);
  const result = addMonthsToLocalDate(initialDate, 1);
  assert.deepStrictEqual(result, expectedResult);
});

t('throws if the given date is invalid', () => {
  assert.throws(() => {
    addMonthsToLocalDate(new Date(NaN), 5);
  });
});

t('returns `Invalid Date` if the given amount is NaN', () => {
  const result = addMonthsToLocalDate(new Date(2014, 8 /* Sep */, 1), NaN);
  assert.deepStrictEqual(result, new Date(2014, 8 /* Sep */, 1));
});
//#endregion addMonthsToLocalDate
