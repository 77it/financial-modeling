export { simObjectToDto};

import { SimObject } from '../simobject.js';
import { SimObjectDto } from '../simobjectdto.js';
import { bigIntToNumberWithDecimals } from './bigint_to_number_with_decimals.js';
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
    financialSchedule__amountWithoutScheduledDate: bigIntToNumberWithDecimals(simObject.financialSchedule__amountWithoutScheduledDate, simObject.decimalPlaces),
    financialSchedule__scheduledDates: [...simObject.financialSchedule__scheduledDates],
    financialSchedule__scheduledAmounts: simObject.financialSchedule__scheduledAmounts.map((big) => bigIntToNumberWithDecimals(big, simObject.decimalPlaces)),
    is_Link__SimObjId: simObject.is_Link__SimObjId,
    vsSimObjectName: simObject.vsSimObjectName,
    versionId: simObject.versionId,
    // TODO replace extras with new properties
    extras: {...simObject.extras},  // shallow copy with three dots operator (is copied only the first layer of object, not recursively)
  }));
}
