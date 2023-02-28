import { deepFreeze } from '../../lib/obj_utils.js';

/*
Why do we have 4 debug types?
Because we took inspiration from the JavaScript console object, which has 4 methods:
console.debug, console.info, console.warn, console.error
(see https://developer.mozilla.org/en-US/docs/Web/API/console)
 */
export const SimObjectDebugTypes_enum = {
  DEBUG_DEBUG: "DEBUG_DEBUG",
  DEBUG_INFO: "DEBUG_INFO",
  DEBUG_WARNING: "DEBUG_WARNING",

  /*
  This debug type should not be used directly by modules.
  Every module that wants to interrupt program execution for a fatal error must throw a new Error,
  then error will be caught by the engine and recorded as a 'DEBUG_ERROR' SimObject.
   */
  DEBUG_ERROR: "DEBUG_ERROR"
}
deepFreeze(SimObjectDebugTypes_enum);

// @ts-ignore
export const SimObjectDebugTypes_enum_validation = Object.keys(SimObjectDebugTypes_enum).map(key => SimObjectDebugTypes_enum[key]);
