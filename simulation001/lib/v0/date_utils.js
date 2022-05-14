// inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/parseJSON/index.ts
/**
 * @name parseJSON
 * @category Common Helpers
 * @summary Parse a JSON date string
 *
 * @description
 * Converts a complete ISO date string in UTC time, the typical format for transmitting
 * a date in JSON, to a JavaScript `Date` instance.
 *
 * The following formats are supported:
 *
 * - `2000-03-15T05:20:10.123Z`: The output of `.toISOString()` and `JSON.stringify(new Date())`
 * - `2000-03-15T05:20:10Z`: Without milliseconds
 * - `2000-03-15T05:20:10+00:00`: With a zero offset, the default JSON encoded format in some other languages
 * - `2000-03-15T05:20:10+05:45`: With a positive or negative offset, the default JSON encoded format in some other languages
 * - `2000-03-15T05:20:10+0000`: With a zero offset without a colon
 * - `2000-03-15T05:20:10`: Without a trailing 'Z' symbol
 * - `2000-03-15T05:20:10.1234567`: Up to 7 digits in milliseconds field. Only first 3 are taken into account since JS does not allow fractional milliseconds
 * - `2000-03-15 05:20:10`: With a space instead of a 'T' separator for APIs returning a SQL date without reformatting
 *
 * Any other input type or invalid date strings will return an `Invalid Date`.
 *
 * @param {String} argument A fully formed ISO8601 date string to convert
 * @returns {Date} the parsed date in the local time zone
 */
export function parseJSON(argument) {
    const parts = argument.match(
        /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?/
    )
    if (parts) {
        // Group 8 matches the sign
        return new Date(
            Date.UTC(
                +parts[1],
                +parts[2] - 1,
                +parts[3],
                +parts[4] - (+parts[9] || 0) * (parts[8] == '-' ? -1 : 1),
                +parts[5] - (+parts[10] || 0) * (parts[8] == '-' ? -1 : 1),
                +parts[6],
                +((parts[7] || '0') + '00').substring(0, 3)
            )
        )
    }
    return new Date(NaN);
}



// ispired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/differenceInCalendarDays/index.ts
{}
