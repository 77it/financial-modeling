export {
  simObjectToDto,
  simObjectToJsonDumpDto,
  splitPrincipal,
  toBigInt,
  bigIntToNumberWithDecimals,
  bigIntToStringWithDecimals
};

import { SimObject } from '../simobject.js';
import { SimObjectDto } from '../simobjectdto.js';
import { SimObjectJsonDumpDto } from '../simobjectjsondumpdto.js';
import { deepFreeze } from '../../../lib/obj_utils.js';

/**
 * Convert the SimObject to a SimObjectDto
 * @param {SimObject} simObject
 * @returns {SimObjectDto}
 */
function simObjectToDto (simObject) {
  return deepFreeze(new SimObjectDto({
    type: simObject.type,
    id: simObject.id,
    dateTime: simObject.dateTime,
    name: simObject.name,
    description: simObject.description,
    mutableDescription: simObject.mutableDescription,
    metadata__Name: [...simObject.metadata__Name],
    metadata__Value: [...simObject.metadata__Value],
    metadata__PercentageWeight: [...simObject.metadata__PercentageWeight],
    unitId: simObject.unitId,
    doubleEntrySide: simObject.doubleEntrySide,
    currency: simObject.currency,
    intercompanyInfo__VsUnitId: simObject.intercompanyInfo__VsUnitId,
    value: bigIntToNumberWithDecimals(simObject.value, simObject.decimalPlaces),
    writingValue: bigIntToNumberWithDecimals(simObject.writingValue, simObject.decimalPlaces),
    alive: simObject.alive,
    command__Id: simObject.command__Id,
    command__DebugDescription: simObject.command__DebugDescription,
    commandGroup__Id: simObject.commandGroup__Id,
    commandGroup__DebugDescription: simObject.commandGroup__DebugDescription,
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: bigIntToNumberWithDecimals(simObject.bs_Principal__PrincipalToPay_IndefiniteExpiryDate, simObject.decimalPlaces),
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: [...simObject.bs_Principal__PrincipalToPay_AmortizationSchedule__Date],
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: simObject.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.map((big) => bigIntToNumberWithDecimals(big, simObject.decimalPlaces)),
    is_Link__SimObjId: simObject.is_Link__SimObjId,
    vsSimObjectName: simObject.vsSimObjectName,
    versionId: simObject.versionId,
    extras: _structuredCloneOrClone(simObject.extras),
  }));
}

/**
 * Convert the SimObject to a SimObjectJsonDumpDto
 * @param {SimObject} simObject
 * @returns {SimObjectJsonDumpDto}
 */
function simObjectToJsonDumpDto (simObject) {
  return deepFreeze(new SimObjectJsonDumpDto({
    type: simObject.type,
    id: simObject.id,
    date: _dateToISOString(simObject.dateTime),
    name: simObject.name,
    description: simObject.description,
    mutableDescription: simObject.mutableDescription,
    metadata__Name: [...simObject.metadata__Name],
    metadata__Value: [...simObject.metadata__Value],
    metadata__PercentageWeight: [...simObject.metadata__PercentageWeight],
    unitId: simObject.unitId,
    doubleEntrySide: simObject.doubleEntrySide,
    currency: simObject.currency,
    intercompanyInfo__VsUnitId: simObject.intercompanyInfo__VsUnitId,
    value: bigIntToStringWithDecimals(simObject.value, simObject.decimalPlaces),
    writingValue: bigIntToStringWithDecimals(simObject.writingValue, simObject.decimalPlaces),
    alive: simObject.alive,
    command__Id: simObject.command__Id,
    command__DebugDescription: simObject.command__DebugDescription,
    commandGroup__Id: simObject.commandGroup__Id,
    commandGroup__DebugDescription: simObject.commandGroup__DebugDescription,
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: bigIntToStringWithDecimals(simObject.bs_Principal__PrincipalToPay_IndefiniteExpiryDate, simObject.decimalPlaces),
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: simObject.bs_Principal__PrincipalToPay_AmortizationSchedule__Date.map((date) => _dateToISOString(date)),
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: simObject.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.map((big) => bigIntToStringWithDecimals(big, simObject.decimalPlaces)),
    is_Link__SimObjId: simObject.is_Link__SimObjId,
  }));
}

/**
 * This function is used to split a principal value in indefinite and amortization schedule values.
 * @param {Object} p
 * @param {number} p.value - principal value to split
 * @param {number} p.bs_Principal__PrincipalToPay_IndefiniteExpiryDate
 * @param {number[]} p.bs_Principal__PrincipalToPay_AmortizationSchedule__Principal
 * @param {Object} opt
 * @param {number} opt.decimalPlaces
 * @param {boolean} opt.roundingModeIsRound
 * @returns {{principalIndefiniteExpiryDate: bigint, principalAmortizationSchedule: bigint[]}}
 */
function splitPrincipal (
  /* p */ {value, bs_Principal__PrincipalToPay_IndefiniteExpiryDate, bs_Principal__PrincipalToPay_AmortizationSchedule__Principal },
  /* opt */{decimalPlaces, roundingModeIsRound}
) {
  const _value = toBigInt(value, decimalPlaces, roundingModeIsRound);
  const principalAmortizationSchedule = bs_Principal__PrincipalToPay_AmortizationSchedule__Principal.map((number) => toBigInt(number, decimalPlaces, roundingModeIsRound));
  let principalIndefiniteExpiryDate = toBigInt(bs_Principal__PrincipalToPay_IndefiniteExpiryDate, decimalPlaces, roundingModeIsRound);
  if (_value === principalIndefiniteExpiryDate + principalAmortizationSchedule.reduce((a, b) => a + b, 0n)) {
    // if `principalIndefiniteExpiryDate` + `principalAmortizationSchedule` is equal to `_value`, do nothing
  } else if (principalIndefiniteExpiryDate === 0n && principalAmortizationSchedule.length === 0) {
    // if `principalIndefiniteExpiryDate` == 0 and there is no `principalAmortizationSchedule` specified, set all value amount as 'principalIndefiniteExpiryDate'
    principalIndefiniteExpiryDate = _value;
  } else if (principalAmortizationSchedule.length > 0) {
    // if we reach this point, it means that `principal*` IS NOT equal to `_value` and `principalAmortizationSchedule` IS NOT empty.
    // then, we split the residual value from the subtraction of `_value` by `principalIndefiniteExpiryDate` to a new `principalAmortizationSchedule`
    const _valueToSplit = _value - principalIndefiniteExpiryDate;
    // sum `principalAmortizationSchedule` values
    const _principalAmortizationScheduleSum = principalAmortizationSchedule.reduce((a, b) => a + b, 0n);
    // loop `principalAmortizationSchedule` and do a weighted split of the sum
    for (let i = 0; i < principalAmortizationSchedule.length; i++) {
      principalAmortizationSchedule[i] = _valueToSplit * principalAmortizationSchedule[i] / _principalAmortizationScheduleSum;
    }
    // sum again `principalAmortizationSchedule` values
    const _principalAmortizationScheduleSum2 = principalAmortizationSchedule.reduce((a, b) => a + b, 0n);
    // if the sum is not equal to `_valueToSplit`, add the difference to the last value of `principalAmortizationSchedule`
    if (_principalAmortizationScheduleSum2 !== _valueToSplit) {
      principalAmortizationSchedule[principalAmortizationSchedule.length - 1] += _valueToSplit - _principalAmortizationScheduleSum2;
    }
  }

  return { principalIndefiniteExpiryDate, principalAmortizationSchedule };
}

/**
 * This function is used to convert a number to a BigInt, preserving a given number of decimal places and rounding/truncating the rest.
 * If `#roundingModeIsRound` is true, the number is rounded as Excel does ("Round half away from zero") to the given number of decimal places.
 * If `#roundingModeIsRound` false, the number is truncated to the given number of decimal places.
 * @param {number} n - number to convert
 * @param {number} decimalPlaces
 * @param {boolean} roundingModeIsRound
 * @returns {bigint}
 */
function toBigInt (n, decimalPlaces, roundingModeIsRound) {
  const integer = _moveTheDecimalPointToTheRight(n, decimalPlaces);
  if (roundingModeIsRound) {
    const rounded = _roundHalfAwayFromZero(integer);
    return BigInt(rounded);
  }
  else {
    const truncated = Math.trunc(integer);
    return BigInt(truncated);
  }
}

/**
 * Convert Big to number, converting to a number with a fixed number of decimal places.
 * We don't need to manipulate the number string because integer are well represented as floating point numbers
 * then dividing by 10 ** decimalPlaces won't cause loss of precision.
 * @param {bigint} big
 * @param {number} decimalPlaces
 * @returns {number}
 */
function bigIntToNumberWithDecimals (big, decimalPlaces) {
  return Number(big) / (10 ** decimalPlaces);
}

/** Convert Big to string, converting to a number with a fixed number of decimal places
 * @param {bigint} big
 * @param {number} decimalPlaces
 * @returns {string}
 */
function bigIntToStringWithDecimals (big, decimalPlaces) {
  // convert big to string, padding the string with zeros to the left to reach the desired number of decimal places + 1
  // example #1: decimalPlaces = 2, big = 123, padding = '123'
  // example #2: decimalPlaces = 4, big = 123, padding = '00123'
  const _str = big.toString().padStart(decimalPlaces + 1, '0');
  // insert a string on the right of str, on the `#decimalPlaces`th character from the right
  return _str.slice(0, -decimalPlaces) + '.' + _str.slice(-decimalPlaces);
}

//#region private functions

/**
 @private
 * Try to clone the extras object using the clone() method; if the clone method is not defined, try cloning with structuredClone; cloning fails, an evalueeption is raised
 * @param {*} obj
 * @returns {*}
 * @throws {Error} if clone() or structuredClone() fails
 */
function _structuredCloneOrClone (obj) {
  if (obj?.clone)
    return obj.clone();
  else
    return structuredClone(obj);
}

/** Convert date to ISO string with the current time zone as if it were UTC, stripping time
 @private
 * @param {Date} date
 * @returns {string}
 */
function _dateToISOString (date) {
  // build a UTC date with parts of the date, then convert to ISO string
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

/** Move the decimal point to the right by `decimalPlaces` positions (manipulating the number string to prevent loss of precision)
 * Without this function, 10.075 * 10 ** 2 = 1007.4999999999999
 @private
 * @param {number} n - The number to convert
 * @param {number} dp - The number of decimal places
 * @returns {number}
 */
function _moveTheDecimalPointToTheRight(n, dp) {
  // Convert the number to a string and split it into integer and fractional parts
  const [integerPart, fractionalPart = ''] = n.toString().split('.');

  // Pad the fractional part with zeros to ensure it has at least `dp` digits
  const paddedFractionalPart = fractionalPart.padEnd(dp, '0');

  // Concatenate the integer part and the padded fractional part, moving the decimal point to the right by `dp` positions
  const resultString = integerPart + paddedFractionalPart.slice(0, dp) + '.' + paddedFractionalPart.slice(dp);

  // Convert the resulting string back to a number and return it
  return parseFloat(resultString);
}

/** Round n as Excel does ("Round half away from zero").
 * In Excel
 *    1.4 >  1    1.5 >  2    2.4 >  2     2.5 >  3
 *   -1.4 > -1   -1.5 > -2   -2.4 > -2    -2.5 > -3
 @private
 * @param {number} n - The number to round.
 * @returns {number}
 */
function _roundHalfAwayFromZero(n) {
  const sign = Math.sign(n);
  return sign * Math.round(Math.abs(n));
}
//#endregion private functions