import { deepFreeze, ensureArrayValuesAreUnique } from '../../../lib/obj_utils.js';

export const SimObjectErrorDebugTypes_enum = {
  /*
  This debug type must not be used directly by modules.
  Every module that wants to interrupt program execution for a fatal error must throw a new Error,
  then error will be caught by the engine and recorded as a 'DEBUG_ERROR' SimObject.
   */
  DEBUG_ERROR: "DEBUG_ERROR"
}
deepFreeze(SimObjectErrorDebugTypes_enum);

export const SimObjectErrorDebugTypes_enum_validation = ensureArrayValuesAreUnique(Object.values(SimObjectErrorDebugTypes_enum));
