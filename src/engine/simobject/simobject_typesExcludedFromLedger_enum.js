import { deepFreeze } from '../../lib/obj_utils.js';

export const SimObjectTypesExcludedFromLedger_enum = {
  DEBUG: "DEBUG_",
  EXTRA: "EXTRA_"
}
deepFreeze(SimObjectTypesExcludedFromLedger_enum);

// @ts-ignore
export const SimObjectTypesExcludedFromLedger_enum_validation =
  Object.keys(SimObjectTypesExcludedFromLedger_enum).map(key => SimObjectTypesExcludedFromLedger_enum[key]);
