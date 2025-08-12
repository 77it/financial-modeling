// test with   deno --test --allow-import --allow-read

import { getMortgagePaymentsOfAConstantPaymentLoan } from '../../src/modules/_utils/loan.js';
import { UTCtoLocalDate } from '../deps.js';

// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'xlsx';
// load 'fs' for readFile and writeFile support
// from https://docs.sheetjs.com/docs/getting-started/installation/nodejs/#filesystem-operations
import * as fs from 'node:fs';
import process from 'node:process';
XLSX.set_fs(fs);
const { decode_range, encode_cell } = XLSX.utils;

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

//#region test my loan code, with comparison with `financial` library
t('test', async () => {
  const localExcelFile = './loan.asset_src.xlsx';
  const excelFileNotNormalized = new URL(localExcelFile, import.meta.url).pathname;
  const excelFile = (platformIsWindows() && excelFileNotNormalized.startsWith('/')) ? excelFileNotNormalized.slice(1) : excelFileNotNormalized;

  // read the Workbook
  // https://docs.sheetjs.com/docs/csf/sheet/#dense-mode
  const wb = XLSX.readFile(excelFile, { dense: false, cellDates: true });

  _processWorkbookRC(wb);
});

//#region private functions

// Example callback
/** TestX function
 * @param {string} sheetName - Name of the sheet being processed
 * @param {object} settings
 * @param {Date} settings.startDate
 * @param {number} settings.startingPrincipal
 * @param {number} settings.annualInterestRate
 * @param {number} settings.numberOfPaymentsInAYear
 * @param {number} settings.nrOfPaymentsIncludingGracePeriod
 * @param {number} settings.gracePeriodNrOfPayments
 * @param {object} excelPlan
 * @param {Date[]} excelPlan.dates - Array of dates from column B
 * @param {number[]} excelPlan.interestPayments - Array of numbers from column C
 * @param {number[]} excelPlan.principalPayments - Array of numbers from column D
 */
function TestX(
  sheetName,
  { startDate, startingPrincipal, annualInterestRate, numberOfPaymentsInAYear, nrOfPaymentsIncludingGracePeriod, gracePeriodNrOfPayments },
  { dates, interestPayments, principalPayments }
) {
  // check that excelPlan arrays have the same length
  assert.strictEqual(dates.length, interestPayments.length, `Dates and interest payments length mismatch in sheet ${sheetName}`);
  assert.strictEqual(dates.length, principalPayments.length, `Dates and principal payments length mismatch in sheet ${sheetName}`);

  // loop dates array and apply the method UTCtoLocalDate to all dates
  for (let i = 0; i < dates.length; i++) {
    // Convert UTC date to local date
    dates[i] = UTCtoLocalDate(dates[i]);
  }

  /** @type {{date: Date[], paymentNo: number[], interestPayment: number[], principalPayment: number[], totalMortgageRemaining: number[]}} */
  const jsPlan = getMortgagePaymentsOfAConstantPaymentLoan({
    startDate,
    startingPrincipal,
    annualInterestRate,
    numberOfPaymentsInAYear,
    nrOfPaymentsIncludingGracePeriod,
    gracePeriodNrOfPayments
  });

  // loop through the dates and compare with the Excel data
  for (let i = 0; i < dates.length; i++) {
    // Compare with the JS plan
    assert.deepStrictEqual(dates[i].getTime(), jsPlan.date[i].getTime(), `Date mismatch at index ${i} in sheet ${sheetName}, expected ${jsPlan.date[i]} but got ${dates[i]}`);
    assert.strictEqual(interestPayments[i], jsPlan.interestPayment[i], `Interest payment mismatch at index ${i} in sheet ${sheetName}, expected ${jsPlan.interestPayment[i]} but got ${interestPayments[i]}`);
    assert.strictEqual(principalPayments[i], jsPlan.principalPayment[i], `Principal payment mismatch at index ${i} in sheet ${sheetName}, expected ${jsPlan.principalPayment[i]} but got ${principalPayments[i]}`);
  }
}

/** function _processWorkbookRC
 @private
 * Process the workbook and read the data in RC format
 * @param {*} wb
 */
function _processWorkbookRC(wb) {
  const date1904 = !!(wb.Workbook?.WBProps?.date1904);

  wb.SheetNames.forEach((/** @type {string} */ sheetName ) => {
    const ws = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws['!ref']);

    // A1, B1, C1  (row 0, col 0..2)
    const startDate = getCellValue(ws, "B1");
    const startingPrincipal = getCellValue(ws, "B2");
    const annualInterestRate = getCellValue(ws, "B3");
    const numberOfPaymentsInAYear = getCellValue(ws, "B5");
    const nrOfPaymentsIncludingGracePeriod = getCellValue(ws, "B6");
    const gracePeriodNrOfPayments = getCellValue(ws, "B7");

    // From row 10
    const { dates, interestPayments, principalPayments } = readColumnsBDC(ws, 9, date1904, range.e.r);

    TestX(
      sheetName,
      {startDate, startingPrincipal, annualInterestRate, numberOfPaymentsInAYear, nrOfPaymentsIncludingGracePeriod, gracePeriodNrOfPayments },
      { dates, interestPayments, principalPayments }
    );
  });
}

/**
 * Retrieves the value of a cell in a worksheet using row and column indices.
 *
 * @param {*} ws - The worksheet object from which the cell value is retrieved.
 * @param {number} r - The row index of the cell (0-based).
 * @param {number} c - The column index of the cell (0-based).
 * @returns {*} - The value of the cell, or `undefined` if the cell does not exist.
 */
function getCellValueRC(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = ws[addr];
  return cell ? cell.v : undefined;
}

/** function getCellValue
 * Get the value of a cell in a worksheet by its address.
 * @param {*} ws
 * @param {string} cellAddress
 * @returns {*|undefined}
 */
function getCellValue(ws, cellAddress) {
  return ws[cellAddress]?.v;
}

/**
 * Reads columns B, C, and D from the given worksheet starting from a specific row.
 * Extracts dates from column B, numbers from column C and D.
 *
 * @param {*} ws - The worksheet object from which data is read.
 * @param {number} startRow - The row index to start reading from (0-based).
 * @param {boolean} date1904 - Indicates if the workbook uses the 1904 date system.
 * @param {number} lastRow - The last row index to read (0-based).
 * @returns {{ dates: Date[], interestPayments: number[], principalPayments: number[]}} - An object containing arrays of dates, column B values, and column C values.
 */
function readColumnsBDC(ws, startRow, date1904, lastRow) {
  const dates = [];
  const interestPayments  = [];
  const principalPayments  = [];

  for (let r = startRow; r <= lastRow; r++) {
    const date = ws[XLSX.utils.encode_cell({ r, c: 1 })];
    const principalPayment = ws[XLSX.utils.encode_cell({ r, c: 2 })];
    const interestPayment = ws[XLSX.utils.encode_cell({ r, c: 3 })];

    const isEmpty = [date, interestPayment, principalPayment].every((c) =>
      c == null || c.v == null || (typeof c.v === "string" && c.v.trim() === "")
    );
    if (isEmpty) break;

    dates.push(parseExcelDate(date, date1904));
    interestPayments.push(parseExcelNumber(interestPayment));
    principalPayments.push(parseExcelNumber(principalPayment));
  }

  return { dates, interestPayments, principalPayments };
}

/**
 * Parses an Excel cell value into a JavaScript `Date` object.
 *
 * @param {*} cell - The Excel cell object to parse.
 * @param {boolean} date1904 - Indicates if the workbook uses the 1904 date system.
 * @returns {Date} - A `Date` object if the cell contains a valid date, otherwise `null`.
 */
function parseExcelDate(cell, date1904) {
  if (!cell || cell.v == null) throw new Error("Invalid cell value for date parsing");
  if (cell.t === "d") return cell.v instanceof Date ? cell.v : new Date(cell.v);
  if (cell.t === "n") {
    const serial = Number(cell.v) + (date1904 ? 1462 : 0);
    const p = XLSX.SSF.parse_date_code(serial);
    if (!p) throw new Error(`Invalid date serial: ${cell.v}`);
    return new Date(p.y, (p.m || 1) - 1, p.d || 1, p.H || 0, p.M || 0, Math.floor(p.S || 0));
  }
  return new Date(String(cell.v));
}

/** function parseExcelNumber
 * Parse an Excel cell value to a number
 * @param {*} cell
 * @returns {number}
 */
function parseExcelNumber(cell) {
  if (!cell || cell.v == null) throw new Error("Invalid cell value for number parsing");
  if (cell.t === "n") return Number(cell.v);
  const text = (cell.w != null ? String(cell.w) : String(cell.v)).trim();
  if (!text) throw new Error("Empty cell value cannot be parsed to a number");
  const normalized = text.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  return Number(normalized);
}

/** function platformIsWindows
 * Check if the current platform is Windows
 * @returns {boolean} - true if Windows, false otherwise
 */
function platformIsWindows () {
  // see https://deno.land/std@0.171.0/node/process.ts?s=platform
  // see also https://nodejs.org/api/process.html#process_process_platform
  //const platforms = ['aix', 'android', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32'];
  return (process.platform === 'win32');
}
//#endregion private functions