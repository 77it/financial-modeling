import { deepFreeze, ensureArrayValuesAreUnique } from '../../../lib/obj_utils.js';

export const SimObjectConsolidationTypes_enum = {
  BS_CONSOLIDATION: "BS_CONSOLIDATION",
  IS_CONSOLIDATION: "IS_CONSOLIDATION",
}
deepFreeze(SimObjectConsolidationTypes_enum);

export const SimObjectConsolidationTypes_enum_validation = ensureArrayValuesAreUnique(Object.values(SimObjectConsolidationTypes_enum));
