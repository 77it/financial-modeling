export { v };

import { FmlObj } from "./fmlobj.js";

/**
 * Returns the value of the parameter passed.
 * If the input is an instance of FmlObj, it returns the result of its get() method.
 * If the input is not an FmlObj, it simply returns the input value.
 *
 * @param {FmlObj | *} x - The input value which may be an FmlObj.
 * @returns {*} - The value of the FmlObj or the input itself if not an FmlObj.
 */
function v(x) {
  return x instanceof FmlObj ? x.get() : x;
}
