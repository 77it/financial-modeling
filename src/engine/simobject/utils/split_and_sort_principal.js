export { splitAndSortPrincipal };

import { toBigInt } from './to_bigint.js';
import { sortValuesAndDatesByDate } from '../../../lib/obj_utils.js';

/**
 * This function is used to split a principal value in indefinite and amortization schedule values
 * distributing it proportionally across the amortization schedule if needed.
 *
 * Values can be positive or negative, and the function will handle them accordingly.
 *
 * Steps:
 * 1. Convert input values to BigInt.
 * 2. If the sum of the indefinite expiry date principal and the amortization schedule principal equals the total value, return values.
 * 3. If the indefinite expiry date principal is zero and the amortization schedule is empty, set the indefinite expiry date principal to the total value.
 * 4a. If the amortization schedule is not empty and the values do not match, calculate the residual value and distribute it proportionally across the amortization schedule.
 * 4b. If the sum of the amortization schedule is not equal to the value to split, add the difference to the last value of the amortization schedule.
 * 5. Sorts principal array and dates array together by the dates in ascending order.
 *
 * @param {Object} p
 * @param {number} p.value - principal value to split
 * @param {number} p.financialSchedule__amountWithoutScheduledDate
 * @param {number[]} p.financialSchedule__scheduledAmounts
 * @param {Date[]} p.financialSchedule__scheduledDates Array used to sort the amortization schedule
 * @param {Object} opt
 * @param {number} opt.decimalPlaces
 * @param {boolean} opt.roundingModeIsRound
 * @returns {{principalIndefiniteExpiryDate: bigint, principalAmortizationSchedule: bigint[], principalAmortizationDates: Date[]}}
 */
function splitAndSortPrincipal (
  /* p */ {value, financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates },
  /* opt */{decimalPlaces, roundingModeIsRound}
) {
  const _value = toBigInt(value, decimalPlaces, roundingModeIsRound);
  let principalIndefiniteExpiryDate = toBigInt(financialSchedule__amountWithoutScheduledDate, decimalPlaces, roundingModeIsRound);
  const unsorted_principalAmortizationSchedule = financialSchedule__scheduledAmounts.map((number) => toBigInt(number, decimalPlaces, roundingModeIsRound));

  // sort values and dates, by date
  const {sortedValues: principalAmortizationSchedule, sortedDates: principalAmortizationDates} = sortValuesAndDatesByDate({
    values: unsorted_principalAmortizationSchedule,
    dates: financialSchedule__scheduledDates
  });

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

  return {
    principalIndefiniteExpiryDate: principalIndefiniteExpiryDate,
    principalAmortizationSchedule: principalAmortizationSchedule,
    principalAmortizationDates: principalAmortizationDates
  };
}
