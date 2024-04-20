import {
    isValidDate,
    parseJsonToLocalDate,
    parseJsonToUTCDate,
    differenceInCalendarDaysOfLocalDates as differenceInCalendarDays_lib,
    differenceInUTCCalendarDays,
    excelSerialDateToUTCDate,
    excelSerialDateToLocalDate,
    localDateToExcelSerialDate,
    getEndOfMonthOfLocalDate
} from '../../src/lib/date_utils.js';
import { differenceInCalendarDays_luxon } from './date_utils_a__differenceInCalendarDays_luxon.js';
import { toUTC, stripTimeToLocalDate, toStringYYYYMMDD } from '../../src/lib/date_utils.js';

import {assert as assertDeno, assertEquals, assertFalse, assertStrictEquals, assertThrows} from '../deps.js';
import {describe, it} from "https://deno.land/std@0.139.0/testing/bdd.ts";

/**
 * @param {*} p
 */
function assert(p) {
    return assertDeno(p);
}
assert.equal = assertEquals;
assert.strictEqual = assertStrictEquals;
assert.throws = assertThrows;
const _describe = describe;  // replaced `describe` with `_describe` to prevent highlight of this file from Webstorm


_describe('isValidDate', () => {
    it('test', () => {
        assert(isValidDate(new Date(Date.UTC(2022, 11, 25))));

        assertFalse(isValidDate(new Date('not a date')));
        assertFalse(isValidDate(undefined));
        assertFalse(isValidDate(999));
        assertFalse(isValidDate('2012-12-25'));
    })
})


_describe('parseJsonToLocalDate as Date', () => {
    it('short date 2021-01-09', () => {
        const date = '2021-01-09';
        const parsedDate = parseJsonToLocalDate(date);
        const expectedDate = new Date(2021, 0, 9);
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString());
    })

    it('short date 2021/01/09', () => {
        const date = '2021/01/09';
        const parsedDate = parseJsonToLocalDate(date);
        const expectedDate = new Date(2021, 0, 9);
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString());
    })

    it('short date 2021.01.09', () => {
        const date = '2021.01.09';
        const parsedDate = parseJsonToLocalDate(date);
        const expectedDate = new Date(2021, 0, 9);
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString());
    })

    it('short date 2023/01/32: 32th day is parsed as the first day of the next month', () => {
        const date = '2023/01/32';
        const parsedDate = parseJsonToLocalDate(date);
        const expectedDate = new Date(2023, 1, 1);
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString());
    })

    it('parses a fully formed ISO date with Z', () => {
        const date = '2000-03-15T05:20:10.123Z';
        const parsedDate = parseJsonToLocalDate(date);
        const expectedDate = new Date(2000, 2, 15, 5, 20, 10, 123);
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString());
    })

    it('parses a fully formed ISO date with Z + spaces', () => {
        const date = '   2000-03-15T05:20:10.123Z   ';
        const parsedDate = parseJsonToLocalDate(date);
        const expectedDate = new Date(2000, 2, 15, 5, 20, 10, 123);
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString());
    })
})


_describe('parseJsonToUTCDate as UTC #1', () => {
    it('short date 2021-01-09, explicit UTC option', () => {
        const date = '2021-01-09';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = '2021-01-09T00:00:00.000Z';
        assert.equal(parsedDate.toISOString(), expectedDate);
    })

    it('short date 2021-01-09', () => {
        const date = '2021-01-09';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = '2021-01-09T00:00:00.000Z';
        assert.equal(parsedDate.toISOString(), expectedDate);
    })

    it('short date 2021/01/09', () => {
        const date = '2021/01/09';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = '2021-01-09T00:00:00.000Z';
        assert.equal(parsedDate.toISOString(), expectedDate);
    })

    it('short date 2021.01.09', () => {
        const date = '2021.01.09';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = '2021-01-09T00:00:00.000Z';
        assert.equal(parsedDate.toISOString(), expectedDate);
    })

    it('short date + spaces', () => {
        const date = '   2021-01-09     ';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = '2021-01-09T00:00:00.000Z';
        assert.equal(parsedDate.toISOString(), expectedDate);
    })

    it('Invalid date for short date + random extra characters on start', () => {
        const date = '!?!?!2021-01-09';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = 'Invalid Date';
        assert.equal(parsedDate.toString(), expectedDate);
    })

    it('Invalid date for short date + random extra characters on end', () => {
        const date = '2021-01-09!!!WWWtext';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = 'Invalid Date';
        assert.equal(parsedDate.toString(), expectedDate);
    })

    it('parses a fully formed ISO date with Z + spaces', () => {
        const date = '   2000-03-15T05:20:10.123Z   ';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = '2000-03-15T05:20:10.123Z';
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date with Z + spaces, explicit UTC option', () => {
        const date = '   2000-03-15T05:20:10.123Z   ';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = '2000-03-15T05:20:10.123Z';
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('Invalid date for parses a fully formed ISO date with Z + random extra characters on start', () => {
        const date = '!?!?!2000-03-15T05:20:10.123Z';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = 'Invalid Date';
        assert.equal(parsedDate.toString(), expectedDate)
    })

    it('Invalid date for parses a fully formed ISO date with Z + random extra characters on end', () => {
        const date = '2000-03-15T05:20:10.123Z!!!WWWtext';
        const parsedDate = parseJsonToUTCDate(date);
        const expectedDate = 'Invalid Date';
        assert.equal(parsedDate.toString(), expectedDate)
    })
})


// inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/parseJsonDate/test.ts (MIT license)
_describe('parseJsonToUTCDate #2', () => {
    it('parses a formatted date with an hour of offset back to UTC - issue 2149', () => {
        const date = '2021-01-09T13:18:10.873+01:00'
        const expectedDate = new Date('2021-01-09T12:18:10.873Z')
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted date with 2 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-01-09T13:18:10.873+02:00'
        const expectedDate = new Date('2021-01-09T11:18:10.873Z')
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted date with -2 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-01-09T13:18:10.873-02:00'
        const expectedDate = new Date('2021-01-09T15:18:10.873Z')
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted Indian Standart Time in Asia/Kolkata with +5:30 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-02-15T02:56:04.678+05:30'
        const expectedDate = new Date('2021-02-14T21:26:04.678Z')
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted time in Asia/Kathmandu with +5:45 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-02-15T17:45:00.900+05:45'
        const expectedDate = new Date('2021-02-15T12:00:00.900Z')
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a fully formed ISO date with Z', () => {
        const date = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), date)
    })

    it('parses a fully formed ISO date with Z without ms', () => {
        const date = '2000-03-15T05:20:10Z'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date with zero offset', () => {
        const zeroOffset = '2000-03-15T05:20:10+00:00'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJsonToUTCDate(zeroOffset)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date with zero offset without colon', () => {
        const zeroOffset = '2000-03-15T05:20:10+0000'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJsonToUTCDate(zeroOffset)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date without Z', () => {
        const date = '2000-03-15T05:20:10.123'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date without Z and with 6-digit millisecond part', () => {
        const date = '2000-03-15T05:20:10.123456'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO with 1-digit millisecond part', () => {
        const date = '2000-03-15T05:20:10.1Z'
        const expectedDate = '2000-03-15T05:20:10.100Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO with 2-digit millisecond part', () => {
        const date = '2000-03-15T05:20:10.12Z'
        const expectedDate = '2000-03-15T05:20:10.120Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses supported formats with a space time separator instead of a T', () => {
        const date = '2000-03-15 05:20:10.123Z'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses the SQL datetime format without milliseconds', () => {
        const date = '2000-03-15 05:20:10'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('parses the SQL datetime format with up to 7 millisecond digits', () => {
        const date = '2000-03-15 05:20:10.1234567'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJsonToUTCDate(date)
        assert.equal(parsedDate.toISOString(), expectedDate)
    })

    it('returns an invalid date for anything else', () => {
        assert.equal(parseJsonToUTCDate('').toString(), 'Invalid Date')
        assert.equal(parseJsonToUTCDate('invalid').toString(), 'Invalid Date')
        assert.equal(parseJsonToUTCDate('2020\\10\\10').toString(), 'Invalid Date')
    })
})


_describe('differenceInUTCCalendarDays', () => {
    it('returns the number of calendar days (1 day) between the given dates in UTC without hours', () => {
        const result = differenceInUTCCalendarDays(
            new Date(Date.UTC(2022, 4 /* May */, 31, 0, 0)),
            new Date(Date.UTC(2022, 4 /* May */, 30, 0, 0))
        )
        assert(result === 1)
    })

    it('returns the number of calendar days (1 day) between the given dates in UTC with hours', () => {
        const result = differenceInUTCCalendarDays(
            new Date(Date.UTC(2022, 4 /* May */, 31, 0, 0)),
            new Date(Date.UTC(2022, 4 /* May */, 30, 2, 0))
        )
        assert(result === 1)
    })
})


_describe('differenceInCalendarDaysOfLocalDates #1', () => {
    /**
     * @param {function} differenceInCalendarDaysOfLocalDates
     */
    function differenceInCalendarDays_test1(differenceInCalendarDaysOfLocalDates) {
        it('returns the number of calendar days between the given dates (2022-05-31 - 2022-05-30)', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2022, 4 /* May */, 31, 0, 0),
              new Date(2022, 4 /* May */, 30, 0, 0)
            )
            assert(result === 1)
        })

        it('returns the NEGATIVE number of calendar days between the given dates', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2022, 4 /* May */, 30, 0, 0),
              new Date(2022, 4 /* May */, 31, 0, 0)
            )
            assert(result === -1)
        })

        it('returns the number of calendar days between the given dates (2011 - 2010)', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2011, 6 /* Jul */, 2, 18, 0),
              new Date(2010, 6 /* Jul */, 2, 6, 0)
            )
            assert(result === 365)
        })

        it('returns the number of calendar days between the given dates (2013 - 2012)', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2013, 6 /* Jul */, 2, 18, 0),
              new Date(2012, 6 /* Jul */, 2, 6, 0)
            )
            assert(result === 365)
        })

        it('the difference is less than a day,in the same calendar day', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2014, 8 /* Sep */, 5, 0, 1),
              new Date(2014, 8 /* Sep */, 5, 23, 58)
            )
            assert(result === 0)
        })

        it('the difference is the whole day,in the same calendar day', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2014, 8 /* Sep */, 5, 0, 0),
              new Date(2014, 8 /* Sep */, 5, 23, 59)
            )
            assert(result === 0)
        })
    }

    differenceInCalendarDays_test1(differenceInCalendarDays_lib);
    differenceInCalendarDays_test1(differenceInCalendarDays_luxon);
})


// inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/differenceInCalendarDays/test.ts (MIT license)
// without not applicable tests
_describe('differenceInCalendarDaysOfLocalDates #2', () => {
    /**
     * @param {function} differenceInCalendarDaysOfLocalDates
     */
    function differenceInCalendarDays_test2(differenceInCalendarDaysOfLocalDates) {
        it('returns the number of calendar days between the given dates (2012 is a leap year - 2011)', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2012, 6 /* Jul */, 2, 18, 0),
              new Date(2011, 6 /* Jul */, 2, 6, 0)
            )
            assert(result === 366)
        })

        it('returns a negative number if the time value of the first date is smaller', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2011, 6 /* Jul */, 2, 6, 0),
              new Date(2012, 6 /* Jul */, 2, 18, 0)
            )
            assert(result === -366)
        })

        _describe('edge cases', () => {
            it('the difference is less than a day, but the given dates are in different calendar days', () => {
                const result = differenceInCalendarDaysOfLocalDates(
                  new Date(2014, 8 /* Sep */, 5, 0, 0),
                  new Date(2014, 8 /* Sep */, 4, 23, 59)
                )
                assert(result === 1)
            })

            it('the same for the swapped dates', () => {
                const result = differenceInCalendarDaysOfLocalDates(
                  new Date(2014, 8 /* Sep */, 4, 23, 59),
                  new Date(2014, 8 /* Sep */, 5, 0, 0)
                )
                assert(result === -1)
            })

            it('the time values of the given dates are the same', () => {
                const result = differenceInCalendarDaysOfLocalDates(
                  new Date(2014, 8 /* Sep */, 6, 0, 0),
                  new Date(2014, 8 /* Sep */, 5, 0, 0)
                )
                assert(result === 1)
            })

            it('the given the given dates are the same', () => {
                const result = differenceInCalendarDaysOfLocalDates(
                  new Date(2014, 8 /* Sep */, 5, 0, 0),
                  new Date(2014, 8 /* Sep */, 5, 0, 0)
                )
                assert(result === 0)
            })

            it('does not return -0 when the given dates are the same', () => {
                /**
                 * @param {number} x
                 * @return {boolean}
                 */
                function isNegativeZero (x) {
                    return x === 0 && 1 / x < 0
                }

                const result = differenceInCalendarDaysOfLocalDates(
                  new Date(2014, 8 /* Sep */, 5, 0, 0),
                  new Date(2014, 8 /* Sep */, 5, 0, 0)
                )

                const resultIsNegative = isNegativeZero(result)
                assert(resultIsNegative === false)
            })
        })

        it('returns NaN if the first date is `Invalid Date`', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(NaN),
              new Date(2017, 0 /* Jan */, 1)
            )
            assert(isNaN(result))
        })

        it('returns NaN if the second date is `Invalid Date`', () => {
            const result = differenceInCalendarDaysOfLocalDates(
              new Date(2017, 0 /* Jan */, 1),
              new Date(NaN)
            )
            assert(isNaN(result))
        })

        it('returns NaN if the both dates are `Invalid Date`', () => {
            const result = differenceInCalendarDaysOfLocalDates(new Date(NaN), new Date(NaN))
            assert(isNaN(result))
        })
    }

    differenceInCalendarDays_test2(differenceInCalendarDays_lib);
    differenceInCalendarDays_test2(differenceInCalendarDays_luxon);
})

// DST TESTS inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/differenceInCalendarDays/test.ts (MIT license)
_describe('differenceInCalendarDaysOfLocalDates #3 - DST', () => {
    /**
     * @param {function} differenceInCalendarDaysOfLocalDates
     */
    function differenceInCalendarDays_test3(differenceInCalendarDaysOfLocalDates) {
        // These tests were copy-pasted almost unchanged from DST tests for
        // `differenceInDays`
        const dstTransitions = getDstTransitions(2017);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || Deno.env.get("TZ");

        if (dstTransitions.start === undefined || dstTransitions.end === undefined)
            throw new Error(`No DST transitions found for ${tz}`);

        console.log(`works across DST start & end in local timezone: ${tz}`);

        const { start, end } = dstTransitions
        const HOUR = 1000 * 60 * 60
        const MINUTE = 1000 * 60

        assert(start !== undefined)
        assert(end !== undefined)

        // It's usually 1 hour, but for some timezones, e.g. Australia/Lord_Howe, it is 30 minutes
        const dstOffset =
          (end.getTimezoneOffset() - start.getTimezoneOffset()) * MINUTE

        // TEST DST START (SPRING)

        // anchor to one hour before the boundary
        {
            const a = new Date(start.getTime() - HOUR) // 1 hour before DST
            const b = new Date(a.getTime() + 24 * HOUR - dstOffset) // 1 day later, same local time
            const c = new Date(a.getTime() + 48 * HOUR - dstOffset) // 2 days later, same local time

            assert(sameTime(a, b))
            assert(sameTime(a, c))
            assert(sameTime(b, c))
            assert(differenceInCalendarDaysOfLocalDates(c, b) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(b, a) === 1) // 23 hours -> 1 day
            assert(differenceInCalendarDaysOfLocalDates(c, a) === 2) // 47 hours -> 2 days
        }
        // anchor exactly at the boundary
        {
            const a = start // exactly when DST starts
            const b = new Date(a.getTime() + 24 * HOUR) // 1 day later, same local time
            const c = new Date(a.getTime() + 48 * HOUR) // 2 days later, same local time

            assert(sameTime(a, b))
            assert(sameTime(a, c))
            assert(sameTime(b, c))
            assert(differenceInCalendarDaysOfLocalDates(c, b) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(b, a) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(c, a) === 2) // 2 normal 24-hour days
        }

        // TEST DST END (FALL)

        // make sure that diffs across a "fall back" DST boundary won't report a full day
        // until 25 hours have elapsed.
        {
            const a = new Date(end.getTime() - HOUR / 2) // 1 hour before Standard Time starts
            const b = new Date(a.getTime() + 24 * HOUR + dstOffset - 15 * MINUTE) // 1 day later, 15 mins earlier local time
            const c = new Date(a.getTime() + 48 * HOUR + dstOffset - 15 * MINUTE) // 2 days later, 15 mins earlier local time

            assert(differenceInCalendarDaysOfLocalDates(c, b) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(b, a) === 1) // 24.75 hours but 1 calendar days
            assert(differenceInCalendarDaysOfLocalDates(c, a) === 2) // 49.75 hours but 2 calendar days
        }
        // anchor to one hour before the boundary
        {
            const a = new Date(end.getTime() - HOUR) // 1 hour before Standard Time starts
            const b = new Date(a.getTime() + 24 * HOUR + dstOffset) // 1 day later, same local time
            const c = new Date(a.getTime() + 48 * HOUR + dstOffset) // 2 days later, same local time

            assert(sameTime(a, b))
            assert(sameTime(a, c))
            assert(sameTime(b, c))
            assert(differenceInCalendarDaysOfLocalDates(c, b) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(b, a) === 1) // 25 hours -> 1 day
            assert(differenceInCalendarDaysOfLocalDates(c, a) === 2) // 49 hours -> 2 days
        }
        // anchor to one hour after the boundary
        {
            const a = new Date(end.getTime() + HOUR) // 1 hour after Standard Time starts
            const b = new Date(a.getTime() + 24 * HOUR) // 1 day later, same local time
            const c = new Date(a.getTime() + 48 * HOUR) // 2 days later, same local time

            assert(sameTime(a, b))
            assert(sameTime(a, c))
            assert(sameTime(b, c))
            assert(differenceInCalendarDaysOfLocalDates(c, b) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(b, a) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(c, a) === 2) // 2 normal 24-hour days
        }
        // anchor exactly at the boundary
        {
            const a = end // exactly when Standard Time starts
            const b = new Date(a.getTime() + 24 * HOUR) // 1 day later, same local time
            const c = new Date(a.getTime() + 48 * HOUR) // 2 days later, same local time
            assert(differenceInCalendarDaysOfLocalDates(b, a) === 1) // normal 24-hour day
            assert(differenceInCalendarDaysOfLocalDates(c, a) === 2) // 2 normal 24-hour days
        }
    }
    differenceInCalendarDays_test3(differenceInCalendarDays_lib);
    differenceInCalendarDays_test3(differenceInCalendarDays_luxon);
})


_describe('excelSerialDateToUTCDate', () => {
    it('tests', () => {
        // test dates from number 367, because Excel incorrectly treats 1900 as a leap year;
        // see https://stackoverflow.com/a/67130235/5288052
        assertEquals(excelSerialDateToUTCDate(367), new Date(Date.UTC(1901, 0, 1, 0, 0, 0)));
        assertEquals(excelSerialDateToUTCDate(28384), new Date(Date.UTC(1977, 8, 16, 0, 0, 0)));
        assertEquals(excelSerialDateToUTCDate(44920), new Date(Date.UTC(2022, 11, 25, 0, 0, 0)));
        assertEquals(excelSerialDateToUTCDate(NaN), new Date(NaN));
    })
})


_describe('excelSerialDateToLocalDate', () => {
    it('tests', () => {
        // test dates from number 61 = 1900-03-01, because Excel incorrectly treats 1900 as a leap year;
        // see https://stackoverflow.com/a/67130235/5288052
        assertEquals(excelSerialDateToLocalDate(61), new Date(1900, 2, 1, 0, 0, 0));
        assertEquals(excelSerialDateToLocalDate(367), new Date(1901, 0, 1, 0, 0, 0));
        // the decimal part is ignored
        assertEquals(excelSerialDateToLocalDate(367.99), new Date(1901, 0, 1, 0, 0, 0));
        assertEquals(excelSerialDateToLocalDate(368), new Date(1901, 0, 2, 0, 0, 0));
        assertEquals(excelSerialDateToLocalDate(28384), new Date(1977, 8, 16, 0, 0, 0));
        assertEquals(excelSerialDateToLocalDate(44920), new Date(2022, 11, 25, 0, 0, 0));
        assertEquals(excelSerialDateToLocalDate(NaN), new Date(NaN));
    })
})


_describe('localDateToExcelSerialDate', () => {
    it('tests', () => {
        // test dates from number 61 = 1900-03-01, because Excel incorrectly treats 1900 as a leap year;
        // see https://stackoverflow.com/a/67130235/5288052
        assertEquals(61, localDateToExcelSerialDate(new Date(1900, 2, 1, 0, 0, 0)));
        assertEquals(367, localDateToExcelSerialDate(new Date(1901, 0, 1, 0, 0, 0)));
        // the decimal part is ignored
        assertEquals(367, localDateToExcelSerialDate(new Date(1901, 0, 1, 0, 0, 0)));
        assertEquals(368, localDateToExcelSerialDate(new Date(1901, 0, 2, 0, 0, 0)));
        assertEquals(28384, localDateToExcelSerialDate(new Date(1977, 8, 16, 0, 0, 0)));
        assertEquals(44920, localDateToExcelSerialDate(new Date(2022, 11, 25, 0, 0, 0)));
        assertEquals(NaN, localDateToExcelSerialDate(new Date(NaN)));
    })
})


_describe('toUTC', () => {
    it('tests', () => {
        const date = new Date(1977, 8, 16, 0, 0, 0);
        const dateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));

        assertEquals(toUTC(date).getTime(), dateUTC.getTime());
    })
})


_describe('stripTimeToLocalDate', () => {
    it('tests', () => {
        const date = new Date(1977, 8, 16, 10, 1, 5, 9);
        const dateYYYYMMDD = new Date(1977, 8, 16, 0, 0, 0);

        assertEquals(stripTimeToLocalDate(date).getTime(), dateYYYYMMDD.getTime());
        assertEquals(stripTimeToLocalDate(stripTimeToLocalDate(date)).getTime(), dateYYYYMMDD.getTime());  // idempotent
    })
})


_describe('toStringYYYYMMDD', () => {
    it('tests', () => {
        const date = new Date(1977, 8, 16, 10, 1, 5, 9);

        assertEquals(toStringYYYYMMDD(date), '1977-09-16');
    })
})


_describe('getEndOfMonthOfLocalDate', () => {
    it('tests', () => {
        const date = new Date(1977, 8 /*Sep*/, 16, 10, 1, 5, 9);
        const date2 = new Date(1977, 8 /*Sep*/, 16);
        const date3 = new Date(1977, 8 /*Sep*/, 30, 11, 59, 59, 999);
        // test leap year
        const date4_bisestile = new Date(2020, 1 /*Feb*/, 15, 11, 59, 59, 999);
        const date5_bisestile = new Date(2020, 1 /*Feb*/, 1);

        assertEquals(getEndOfMonthOfLocalDate(date), new Date(1977, 8 /*Sep*/, 30));
        assertEquals(getEndOfMonthOfLocalDate(date2), new Date(1977, 8 /*Sep*/, 30));
        assertEquals(getEndOfMonthOfLocalDate(date3), new Date(1977, 8 /*Sep*/, 30));
        assertEquals(getEndOfMonthOfLocalDate(date4_bisestile), new Date(2020, 1 /*Feb*/, 29));
        assertEquals(getEndOfMonthOfLocalDate(date5_bisestile), new Date(2020, 1 /*Feb*/, 29));
    })
})

//region // inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/test/dst/tzOffsetTransitions.ts (MIT license)

/**
 * Fetch the start and end of DST for the local time
 * zone in a given year.
 * We'll assume that DST start & end are the first
 * forward and the last back transitions in the year,
 * except transitions in Jan or Dec which are likely
 * to be permanent TZ changes rather than DST changes.
 * @param {number} year
 * @returns {{start: Date|undefined, end: Date|undefined}} object with two Date-valued properties:
 * - `start` is the first instant of DST in the Spring,
 *   or undefined if there's no DST in this year.
 * - `end` is the first instant of standard time
 *   in the Fall, or undefined if there's no DST in
 *   this year.
 */
export function getDstTransitions(year) {
  const result = {
    start: undefined,
    end: undefined
  }
  const transitions = getTzOffsetTransitions(year)
  for (let i = 0; i < transitions.length; i++) {
    const t = transitions[i]
    const month = t.date.getMonth()
    if (month > 0 && month < 11) {
      if (t.type === 'forward') result.start = t.date
      if (t.type === 'back' && !result.end) result.end = t.date
    }
  }
  return result
}

/**
 * Fetch all timezone-offset transitions in a given
 * year.  These are almost always DST transitions,
 * but sometimes there are non-DST changes, e.g.
 * when a country changes its time zone
 * @param {number} year
 * @returns {any[]} array of objects, each  with the following
 * properties:
 * - `date` - a `Date` representing the first instant
 *   when the new timezone offset is effective.
 * - `type` - either `forward` for skipping time like
 *   the Spring transition to DST.
 * - `before` - the timezone offset before the transition.
 *   For example, the UTC-0400 offset will return -240.
 *   To match how times are displayed in ISO 8601 format,
 *   the sign of this value is reversed from the return
 *   value of `Date.getTimezoneOffset`.
 * - `after` - the timezone offset after the transition.
 *   Examples and caveats are the same as `before`.

 */
export function getTzOffsetTransitions(year) {
  // start at the end of the previous day
  let date = firstTickInLocalDay(new Date(year, 0, 1))
  if (!isValidDate(date)) {
    throw new Error('Invalid Date')
  }
  let baseTzOffset = previousTickTimezoneOffset(date)
  const transitions = []
  do {
    let tzOffset = date.getTimezoneOffset()
    if (baseTzOffset !== tzOffset) {
      if (tzOffset !== previousTickTimezoneOffset(date)) {
        // Transition is the first tick of a local day.
        transitions.push({
          date: date,
          type: tzOffset < baseTzOffset ? 'forward' : 'back',
          before: -baseTzOffset,
          after: -tzOffset
        })
        baseTzOffset = tzOffset
      } else {
        // transition was not at the start of the day, so it must have happened
        // yesterday. Back up one day and find the minute where it happened.
        let transitionDate = new Date(date.getTime())
        transitionDate.setDate(transitionDate.getDate() - 1)

        // Iterate through each 5 mins of the day until we find a transition.
        // TODO: this could be optimized to search hours then minutes or by or
        // by using a binary search.
        const dayNumber = transitionDate.getDate()
        while (
          isValidDate(transitionDate) &&
          transitionDate.getDate() === dayNumber
          ) {
          tzOffset = transitionDate.getTimezoneOffset()
          if (baseTzOffset !== tzOffset) {
            transitions.push({
              date: transitionDate,
              type: tzOffset < baseTzOffset ? 'forward' : 'back',
              before: -baseTzOffset,
              after: -tzOffset
            })
            baseTzOffset = tzOffset
            break // assuming only 1 transition per day
          }
          transitionDate = fiveMinutesLater(transitionDate)
        }
      }
    }
    date = oneDayLater(date)
  } while (date.getFullYear() === year)
  return transitions
}

/**
 * @param {Date} date
 * @returns {Date}
 **/
function firstTickInLocalDay(date) {
  const MINUTE = 1000 * 60

  const dateNumber = date.getDate()
  let prev = date
  let d = date
  do {
    prev = d
    d = new Date(d.getTime() - MINUTE)
  } while (dateNumber === d.getDate())
  return prev
}

/**
 * @param {Date} date
 * @returns {number}
 **/
function previousTickTimezoneOffset(date) {
  const d = new Date(date.getTime() - 1)
  return d.getTimezoneOffset()
}

/**
 * @param {Date} date
 * @returns {Date}
 **/
function fiveMinutesLater(date) {
  const MINUTE = 1000 * 60

  return new Date(date.getTime() + 5 * MINUTE)
}

/**
 * @param {Date} date
 * @returns {Date}
 **/
function oneDayLater(date) {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return firstTickInLocalDay(d)
}

/**
 * @param {Date} t1
 * @param {Date} t2
 * @returns {boolean}
 **/
function sameTime(t1, t2) {
  return (
    t1.getHours() === t2.getHours() &&
    t1.getMinutes() === t2.getMinutes() &&
    t1.getSeconds() === t2.getSeconds() &&
    t1.getMilliseconds() === t2.getMilliseconds()
  )
}

//#endregion
