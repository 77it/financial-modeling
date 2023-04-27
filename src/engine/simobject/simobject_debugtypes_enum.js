import { deepFreeze, ensureArrayValuesAreUnique } from '../../lib/obj_utils.js';

/*
Why do we have 4 debug types?  // DEBUG_ERROR type is on another file
Because we took inspiration from the JavaScript console object, which has 4 methods:
console.debug, console.info, console.warn, console.error
(see https://developer.mozilla.org/en-US/docs/Web/API/console)
 */
export const SimObjectDebugTypes_enum = {
  DEBUG_DEBUG: "DEBUG_DEBUG",
  DEBUG_INFO: "DEBUG_INFO",
  DEBUG_WARNING: "DEBUG_WARNING",
}
deepFreeze(SimObjectDebugTypes_enum);

export const SimObjectDebugTypes_enum_validation = ensureArrayValuesAreUnique(Object.values(SimObjectDebugTypes_enum));
