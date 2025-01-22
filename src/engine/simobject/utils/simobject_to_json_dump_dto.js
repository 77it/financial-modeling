export { simObjectToJsonDumpDto };

import { SimObject } from '../simobject.js';
import { SimObjectJsonDumpDto } from '../simobjectjsondumpdto.js';
import { bigIntToStringWithDecimals } from './bigint_to_string_with_decimals.js';
import { deepFreeze } from '../../../lib/obj_utils.js';

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

/** Convert date to ISO string with the current time zone as if it were UTC, stripping time
 @private
 * @param {Date} date
 * @returns {string}
 */
function _dateToISOString (date) {
  // build a UTC date with parts of the date, then convert to ISO string
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}
