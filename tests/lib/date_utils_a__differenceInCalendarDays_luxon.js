// types are not needed because they are included in the file as JSDoc comments
import { DateTime } from "https://cdn.jsdelivr.net/npm/luxon@3.4.3/build/es6/luxon.js";

/**
 * @description
 * Reimplementation of lib/differenceInCalendarDays using Luxon, to test that the lib version works as the Luxon version.
 *
 * @param {Date} dateLeft - the later date
 * @param {Date} dateRight - the earlier date
 * @returns {number} the number of calendar days
 */
export function differenceInCalendarDays_luxon (
  dateLeft,
  dateRight
) {
    // strip time from dateLeft
    const startOfDayLeft = DateTime.fromJSDate(dateLeft).startOf('day');
    // strip time from dateRight
    const startOfDayRight =  DateTime.fromJSDate(dateRight).startOf('day');

    //@ts-ignore
    return Math.round(startOfDayLeft.diff(startOfDayRight, 'days').toObject()?.days);
}
