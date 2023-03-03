// from (with edits) https://github.com/date-fns/date-fns/blob/fadbd4eb7920bf932c25f734f3949027b2fe4887/src/addMonths/test.ts

import { addMonths } from '../../src/lib/date_utils.js';

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

_describe('addMonths', () => {
    it('adds the given number of months', () => {
        const result = addMonths(new Date(2014, 8 /* Sep */, 1), 5)
        assert.equal(result, new Date(2015, 1 /* Feb */, 1))
    })

    it('does not mutate the original date', () => {
        const date = new Date(2014, 8 /* Sep */, 1)
        addMonths(date, 12)
        assert.equal(date, new Date(2014, 8 /* Sep */, 1))
    })

    it('works well if the desired month has fewer days and the provided date is in the last day of a month', () => {
        const date = new Date(2014, 11 /* Dec */, 31)
        const result = addMonths(date, 2)
        assert.equal(result, new Date(2015, 1 /* Feb */, 28))
    })

    it('[LEAP YEAR / anno bisestile] works well if the desired month has fewer days and the provided date is in the last day of a month', () => {
        const date = new Date(2023, 11 /* Dec */, 31)
        const result = addMonths(date, 2)
        assert.equal(result, new Date(2024, 1 /* Feb */, 29))
    })

    it('handles dates before 100 AD', () => {
        const initialDate = new Date(0)
        initialDate.setFullYear(0, 0 /* Jan */, 31)
        initialDate.setHours(0, 0, 0, 0)
        const expectedResult = new Date(0)
        expectedResult.setFullYear(0, 1 /* Feb */, 29)
        expectedResult.setHours(0, 0, 0, 0)
        const result = addMonths(initialDate, 1)
        assert.equal(result, expectedResult)
    })

    it('returns `Invalid Date` if the given date is invalid', () => {
        const result = addMonths(new Date(NaN), 5)
        assert(result instanceof Date && isNaN(result.getTime()))
    })

    it('returns `Invalid Date` if the given amount is NaN', () => {
        const result = addMonths(new Date(2014, 8 /* Sep */, 1), NaN)
        assert.equal(result, new Date(2014, 8 /* Sep */, 1))
    })
})
