export { regExp_YYYYMMDDTHHMMSSMMMZ, regExp_YYYYMMDD_minusSlashDotSep }
export { isValidDate };
export { parseJsonToLocalDate, parseJsonToUTCDate };
export { differenceInCalendarDaysOfLocalDates, differenceInCalendarDaysOfUTCDates };
export { excelSerialDateToUTCDate, excelSerialDateToLocalDate, localDateToExcelSerialDate };
export { addMonthsToLocalDate, addDaysToLocalDate, addDaysToUTCDate, getEndOfMonthOfLocalDate };
export { compareLocalDatesIgnoringTime };
export { localDateToUTC, UTCtoLocalDate, localDateToStringYYYYMMDD, stripTimeToLocalDate, stripTimeToUTCDate };

// creating RegExp for later use
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#creating_a_regular_expression
const regExp_YYYYMMDDTHHMMSSMMMZ = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?$/;
const regExp_YYYYMMDD_minusSlashDotSep = /^(\d{4})([-./])(\d{1,2})\2(\d{1,2})$/;
const regExp_YYYYMMDD_withoutSep = /^(\d{4})(\d{2})(\d{2})$/;

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

/**
 * Converts a ISO date string (the typical format for transmitting a date in JSON)
 * to a JavaScript `Date` in local time zone.
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
 * @returns {Date} the parsed date in local time zone
 */
function parseJsonToLocalDate (argument) {
  return _parseJsonDate(argument, { asUTC: false });
}

/**
 * Converts a ISO date string (the typical format for transmitting a date in JSON)
 * to a JavaScript `Date` in UTC time zone.
 * See other notes in `parseJsonToLocalDate`.
 *
 * @param {string} argument A date string to convert, fully formed ISO8601 or YYYY-MM-DD
 * @returns {Date} the parsed date in UTC time zone
*/
function parseJsonToUTCDate (argument) {
  return _parseJsonDate(argument, { asUTC: true });
}

// Inspired to https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/parseJSON/index.ts (MIT license);
// added: parse of date on 3 fields YYYY-MM-DD, trim(), updated regex expression to match start/end of the row;
// name inspired by https://www.google.com/search?q=%22parseJsonDate%22
/**
 * Private function to parse a JSON date string (local or UTC)
 *
 @private
 * @param {string} argument A date string to convert, fully formed ISO8601 or YYYY-MM-DD
 * @param {Object} [opt]
 * @param {boolean} [opt.asUTC=true] If true, the date will be parsed as UTC, otherwise as local time
 * @returns {Date} the parsed date in UTC or local time zone
 */
function _parseJsonDate (argument, opt) {
  try {
    const _asUTC = opt?.asUTC ?? true;

    if (typeof argument !== 'string')
      return new Date(NaN);

    // match YYYY-MM-DDTHH:MM:SS.MMMZ
    const parts = argument.trim().match(regExp_YYYYMMDDTHHMMSSMMMZ);
    // match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const partsYYYYMMDD = argument.trim().match(regExp_YYYYMMDD_minusSlashDotSep);
    // match YYYYMMDD without separator
    const partsYYYYMMDD_withoutSep = argument.trim().match(regExp_YYYYMMDD_withoutSep);
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
    } else if (partsYYYYMMDD) {
      // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD date
      return _newDate(
        +partsYYYYMMDD[1],
        +partsYYYYMMDD[3] - 1,
        +partsYYYYMMDD[4]
      );
    } else if (partsYYYYMMDD_withoutSep) {
      // YYYYMMDD date without separator
      return _newDate(
        +partsYYYYMMDD_withoutSep[1],
        +partsYYYYMMDD_withoutSep[2] - 1,
        +partsYYYYMMDD_withoutSep[3]
      );
    }
    return new Date(NaN);

    //#region local functions
    /**
     @private
     * @param {number} year
     * @param {number} month
     * @param {number} date
     * @param {number} [hours=0]
     * @param {number} [minutes=0]
     * @param {number} [seconds=0]
     * @param {number} [ms=0]
     * @returns {Date}
     */
    function _newDate (year, month, date, hours = 0, minutes = 0, seconds = 0, ms = 0) {
      if (_asUTC) {
        return new Date(Date.UTC(year, month, date, hours, minutes, seconds, ms));
      }
      return new Date(year, month, date, hours, minutes, seconds, ms);
    }

    //#endregion local functions
  } catch (_) {
    return new Date(NaN);
  }
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
 * @throws {Error} if dates are not valid
 *
 * @example
 * // How many calendar days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00 (leap year)?
 * const result = differenceInCalendarDaysOfLocalDates(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 366
 * // How many calendar days are between
 * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
 * const result = differenceInCalendarDaysOfLocalDates(
 *   new Date(2011, 6, 3, 0, 1),
 *   new Date(2011, 6, 2, 23, 59)
 * )
 * //=> 1
 */
function differenceInCalendarDaysOfLocalDates (dateLeft, dateRight) {
  if (!isValidDate(dateLeft))
    throw new Error(`Invalid date ${dateLeft}`);

  if (!isValidDate(dateRight))
    throw new Error(`Invalid date ${dateRight}`);

  const MILLISECONDS_IN_DAY = 86400000;

  const startOfDayLeft = startOfDayOfLocalDates(dateLeft);
  const startOfDayRight = startOfDayOfLocalDates(dateRight);

  const timestampLeft = startOfDayLeft.getTime();
  const timestampRight = startOfDayRight.getTime();

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a day is not constant
  // (e.g. it's different in the day of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);

  // inspired by https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/startOfDay/index.ts (MIT license)
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
  function startOfDayOfLocalDates (date) {
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
 * @throws {Error} if dates are not valid
 *
 * @example
 * See differenceInCalendarDaysOfLocalDates
 */
function differenceInCalendarDaysOfUTCDates (dateLeft, dateRight) {
  if (!isValidDate(dateLeft))
    throw new Error(`Invalid date ${dateLeft}`);

  if (!isValidDate(dateRight))
    throw new Error(`Invalid date ${dateRight}`);

  const MILLISECONDS_IN_DAY = 86400000;

  const startOfDayLeft = startOfDayOfUTCDates(dateLeft);
  const startOfDayRight = startOfDayOfUTCDates(dateRight);

  const timestampLeft = startOfDayLeft.getTime();
  const timestampRight = startOfDayRight.getTime();

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a day is not constant
  // (e.g. it's different in the day of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);

  // inspired by https://github.com/date-fns/date-fns/blob/5b47ccf4795ae4589ccb4465649e843c0d16fc93/src/startOfDay/index.ts (MIT license)
  /**
   * @description
   * Return the start of a day for the given date.
   * The result will be in UTC timezone.
   *
   * @param {Date} date - the original date
   * @returns {Date} the start of a day
   */
  function startOfDayOfUTCDates (date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));  // clone the UTC date without hours/min/sec
  }
}

/**
 * Convert Excel serial date (1900 date system) to UTC date.
 * `excelSerialDate` must be >= 61 = 1900-03-01 because Excel incorrectly treats 1900 as a leap year.
 * Only the integer part of the Excel serial date is considered.
 * If conversion fails, return an invalid date.
 * See https://docs.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system
 *
 * @param {number} excelSerialDate
 * @returns {Date} the converted UTC date
 */
function excelSerialDateToUTCDate (excelSerialDate) {
  try {
    if (excelSerialDate <= 60) {
      return new Date(NaN);
    }
    return new Date(Date.UTC(0, 0, excelSerialDate - 1));  // inspired by https://stackoverflow.com/a/67130235/5288052
  } catch (_) {
    return new Date(NaN);
  }
}

/**
 * Convert Excel serial date (1900 date system) to local time date.
 * `excelSerialDate` must be >= 61 = 1900-03-01 because Excel incorrectly treats 1900 as a leap year.
 * Only the integer part of the Excel serial date is considered.
 * If conversion fails, return an invalid date.
 * See https://docs.microsoft.com/en-us/office/troubleshoot/excel/1900-and-1904-date-system
 *
 * @param {number} excelSerialDate
 * @returns {Date} the converted date
 */
function excelSerialDateToLocalDate (excelSerialDate) {
  try {
    if (excelSerialDate <= 60) {
      return new Date(NaN);
    }
    return new Date(0, 0, excelSerialDate - 1);  // inspired by https://stackoverflow.com/a/67130235/5288052
  } catch (_) {
    return new Date(NaN);
  }
}

/**
 * Convert local time date to Excel serial date (1900 date system).
 * The time part of the date will be stripped before conversion.
 * If conversion fails, return an invalid number.
 *
 * @param {Date} localDate
 * @returns {number} the converted Excel serial date
 * @throws {Error} if localDate is not valid
 */
function localDateToExcelSerialDate (localDate) {
  if (!isValidDate(localDate))
    throw new Error(`Invalid date ${localDate}`);

  try {
    // because Excel incorrectly treats 1900 as a leap year, then tests that the date to convert is not less than 1900-03-01
    // see https://stackoverflow.com/a/67130235/5288052
    if (localDate < new Date(1900, 2, 1)) {
      return NaN;
    }

    // convert the date to UTC, stripping time
    const baseDateToDiffVersus = new Date(1899, 11, 30);  // 1899-12-30 is the base date for Excel serial date
    return differenceInCalendarDaysOfLocalDates(localDate, baseDateToDiffVersus);
  } catch (_) {
    return NaN;
  }
}

/**
 * Add the specified number of days to the given local time date; the time is stripped after adding the day.
 *
 * @param {Date} date - the date to add the months to
 * @param {number} amount - the amount of days to be added
 * @returns {Date} the new date with the days added
 * @throws {Error} if the date is not valid
 */
function addDaysToLocalDate(date, amount) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  if (isNaN(amount)) return new Date(date);
  if (!amount) {
    return new Date(date);
    }
  /*
  // old implementation, from https://stackoverflow.com/a/19691491/5288052   &   https://stackoverflow.com/questions/563406/add-days-to-javascript-date
  // & https://raw.githubusercontent.com/date-fns/date-fns/main/src/addDays/index.ts
  // didn't work: `addDays(new Date(1917, 3, 1), 1) !== new Date(1917, 3 , 2)`
  // but worked with: `addDays(new Date(1917, 2, 31), 2) !== new Date(1917, 3, 2)`
  // because new Date(1917, 3, 1), that is 1917-04-01, is not representable in the local time zone because the zero hour is skipped, then adding 1 to that date returns a new date with hour set to 1
  // see https://github.com/date-fns/date-fns/issues/3767#issuecomment-2053698643
  const _date = new Date(date);
  _date.setDate(_date.getDate() + amount);
  return _date;
  */
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

/**
 * Add the specified number of days to the given UTC date; the time is stripped after adding the day.
 *
 * @param {Date} date - the UTC date to add the months to
 * @param {number} amount - the amount of days to be added
 * @returns {Date} the new UTC date with the days added
 * @throws {Error} if the date is not valid
 */
function addDaysToUTCDate(date, amount) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  if (isNaN(amount)) return new Date(date);
  if (!amount) {
    return new Date(date);
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount));
}

// inspired by https://github.com/date-fns/date-fns/blob/fadbd4eb7920bf932c25f734f3949027b2fe4887/src/addMonths/index.ts (MIT license)
// + addition to handle the end of month case
/**
 * Add the specified number of months to the given local date.
 *
 * @param {Date} date - the date to add the months to
 * @param {number} amount - the amount of months to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the months added
 * @throws {Error} if the date is not valid
 *
 * @example
 * Add  5 months to 2014/09/01 => 2015/02/01
 * Add  2 months to 2014/12/31 => 2015/02/28
 * Add  2 months to 2023/12/31 => 2024/02/29  // leap year
 * 
 * Adding a month to the end-of-month date results in the end of the post-addition month.
 * Add 12 months to 2023/02/28 => 2024/02/29  // leap year
 * Add  2 months to 2024/02/29 => 2024/04/30  // leap year
 * Add  3 months to 2024/02/29 => 2024/05/31  // leap year
 * Add  2 months to 2015/02/28 => 2015/04/30
 * Add  3 months to 2015/02/28 => 2015/05/31
 */
function addMonthsToLocalDate (date, amount) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  if (isNaN(amount)) return new Date(date);
  if (!amount) {
    // If 0 months, no-op to avoid changing times in the hour before end of DST
    return new Date(date);
  }

  // The JS Date object supports date math by accepting out-of-bounds values for
  // month, day, etc. For example, new Date(2020, 0, 0) returns 31 Dec 2019 and
  // new Date(2020, 13, 1) returns 1 Feb 2021.  This is *almost* the behavior we
  // want except that dates will wrap around the end of a month, meaning that
  // new Date(2020, 13, 31) will return 3 Mar 2021 not 28 Feb 2021 as desired. So
  // we'll default to the end of the desired month by adding 1 to the desired
  // month and using a date of 0 to back up one day to the end of the desired
  // month.
  const dayOfOriginalMonth = date.getDate();
  const lastDayOfOriginalMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const isOriginalDateLastDayOfMonth = dayOfOriginalMonth === lastDayOfOriginalMonth;

  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + amount + 1, 0);
  const dayOfNewMonth = newDate.getDate();
  if (dayOfOriginalMonth >= dayOfNewMonth) {
    // If we're already at the end of the month, then this is the correct date
    // and we're done.
    return newDate;
  } else if (isOriginalDateLastDayOfMonth) {
    // If the original date was the last day of the month, then we need to set
    // the new date to the last day of the new month.
    const lastDayOfNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    newDate.setDate(lastDayOfNewMonth);
    return newDate;
  } else {
    // Otherwise, we now know that setting the original day-of-month value won't
    // cause an overflow, so set the desired day-of-month. Note that we can't
    // just set the date of `newDate` variable because that object may have had
    // its time changed in the unusual case where a DST transition was on
    // the last day of the month and its local time was in the hour skipped or
    // repeated next to a DST transition.  So we use `_date` variable instead which is
    // guaranteed to still have the original time.
    const _date = new Date(date);
    _date.setFullYear(
      newDate.getFullYear(),
      newDate.getMonth(),
      dayOfOriginalMonth
    );
    return _date;
  }
}

// inspired by https://github.com/date-fns/date-fns/blob/fadbd4eb7920bf932c25f734f3949027b2fe4887/src/addMonths/index.ts (MIT license)
/**
 * Get the end of the month of the given local time date.
 * The time part of the date will be stripped after adding the day.
 *
 * @param {Date} date - the date to get the end of the month
 * @returns {Date} the end of the month date
 * @throws {Error} if the date is not valid
 *
 * @example
 * 2014/09/01 => 2014/09/30
 * 2014/12/31 => 2014/12/31
 */
function getEndOfMonthOfLocalDate (date) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  // The JS Date object supports date math by accepting out-of-bounds values for
  // month, day, etc. For example, new Date(2020, 0, 0) returns 31 Dec 2019 and
  // new Date(2020, 13, 1) returns 1 Feb 2021.  This is *almost* the behavior we
  // want except that dates will wrap around the end of a month, meaning that
  // new Date(2020, 13, 31) will return 3 Mar 2021 not 28 Feb 2021 as desired. So
  // we'll default to the end of the desired month by adding 1 to the desired
  // month and using a date of 0 to back up one day to the end of the desired
  // month.
  const endOfDesiredMonth = stripTimeToLocalDate(date);
  endOfDesiredMonth.setMonth(date.getMonth() + 1, 0);
  return endOfDesiredMonth;
}

// inspired by https://stackoverflow.com/a/19054782 + https://stackoverflow.com/questions/492994/compare-two-dates-with-javascript
/**
 * Check if two dates are equal (ignoring time)
 *
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 * @throws {Error} if dates are not valid
 */
function compareLocalDatesIgnoringTime (date1, date2) {
  if (!isValidDate(date1))
    throw new Error(`Invalid date ${date1}`);

  if (!isValidDate(date2))
    throw new Error(`Invalid date ${date2}`);

  return date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate();
}

/**
 * Convert a date to UTC ignoring the time zone.
 * BEWARE: converting a UTC date to UTC will "damage it", because the converted date will be different from the source date
 *
 * @param {Date} date
 * @returns {Date}
 * @throws {Error} if the date is not valid
 */
function localDateToUTC (date) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
}

/**
 * Convert UTC to local date
 *
 * @param {Date} date
 * @returns {Date}
 * @throws {Error} if the date is not valid
 */
function UTCtoLocalDate (date) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
}

/**
 * Accept a string and return a string in the format YYYY-MM-DD, stripping the time part
 *
 * @param {Date} date
 * @returns {string}
 * @throws {Error} if the date is not valid
 */
function localDateToStringYYYYMMDD (date) {
  return localDateToUTC(date).toISOString().slice(0, 10);
}

/**
 * Accept a date and return a date with only the year, month and day (stripping the time part).
 * If Date == Date(0) doesn't strip the time part and return Date(0).
 *
 * @param {Date} date
 * @returns {Date}
 * @throws {Error} if the date is not valid
 */
function stripTimeToLocalDate (date) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  if (date.getTime() !== 0)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  else
    return date;
}

/**
 * Accept a UTC date and return a date with only the year, month and day (stripping the time part)
 *
 * @param {Date} date
 * @returns {Date}
 * @throws {Error} if the date is not valid
 */
function stripTimeToUTCDate (date) {
  if (!isValidDate(date))
    throw new Error(`Invalid date ${date}`);

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
