import { isInvalidDate } from './validation_utils.js';

export { isInvalidDate };

// inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/parseJSON/index.ts (MIT license)
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
export function parseJSON (argument) {
  const parts = argument.match(
    /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?/
  );
  if (parts) {
    // Group 8 matches the sign
    return new Date(
      Date.UTC(
        +parts[1],
        +parts[2] - 1,
        +parts[3],
        +parts[4] - (+parts[9] || 0) * (parts[8] === '-' ? -1 : 1),
        +parts[5] - (+parts[10] || 0) * (parts[8] === '-' ? -1 : 1),
        +parts[6],
        +((parts[7] || '0') + '00').substring(0, 3)
      )
    );
  }
  return new Date(NaN);
}

// ispired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/differenceInCalendarDays/index.ts (MIT license)
// & https://stackoverflow.com/a/15289883/5288052
/**
 * @description
 * Get the number of days between the given dates. This means that the times are removed
 * from the dates and then the difference in days is calculated.
 *
 * @param {Date} dateLeft - the later date
 * @param {Date} dateRight - the earlier date
 * @returns {Number} the number of calendar days
 *
 * @example
 * // How many calendar days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00 (leap year)?
 * const result = differenceInCalendarDays(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 366
 * // How many calendar days are between
 * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
 * const result = differenceInCalendarDays(
 *   new Date(2011, 6, 3, 0, 1),
 *   new Date(2011, 6, 2, 23, 59)
 * )
 * //=> 1
 */
export function differenceInCalendarDays (
  dateLeft,
  dateRight
) {
  const MILLISECONDS_IN_DAY = 86400000;

  const startOfDayLeft = startOfDay(dateLeft);
  const startOfDayRight = startOfDay(dateRight);

  const timestampLeft = startOfDayLeft.getTime();
  const timestampRight = startOfDayRight.getTime();

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a day is not constant
  // (e.g. it's different in the day of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);

  // inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/startOfDay/index.ts
  /**
   * @description
   * Return the start of a day for the given date.
   * The result will be in the local timezone.
   *
   * @param {Date} date - the original date
   * @returns {Date} the start of a day
   *
   * @example
   * // The start of a day for 2 September 2014 11:55:00:
   * const result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Tue Sep 02 2014 00:00:00
   */
  function startOfDay (date) {
    const _date = new Date(date.getTime());  // clone the date
    _date.setHours(0, 0, 0, 0);
    return _date;
  }
}
