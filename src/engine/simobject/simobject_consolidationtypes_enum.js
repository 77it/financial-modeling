import { deepFreeze } from '../../lib/obj_utils.js';

export const SimObjectConsolidationTypes_enum = {
  BS_CONSOLIDATION: "BS_CONSOLIDATION",
  IS_CONSOLIDATION: "IS_CONSOLIDATION",
}
deepFreeze(SimObjectConsolidationTypes_enum);

// @ts-ignore
export const SimObjectConsolidationTypes_enum_validation = Object.keys(SimObjectConsolidationTypes_enum).map(key => SimObjectConsolidationTypes_enum[key]);
