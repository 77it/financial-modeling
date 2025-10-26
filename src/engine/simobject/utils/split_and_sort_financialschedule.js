export { splitAndSortFinancialScheduleDSB };

import { ensureBigIntScaled, fxAdd, fxSub, fxMul, fxDiv } from '../../../lib/bigint_decimal_scaled.arithmetic_x.js';
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
 * @param {string|number|bigint} p.value - principal value to split
 * @param {string|number|bigint} p.financialSchedule__amountWithoutScheduledDate
 * @param {string[]|number[]|bigint[]} p.financialSchedule__scheduledAmounts
 * @param {Date[]} p.financialSchedule__scheduledDates Array used to sort the amortization schedule
 * @returns {{financialSchedule__amountWithoutScheduledDate: bigint, financialSchedule__scheduledAmounts: bigint[], financialSchedule__scheduledDates: Date[]}}
 * @throws {Error} If `_financialSchedule__amountWithoutScheduledDate` is not equal to `_value` and `_financialSchedule__scheduledAmounts` is empty raise an error.
 */
function splitAndSortFinancialScheduleDSB (
  /* p */ {value, financialSchedule__amountWithoutScheduledDate, financialSchedule__scheduledAmounts, financialSchedule__scheduledDates }
) {
  const _value = ensureBigIntScaled(value);
  let _financialSchedule__amountWithoutScheduledDate = ensureBigIntScaled(financialSchedule__amountWithoutScheduledDate);
  const unsorted__financialSchedule__scheduledAmounts = financialSchedule__scheduledAmounts.map((number) => ensureBigIntScaled(number));

  // sort values and dates, by date
  const {sortedValues: _financialSchedule__scheduledAmounts, sortedDates: _financialSchedule__scheduledDates} = sortValuesAndDatesByDate({
    values: unsorted__financialSchedule__scheduledAmounts,
    dates: financialSchedule__scheduledDates
  });

  if (_value === fxAdd(_financialSchedule__amountWithoutScheduledDate, _financialSchedule__scheduledAmounts.reduce((a, b) => fxAdd(a, b), 0n))) {
    // if `_financialSchedule__amountWithoutScheduledDate` + `_financialSchedule__scheduledAmounts` is equal to `_value`, do nothing
  } else if (_financialSchedule__amountWithoutScheduledDate === 0n && _financialSchedule__scheduledAmounts.length === 0) {
    // if `_financialSchedule__amountWithoutScheduledDate` == 0 and there is no `_financialSchedule__scheduledAmounts` specified, set all value amount as '_financialSchedule__amountWithoutScheduledDate'
    _financialSchedule__amountWithoutScheduledDate = _value;
  } else if (_financialSchedule__scheduledAmounts.length > 0) {
    // if we reach this point, it means that `principal*` IS NOT equal to `_value` and `_financialSchedule__scheduledAmounts` IS NOT empty.
    // then, we split the residual value from the subtraction of `_value` by `_financialSchedule__amountWithoutScheduledDate` to a new `_financialSchedule__scheduledAmounts`
    const _valueToSplit = fxSub(_value, _financialSchedule__amountWithoutScheduledDate);
    // sum `_financialSchedule__scheduledAmounts` values
    const __financialSchedule__scheduledAmountsSum = _financialSchedule__scheduledAmounts.reduce((a, b) => fxAdd(a, b), 0n);
    // loop `_financialSchedule__scheduledAmounts` and do a weighted split of the sum
    for (let i = 0; i < _financialSchedule__scheduledAmounts.length; i++) {
      _financialSchedule__scheduledAmounts[i] = fxDiv(fxMul(_valueToSplit, _financialSchedule__scheduledAmounts[i]), __financialSchedule__scheduledAmountsSum);
    }
    // sum again `_financialSchedule__scheduledAmounts` values
    const __financialSchedule__scheduledAmountsSum2 = _financialSchedule__scheduledAmounts.reduce((a, b) => fxAdd(a, b), 0n);
    // if the sum is not equal to `_valueToSplit`, add the difference to the last value of `_financialSchedule__scheduledAmounts`
    if (__financialSchedule__scheduledAmountsSum2 !== _valueToSplit) {
      _financialSchedule__scheduledAmounts[_financialSchedule__scheduledAmounts.length - 1] =
        fxAdd(_financialSchedule__scheduledAmounts[_financialSchedule__scheduledAmounts.length - 1], fxSub(_valueToSplit, __financialSchedule__scheduledAmountsSum2));
    }
  } else {
    // if we reach this point, it means that `_financialSchedule__amountWithoutScheduledDate` is not equal to `_value` and `_financialSchedule__scheduledAmounts` is empty
    // then the sum of `_financialSchedule__amountWithoutScheduledDate` and `_financialSchedule__scheduledAmounts` is not equal to `_value`
    throw new Error("splitAndSortFinancialScheduleDSB: The sum of _financialSchedule__amountWithoutScheduledDate and _financialSchedule__scheduledAmounts is not equal to the value to split.");
  }

  return {
    financialSchedule__amountWithoutScheduledDate: _financialSchedule__amountWithoutScheduledDate,
    financialSchedule__scheduledAmounts: _financialSchedule__scheduledAmounts,
    financialSchedule__scheduledDates: _financialSchedule__scheduledDates
  };
}
