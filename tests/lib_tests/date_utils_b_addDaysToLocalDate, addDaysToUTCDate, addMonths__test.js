// from (with edits) https://github.com/date-fns/date-fns/blob/fadbd4eb7920bf932c25f734f3949027b2fe4887/src/addMonths/test.ts

import { addDaysToLocalDate, addDaysToUTCDate, addMonths, stripTimeToLocalDate, stripTimeToUTCDate } from '../../src/lib/date_utils.js';

import { assert as assertDeno, assertEquals, assertFalse, assertStrictEquals, assertThrows } from '../deps.js';
import { describe, it } from 'https://deno.land/std@0.139.0/testing/bdd.ts';

/**
 * @param {*} p
 */
function assert (p) {
  return assertDeno(p);
}

assert.equal = assertEquals;
assert.strictEqual = assertStrictEquals;
assert.throws = assertThrows;
const _describe = describe;  // replaced `describe` with `_describe` to prevent highlight of this file from Webstorm

_describe('addDaysToLocalDate, addDaysToUTCDate', () => {
  it('addDaysToLocalDate: adds the given number of days', () => {
    const date_20170330 = new Date(1917, 2 /* Mar */, 30, 0, 0, 0);
    const date_20170331 = addDaysToLocalDate(date_20170330, 1);
    const date_20170401 = addDaysToLocalDate(date_20170331, 1);
    const date_20170402 = addDaysToLocalDate(date_20170401, 1);
    const date_20170403 = addDaysToLocalDate(date_20170402, 1);
    assert.equal(date_20170331, new Date(1917, 2 /* Mar */, 31));
    assert.equal(date_20170401, new Date(1917, 3 /* Apr */, 1));
    assert.equal(date_20170402, new Date(1917, 3 /* Apr */, 2));
    assert.equal(date_20170403, new Date(1917, 3 /* Apr */, 3));

    assert.equal(
      addDaysToLocalDate(new Date(2014, 8 /* Sep */, 1), 5),
      new Date(2014, 8 /* Sep */, 6));
    assert.equal(
      addDaysToLocalDate(new Date(2014, 8 /* Sep */, 1), 31),
      new Date(2014, 9 /* Oct */, 2));
    assert.equal(
      addDaysToLocalDate(new Date(2025, 0 /* Sep */, 1), 366),
      new Date(2026, 0 /* Oct */, 2));
  });

  it('addDaysToLocalDate: test loop from 1900 to 2100 and viceversa', () => {
    const date_19000101 = new Date(1900, 0 /* Jan */, 1);
    const date_21001231 = new Date(2100, 11 /* Dec */, 31);
    let last_date = date_19000101;
    // loop from 1 to 73413 (from 1900-01-01 to 2100-12-31)
    for (let i = 1; i <= 73413; i++) {
      const date = addDaysToLocalDate(date_19000101, i);
      last_date = addDaysToLocalDate(last_date, 1);
      // test that date doesn't contain time
      assert.equal(date.getTime(), stripTimeToLocalDate(date).getTime());
      assert.equal(last_date.getTime(), stripTimeToLocalDate(last_date).getTime());
      // check that date built adding many days to a first date, or a date built one by one, is the same
      assert.equal(last_date.getTime(), date.getTime());
    }
    // check that last date is 2100-12-31
    assert.equal(date_21001231.getTime(), last_date.getTime())

    // loop from 73413 to 1 (from 2100-12-31 to 1900-01-01)
    for (let i = 1; i <= 73413; i++) {
      const date = addDaysToLocalDate(date_21001231, -i);
      last_date = addDaysToLocalDate(last_date, -1);
      // test that date doesn't contain time
      assert.equal(date.getTime(), stripTimeToLocalDate(date).getTime());
      assert.equal(last_date.getTime(), stripTimeToLocalDate(last_date).getTime());
      // check that date built adding many days to a first date, or a date built one by one, is the same
      assert.equal(last_date.getTime(), date.getTime());
    }
    // check that last date is 1900-01-01
    assert.equal(date_19000101.getTime(), last_date.getTime())
  });

  it('addDaysToUTCDate: adds the given number of days', () => {
    const date_20170330 = new Date(Date.UTC(1917, 2 /* Mar */, 30, 0, 0, 0));
    const date_20170331 = addDaysToUTCDate(date_20170330, 1);
    const date_20170401 = addDaysToUTCDate(date_20170331, 1);
    const date_20170402 = addDaysToUTCDate(date_20170401, 1);
    const date_20170403 = addDaysToUTCDate(date_20170402, 1);
    assert.equal(date_20170331, new Date(Date.UTC(1917, 2 /* Mar */, 31)));
    assert.equal(date_20170401, new Date(Date.UTC(1917, 3 /* Apr */, 1)));
    assert.equal(date_20170402, new Date(Date.UTC(1917, 3 /* Apr */, 2)));
    assert.equal(date_20170403, new Date(Date.UTC(1917, 3 /* Apr */, 3)));

    assert.equal(
      addDaysToUTCDate(new Date(Date.UTC(2014, 8 /* Sep */, 1)), 5),
      new Date(Date.UTC(2014, 8 /* Sep */, 6)));
    assert.equal(
      addDaysToUTCDate(new Date(Date.UTC(2014, 8 /* Sep */, 1)), 31),
      new Date(Date.UTC(2014, 9 /* Oct */, 2)));
    assert.equal(
      addDaysToUTCDate(new Date(Date.UTC(2025, 0 /* Sep */, 1)), 366),
      new Date(Date.UTC(2026, 0 /* Oct */, 2)));
  });

  it('addDaysToUTCDate: test loop from 1900 to 2100 and viceversa', () => {
    const date_19000101 = new Date(Date.UTC(1900, 0 /* Jan */, 1));
    const date_21001231 = new Date(Date.UTC(2100, 11 /* Dec */, 31));
    let last_date = date_19000101;
    // loop from 1 to 73413 (from 1900-01-01 to 2100-12-31)
    for (let i = 1; i <= 73413; i++) {
      const date = addDaysToUTCDate(date_19000101, i);
      last_date = addDaysToUTCDate(last_date, 1);
      // test that date doesn't contain time
      assert.equal(date.getTime(), stripTimeToUTCDate(date).getTime());
      assert.equal(last_date.getTime(), stripTimeToUTCDate(last_date).getTime());
      // check that date built adding many days to a first date, or a date built one by one, is the same
      assert.equal(last_date.getTime(), date.getTime());
    }
    // check that last date is 2100-12-31
    assert.equal(date_21001231.getTime(), last_date.getTime())

    // loop from 73413 to 1 (from 2100-12-31 to 1900-01-01)
    for (let i = 1; i <= 73413; i++) {
      const date = addDaysToUTCDate(date_21001231, -i);
      last_date = addDaysToUTCDate(last_date, -1);
      // test that date doesn't contain time
      assert.equal(date.getTime(), stripTimeToUTCDate(date).getTime());
      assert.equal(last_date.getTime(), stripTimeToUTCDate(last_date).getTime());
      // check that date built adding many days to a first date, or a date built one by one, is the same
      assert.equal(last_date.getTime(), date.getTime());
    }
    // check that last date is 1900-01-01
    assert.equal(date_19000101.getTime(), last_date.getTime())
  });
});

_describe('addMonths', () => {
  it('adds the given number of months', () => {
    const result = addMonths(new Date(2014, 8 /* Sep */, 1), 5);
    assert.equal(result, new Date(2015, 1 /* Feb */, 1));
  });

  it('does not mutate the original date', () => {
    const date = new Date(2014, 8 /* Sep */, 1);
    addMonths(date, 12);
    assert.equal(date, new Date(2014, 8 /* Sep */, 1));
  });

  it('works well if the desired month has fewer days and the provided date is in the last day of a month', () => {
    const date = new Date(2014, 11 /* Dec */, 31);
    const result = addMonths(date, 2);
    assert.equal(result, new Date(2015, 1 /* Feb */, 28));
  });

  it('[LEAP YEAR / anno bisestile] works well if the desired month has fewer days and the provided date is in the last day of a month', () => {
    const date = new Date(2023, 11 /* Dec */, 31);
    const result = addMonths(date, 2);
    assert.equal(result, new Date(2024, 1 /* Feb */, 29));
  });

  it('handles dates before 100 AD', () => {
    const initialDate = new Date(0);
    initialDate.setFullYear(0, 0 /* Jan */, 31);
    initialDate.setHours(0, 0, 0, 0);
    const expectedResult = new Date(0);
    expectedResult.setFullYear(0, 1 /* Feb */, 29);
    expectedResult.setHours(0, 0, 0, 0);
    const result = addMonths(initialDate, 1);
    assert.equal(result, expectedResult);
  });

  it('returns `Invalid Date` if the given date is invalid', () => {
    const result = addMonths(new Date(NaN), 5);
    assert(result instanceof Date && isNaN(result.getTime()));
  });

  it('returns `Invalid Date` if the given amount is NaN', () => {
    const result = addMonths(new Date(2014, 8 /* Sep */, 1), NaN);
    assert.equal(result, new Date(2014, 8 /* Sep */, 1));
  });
});
