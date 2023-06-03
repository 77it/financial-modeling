export { isValidDate };
export { parseJsonDate };
export { differenceInCalendarDays, differenceInUTCCalendarDays };
export { excelSerialDateToUTCDate, excelSerialDateToDate };
export { addMonths };
export { areDatesEqual };
export { toUTC, toStringYYYYMMDD, stripTime };

/**
 * Check whether the date is valid
 * @param {*} value
 * @returns {boolean}
 */
// see from https://stackoverflow.com/a/44198641/5288052 + https://stackoverflow.com/questions/643782/how-to-check-whether-an-object-is-a-date
function isValidDate (value) {
  if (value instanceof Date) {
    return !(isNaN(value.getTime()));
  }
  return false;  // is not a date
}

// inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/parseJSON/index.ts (MIT license);
// added: parse of date on 3 fields YYYY-MM-DD, trim(), updated regex expression to match start/end of the row.
// name inspired to https://www.google.com/search?q=%22parseJsonDate%22
/**
 * @name parseJsonDate
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
 * Furthermore, are supported:
 * - `2000-03-15`
 * - `2000/03/15`
 * - `2000.03.15`
 * Any other input type or invalid date strings will return an `Invalid Date`.
 *
 * @param {string} argument A date string to convert, fully formed ISO8601 or YYYY-MM-DD
 * @param {Object} [opt]
 * @param {boolean} [opt.asUTC=true] If true, the date will be parsed as UTC, otherwise as local time
 * @returns {Date} the parsed date in the local time zone
 */
function parseJsonDate (argument, opt) {
  const _asUTC = opt?.asUTC ?? true;

  // match YYYY-MM-DDTHH:MM:SS.MMMZ
  const parts = argument.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?$/
  );
  // match YYYY-MM-DD
  const partsYYYYMMDD_minus = argument.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );
  // match YYYY/MM/DD
  const partsYYYYMMDD_slash = argument.trim().match(
    /^(\d{4})\/(\d{2})\/(\d{2})$/
  );
  // match YYYY.MM.DD
  const partsYYYYMMDD_dot = argument.trim().match(
    /^(\d{4})\.(\d{2})\.(\d{2})$/
  );
  if (parts) {
    // Group 8 matches the sign
    return _newDate(
      +parts[1],
      +parts[2] - 1,
      +parts[3],
      +parts[4] - (+parts[9] || 0) * (parts[8] === '-' ? -1 : 1),
      +parts[5] - (+parts[10] || 0) * (parts[8] === '-' ? -1 : 1),
      +parts[6],
      +((parts[7] || '0') + '00').substring(0, 3)
    );
  } else if (partsYYYYMMDD_minus) {
    // YYYY-MM-DD date
    return _newDate(
      +partsYYYYMMDD_minus[1],
      +partsYYYYMMDD_minus[2] - 1,
      +partsYYYYMMDD_minus[3]
    );
  } else if (partsYYYYMMDD_slash) {
    // YYYY/MM/DD date
    return _newDate(
      +partsYYYYMMDD_slash[1],
      +partsYYYYMMDD_slash[2] - 1,
      +partsYYYYMMDD_slash[3]
    );
  } else if (partsYYYYMMDD_dot) {
    // YYYY.MM.DD date
    return _newDate(
      +partsYYYYMMDD_dot[1],
      +partsYYYYMMDD_dot[2] - 1,
      +partsYYYYMMDD_dot[3]
    );
  }
  return new Date(NaN);

  //#region local functions
  /**
   * @param {number} year
   * @param {number} month
   * @param {number} date
   * @param {number} [hours=0]
   * @param {number} [minutes=0]
   * @param {number} [seconds=0]
   * @param {number} [ms=0]
   * @returns {Date}
   * @private
   */
  function _newDate (year, month, date, hours = 0, minutes = 0, seconds = 0, ms = 0) {
    if (_asUTC) {
      return new Date(Date.UTC(year, month, date, hours, minutes, seconds, ms));
    }
    return new Date(year, month, date, hours, minutes, seconds, ms);
  }

  //#endregion local functions
}

// Inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/differenceInCalendarDays/index.ts (MIT license)
// & https://stackoverflow.com/a/15289883/5288052 + https://stackoverflow.com/questions/3224834/get-difference-between-2-dates-in-javascript
// see also
// https://www.geeksforgeeks.org/how-to-calculate-the-number-of-days-between-two-dates-in-javascript/
// https://stackoverflow.com/questions/18347050/calculate-the-number-of-days-in-range-picker-javascript
/**
 * @description
 * Get the number of days between the given dates. This means that the times are removed
 * from the dates and then the difference in days is calculated.
 *
 * @param {Date} dateLeft - the later date
 * @param {Date} dateRight - the earlier date
 * @returns {number} the number of calendar days
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
function differenceInCalendarDays (
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

/**
 * @description
 * Get the number of days between the given UTC dates. This means that the times are removed
 * from the dates and then the difference in days is calculated.
 *
 * @param {Date} dateLeft - the later date
 * @param {Date} dateRight - the earlier date
 * @returns {number} the number of calendar days
 *
 * @example
 * See differenceInCalendarDays
 */
function differenceInUTCCalendarDays (
  dateLeft,
  dateRight,
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
   * The result will be in UTC timezone.
   *
   * @param {Date} date - the original date
   * @returns {Date} the start of a day
   */
  function startOfDay (date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));  // clone the UTC date without hours/min/sec
  }
}

/**
 * @description
 * Convert Excel serial date (1900 date system) to UTC date.
 * If conversion fails, return an invalid date.
 * See https://docs.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system
 *
 * @param {number} excelSerialDate
 * @returns {Date} the converted UTC date
 */
function excelSerialDateToUTCDate (excelSerialDate) {
  try {
    return new Date(Date.UTC(0, 0, excelSerialDate - 1));  // See https://stackoverflow.com/a/67130235/5288052
  } catch (_) {
    return new Date(NaN);
  }
}

/**
 * @description
 * Convert Excel serial date (1900 date system) to date.
 * If conversion fails, return an invalid date.
 * See https://docs.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system
 *
 * @param {number} excelSerialDate
 * @returns {Date} the converted date
 */
function excelSerialDateToDate (excelSerialDate) {
  try {
    return new Date(0, 0, excelSerialDate - 1);  // See https://stackoverflow.com/a/67130235/5288052
  } catch (_) {
    return new Date(NaN);
  }
}

// inspired to https://github.com/date-fns/date-fns/blob/fadbd4eb7920bf932c25f734f3949027b2fe4887/src/addMonths/index.ts
/**
 * @name addMonths
 * @category Month Helpers
 * @summary Add the specified number of months to the given date.
 *
 * @description
 * Add the specified number of months to the given date.
 *
 * @param {Date} date - the date to be changed
 * @param {number} amount - the amount of months to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the months added
 *
 * @example
 * Add 5 months to 2014/09/01 => 2015/02/01
 * Add 2 months to 2014/12/31 => 2015/02/28
 * Add 2 months to 2023/12/31 => 2024/02/29  // leap year
 */
function addMonths (
  date,
  amount) {
  const _date = new Date(date);
  if (isNaN(amount)) return new Date(date);
  if (!amount) {
    // If 0 months, no-op to avoid changing times in the hour before end of DST
    return new Date(date);
  }
  const dayOfMonth = _date.getDate();

  // The JS Date object supports date math by accepting out-of-bounds values for
  // month, day, etc. For example, new Date(2020, 0, 0) returns 31 Dec 2019 and
  // new Date(2020, 13, 1) returns 1 Feb 2021.  This is *almost* the behavior we
  // want except that dates will wrap around the end of a month, meaning that
  // new Date(2020, 13, 31) will return 3 Mar 2021 not 28 Feb 2021 as desired. So
  // we'll default to the end of the desired month by adding 1 to the desired
  // month and using a date of 0 to back up one day to the end of the desired
  // month.
  const endOfDesiredMonth = new Date(_date);
  endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
  const daysInMonth = endOfDesiredMonth.getDate();
  if (dayOfMonth >= daysInMonth) {
    // If we're already at the end of the month, then this is the correct date
    // and we're done.
    return endOfDesiredMonth;
  } else {
    // Otherwise, we now know that setting the original day-of-month value won't
    // cause an overflow, so set the desired day-of-month. Note that we can't
    // just set the date of `endOfDesiredMonth` because that object may have had
    // its time changed in the unusual case where where a DST transition was on
    // the last day of the month and its local time was in the hour skipped or
    // repeated next to a DST transition.  So we use `date` instead which is
    // guaranteed to still have the original time.
    _date.setFullYear(
      endOfDesiredMonth.getFullYear(),
      endOfDesiredMonth.getMonth(),
      dayOfMonth
    );
    return _date;
  }
}

// inspired to https://stackoverflow.com/a/19054782 + https://stackoverflow.com/questions/492994/compare-two-dates-with-javascript
/**
 * Function that accept two dates and check if the dates are equal (ignoring time)
 *
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
function areDatesEqual (date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

/**
 * Function that convert a date to UTC
 *
 * @param {Date} date
 * @returns {Date}
 */
function toUTC (date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
}

/**
 * Function that accept a string and return a string in the format YYYY-MM-DD, stripping the time part
 *
 * @param {Date} date
 * @returns {string}
 * @throws {Error} if the date is not valid
 */
function toStringYYYYMMDD (date) {
  return toUTC(date).toISOString().slice(0, 10);
}

/**
 * Function that accept a date and return a date with only the year, month and day (stripping the time part)
 *
 * @param {Date} date
 * @returns {Date}
 */
function stripTime (date) {
  if (isValidDate(date))
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  else
    return date;
}
