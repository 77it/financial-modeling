// types are not needed because they are included in the file as JSDoc comments
import { DateTime } from "https://cdn.jsdelivr.net/npm/luxon@3.4.3/build/es6/luxon.js";

/**
 * @description
 * Reimplementation of lib/differenceInCalendarDaysOfLocalDates using Luxon, to test that the lib version works as the Luxon version.
 *
 * @param {Date} dateLeft - the later date
 * @param {Date} dateRight - the earlier date
 * @returns {number} the number of calendar days
 */
export function differenceInCalendarDays_luxon (
  dateLeft,
  dateRight
) {
    // see https://moment.github.io/luxon/#/tour?id=your-first-datetime
    // see https://stackoverflow.com/questions/72935751/how-to-set-luxon-datetime-to-start-of-day-reset-time + https://stackoverflow.com/a/73153752
    // strip time from dateLeft
    const startOfDayLeft = DateTime.fromJSDate(dateLeft).startOf('day');
    // strip time from dateRight
    const startOfDayRight =  DateTime.fromJSDate(dateRight).startOf('day');

    // from https://stackoverflow.com/a/63763404
    // see also https://moment.github.io/luxon/#/math?id=diffs
    //@ts-ignore
    return Math.round(startOfDayLeft.diff(startOfDayRight, 'days').toObject()?.days);
}
