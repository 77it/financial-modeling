import {
  isValidDate,
  addDaysToLocalDate, addDaysToUTCDate,
  excelSerialDateToUTCDate,
  excelSerialDateToLocalDate,
  localDateToExcelSerialDate,
  localDateToStringYYYYMMDD
} from '../../src/lib/date_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;

t('excelSerialDateToLocalDate from 1900 to 2100', () => {
  // test that serial date can't be less than 61
  assert(!isValidDate(excelSerialDateToLocalDate(60)));

  // test first value of the loop
  assert.deepStrictEqual(excelSerialDateToLocalDate(61), new Date(1900, 2 /*Mar*/, 1));

  // test last value of the loop
  assert.deepStrictEqual(excelSerialDateToLocalDate(73415), new Date(2100, 11 /*Dec*/, 31));

  // loop from 61 to 73415 and check if result of `excelSerialDateToLocalDate()` are from 1900/03/01 to 2100/12/31
  //
  // test dates from number 61 = 1900-03-01, because Excel incorrectly treats 1900 as a leap year;
  // see https://stackoverflow.com/a/67130235/5288052
  let currentDate = new Date(1900, 1 /*Feb*/, 28, 0, 0, 0);
  for (let i = 61; i <= 73415; i++) {
    currentDate = addDaysToLocalDate(currentDate, 1);
    if (excelSerialDateToLocalDate(i).getTime() !== currentDate.getTime()) {
      console.log(i);
      console.log(`excelSerialDateToLocalDate(${i}): `, excelSerialDateToLocalDate(i));
      console.log(`currentDate: `, currentDate);
      assert(false);
    }
  }
  // test last value of the loop
  assert.deepStrictEqual(currentDate.getTime(), new Date(2100, 11 /*Dec*/, 31).getTime());
});

t('excelSerialDateToUTCDate from 1900 to 2100', () => {
  // test that serial date can't be less than 61
  assert(!isValidDate(excelSerialDateToUTCDate(60)));

  // test first value of the loop
  assert.deepStrictEqual(excelSerialDateToUTCDate(61), new Date(Date.UTC(1900, 2 /*Mar*/, 1)));

  // test last value of the loop
  assert.deepStrictEqual(excelSerialDateToUTCDate(73415), new Date(Date.UTC(2100, 11 /*Dec*/, 31)));

  // loop from 61 to 73415 and check if result of `excelSerialDateToLocalDate()` are from 1900/03/01 to 2100/12/31
  //
  // test dates from number 61 = 1900-03-01, because Excel incorrectly treats 1900 as a leap year;
  // see https://stackoverflow.com/a/67130235/5288052
  let currentDateUTC = new Date(Date.UTC(1900, 1 /*Feb*/, 28, 0, 0, 0));
  for (let i = 61; i <= 73415; i++) {
    currentDateUTC = addDaysToUTCDate(currentDateUTC, 1);
    if (excelSerialDateToUTCDate(i).getTime() !== currentDateUTC.getTime()) {
      console.log(i);
      console.log(`excelSerialDateToUTCDate(${i}): `, excelSerialDateToUTCDate(i));
      console.log(`currentDateUTC: `, currentDateUTC);
      assert(false);
    }
  }
  // test last value of the loop
  assert.deepStrictEqual(currentDateUTC.getTime(), new Date(Date.UTC(2100, 11 /*Dec*/, 31)).getTime());
});

t('localDateToExcelSerialDate', () => {
  // test that conversion fails with dates less than 1900-03-01
  assert.deepStrictEqual(NaN, localDateToExcelSerialDate(new Date(1900, 1 /*Feb*/, 28)));

  // test that conversion succeeds with dates greater than or equal to 1900-03-01
  assert.deepStrictEqual(61, localDateToExcelSerialDate(new Date(1900, 2 /*Mar*/, 1)));
  assert.deepStrictEqual(62, localDateToExcelSerialDate(new Date(1900, 2 /*Mar*/, 2)));

  // loop from 61 to 73415 and check if result of `localDateToExcelSerialDate()` are from 1900/03/01 to 2100/12/31
  //
  // test dates from number 61 = 1900-03-01, because Excel incorrectly treats 1900 as a leap year;
  // see https://stackoverflow.com/a/67130235/5288052
  let currentDate = new Date(1900, 1 /*Feb*/, 28, 0, 0, 0);
  for (let i = 61; i <= 73415; i++) {
    currentDate = addDaysToLocalDate(currentDate, 1);
    if (localDateToExcelSerialDate(currentDate) !== i) {
      console.log(`localDateToExcelSerialDate(${localDateToStringYYYYMMDD(currentDate)}): `, localDateToExcelSerialDate(currentDate));
      console.log(`serialDate: `, i);
      assert(false);
    }
  }
  // test last date of the loop
  assert.deepStrictEqual(currentDate, new Date(2100, 11 /*Dec*/, 31));
});
