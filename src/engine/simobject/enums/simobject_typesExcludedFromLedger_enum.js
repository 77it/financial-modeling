import { deepFreeze, ensureArrayValuesAreUnique } from '../../../lib/obj_utils.js';

export const SimObjectTypesExcludedFromLedger_enum = {
  DEBUG: "DEBUG_",
  EXTRA: "EXTRA_"
}
deepFreeze(SimObjectTypesExcludedFromLedger_enum);

export const SimObjectTypesExcludedFromLedger_enum_validation = ensureArrayValuesAreUnique(Object.values(SimObjectTypesExcludedFromLedger_enum));
