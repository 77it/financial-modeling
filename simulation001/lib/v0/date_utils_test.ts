import {assert as assertDeno, assertEquals, assertStrictEquals, assertThrows} from "https://deno.land/std@0.139.0/testing/asserts.ts";
import {describe, it} from "https://deno.land/std@0.139.0/testing/bdd.ts";
import {parseJSON, differenceInCalendarDays} from "./date_utils.js";

const assert: any = function (param: any): any {
    return assertDeno(param);
}
assert.equal = assertEquals;
assert.strictEqual = assertStrictEquals;
assert.throws = assertThrows;

// inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/parseJSON/test.ts
describe('parseJSON', () => {
    it('parses a formatted date with an hour of offset back to UTC - issue 2149', () => {
        const date = '2021-01-09T13:18:10.873+01:00'
        const expectedDate = new Date('2021-01-09T12:18:10.873Z')
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted date with 2 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-01-09T13:18:10.873+02:00'
        const expectedDate = new Date('2021-01-09T11:18:10.873Z')
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted date with -2 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-01-09T13:18:10.873-02:00'
        const expectedDate = new Date('2021-01-09T15:18:10.873Z')
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted Indian Standart Time in Asia/Kolkata with +5:30 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-02-15T02:56:04.678+05:30'
        const expectedDate = new Date('2021-02-14T21:26:04.678Z')
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a formatted time in Asia/Kathmandu with +5:45 hours of offset back to UTC - issue 2149', () => {
        const date = '2021-02-15T17:45:00.900+05:45'
        const expectedDate = new Date('2021-02-15T12:00:00.900Z')
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate.toISOString())
    })

    it('parses a fully formed ISO date with Z', () => {
        const date = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), date)
    })

    it('parses a fully formed ISO date with Z without ms', () => {
        const date = '2000-03-15T05:20:10Z'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date with zero offset', () => {
        const zeroOffset = '2000-03-15T05:20:10+00:00'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJSON(zeroOffset)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date with zero offset without colon', () => {
        const zeroOffset = '2000-03-15T05:20:10+0000'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJSON(zeroOffset)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date without Z', () => {
        const date = '2000-03-15T05:20:10.123'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO date without Z and with 6-digit millisecond part', () => {
        const date = '2000-03-15T05:20:10.123456'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO with 1-digit millisecond part', () => {
        const date = '2000-03-15T05:20:10.1Z'
        const expectedDate = '2000-03-15T05:20:10.100Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses a fully formed ISO with 2-digit millisecond part', () => {
        const date = '2000-03-15T05:20:10.12Z'
        const expectedDate = '2000-03-15T05:20:10.120Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses supported formats with a space time separator instead of a T', () => {
        const date = '2000-03-15 05:20:10.123Z'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses the SQL datetime format without milliseconds', () => {
        const date = '2000-03-15 05:20:10'
        const expectedDate = '2000-03-15T05:20:10.000Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('parses the SQL datetime format with up to 7 millisecond digits', () => {
        const date = '2000-03-15 05:20:10.1234567'
        const expectedDate = '2000-03-15T05:20:10.123Z'
        const parsedDate = parseJSON(date)
        assert.strictEqual(parsedDate.toISOString(), expectedDate)
    })

    it('returns an invalid date for anything else', () => {
        assert.strictEqual(parseJSON('').toString(), 'Invalid Date')
        assert.strictEqual(parseJSON('invalid').toString(), 'Invalid Date')
        assert.strictEqual(parseJSON('2020-10-10').toString(), 'Invalid Date')
    })
})


// inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/differenceInCalendarDays/test.ts
describe('differenceInCalendarDays', () => {
    it('returns the number of calendar days between the given dates (2022-05-31 - 2022-05-30)', () => {
        const result = differenceInCalendarDays(
            new Date(2022, 4 /* May */, 31, 0, 0),
            new Date(2022, 4 /* May */, 30, 0, 0)
        )
        assert(result === 1)
    })

    it('returns the number of calendar days between the given dates (2011 - 2010)', () => {
        const result = differenceInCalendarDays(
            new Date(2011, 6 /* Jul */, 2, 18, 0),
            new Date(2010, 6 /* Jul */, 2, 6, 0)
        )
        assert(result === 365)
    })

    it('returns the number of calendar days between the given dates (2012 is a leap year - 2011)', () => {
        const result = differenceInCalendarDays(
            new Date(2012, 6 /* Jul */, 2, 18, 0),
            new Date(2011, 6 /* Jul */, 2, 6, 0)
        )
        assert(result === 366)
    })

    it('returns the number of calendar days between the given dates (2013 - 2012)', () => {
        const result = differenceInCalendarDays(
            new Date(2013, 6 /* Jul */, 2, 18, 0),
            new Date(2012, 6 /* Jul */, 2, 6, 0)
        )
        assert(result === 365)
    })

    it('returns a negative number if the time value of the first date is smaller', () => {
        const result = differenceInCalendarDays(
            new Date(2011, 6 /* Jul */, 2, 6, 0),
            new Date(2012, 6 /* Jul */, 2, 18, 0)
        )
        assert(result === -366)
    })

    describe('edge cases', () => {
        it('the difference is less than a day, but the given dates are in different calendar days', () => {
            const result = differenceInCalendarDays(
                new Date(2014, 8 /* Sep */, 5, 0, 0),
                new Date(2014, 8 /* Sep */, 4, 23, 59)
            )
            assert(result === 1)
        })

        it('the same for the swapped dates', () => {
            const result = differenceInCalendarDays(
                new Date(2014, 8 /* Sep */, 4, 23, 59),
                new Date(2014, 8 /* Sep */, 5, 0, 0)
            )
            assert(result === -1)
        })

        it('the time values of the given dates are the same', () => {
            const result = differenceInCalendarDays(
                new Date(2014, 8 /* Sep */, 6, 0, 0),
                new Date(2014, 8 /* Sep */, 5, 0, 0)
            )
            assert(result === 1)
        })

        it('the given the given dates are the same', () => {
            const result = differenceInCalendarDays(
                new Date(2014, 8 /* Sep */, 5, 0, 0),
                new Date(2014, 8 /* Sep */, 5, 0, 0)
            )
            assert(result === 0)
        })

        it('does not return -0 when the given dates are the same', () => {
            function isNegativeZero(x: number): boolean {
                return x === 0 && 1 / x < 0
            }

            const result = differenceInCalendarDays(
                new Date(2014, 8 /* Sep */, 5, 0, 0),
                new Date(2014, 8 /* Sep */, 5, 0, 0)
            )

            const resultIsNegative = isNegativeZero(result)
            assert(resultIsNegative === false)
        })
    })

    it('returns NaN if the first date is `Invalid Date`', () => {
        const result = differenceInCalendarDays(
            new Date(NaN),
            new Date(2017, 0 /* Jan */, 1)
        )
        assert(isNaN(result))
    })

    it('returns NaN if the second date is `Invalid Date`', () => {
        const result = differenceInCalendarDays(
            new Date(2017, 0 /* Jan */, 1),
            new Date(NaN)
        )
        assert(isNaN(result))
    })

    it('returns NaN if the both dates are `Invalid Date`', () => {
        const result = differenceInCalendarDays(new Date(NaN), new Date(NaN))
        assert(isNaN(result))
    })
})
