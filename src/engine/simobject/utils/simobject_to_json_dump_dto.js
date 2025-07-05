export { simObjectToJsonDumpDto };

import { SimObject } from '../simobject.js';
import { SimObjectTypes_WithPrincipal_set } from '../enums/simobject_types_withprincipal_enum.js';
import { SimObjectJsonDumpDto } from '../simobjectjsondumpdto.js';
import { bigIntToStringWithDecimals } from './bigint_to_string_with_decimals.js';
import { deepFreeze } from '../../../lib/obj_utils.js';

/**
 * Convert the SimObject to a SimObjectJsonDumpDto
 * @param {SimObject} simObject
 * @returns {SimObjectJsonDumpDto}
 */
function simObjectToJsonDumpDto (simObject) {
  // set `bs_Principal` or `financialSchedule` properties if the type is in SimObjectTypes_WithPrincipal_set
  SimObjectTypes_WithPrincipal_set.has(simObject.type);

  //#region set `bs_Principal_*` properties if the type is in SimObjectTypes_WithPrincipal_set, otherwise set `financialSchedule_*`
  const _amountWithoutScheduledDate = bigIntToStringWithDecimals(simObject.financialSchedule__amountWithoutScheduledDate, simObject.decimalPlaces);
  const _scheduledDates = simObject.financialSchedule__scheduledDates.map((date) => _dateToISOString(date));
  const _scheduledAmounts = simObject.financialSchedule__scheduledAmounts.map((big) => bigIntToStringWithDecimals(big, simObject.decimalPlaces));

  const set_principal = SimObjectTypes_WithPrincipal_set.has(simObject.type);

  const financialSchedule__amountWithoutScheduledDate = set_principal ? '' : _amountWithoutScheduledDate;
  const financialSchedule__scheduledDates = set_principal ? [] : _scheduledDates;
  const financialSchedule__scheduledAmounts = set_principal ? [] : _scheduledAmounts;

  const bs_Principal__PrincipalToPay_IndefiniteExpiryDate = !set_principal ? '' : _amountWithoutScheduledDate;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Date = !set_principal ? [] : _scheduledDates;
  const bs_Principal__PrincipalToPay_AmortizationSchedule__Principal = !set_principal ? [] : _scheduledAmounts;
  //#endregion

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
    bs_Principal__PrincipalToPay_IndefiniteExpiryDate: bs_Principal__PrincipalToPay_IndefiniteExpiryDate,
    bs_Principal__PrincipalToPay_AmortizationSchedule__Date: bs_Principal__PrincipalToPay_AmortizationSchedule__Date,
    bs_Principal__PrincipalToPay_AmortizationSchedule__Principal: bs_Principal__PrincipalToPay_AmortizationSchedule__Principal,
    financialSchedule__amountWithoutScheduledDate: financialSchedule__amountWithoutScheduledDate,
    financialSchedule__scheduledDates: financialSchedule__scheduledDates,
    financialSchedule__scheduledAmounts: financialSchedule__scheduledAmounts,
    is_Link__SimObjId: simObject.is_Link__SimObjId,
  }));
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
