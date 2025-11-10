export { getFmlOrValue, getFmlOrValueToDSB };

import { ensureBigIntScaled } from '../../lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { FmlObj } from './fmlobj.js';

/**
 * Returns the value of the parameter passed.
 * If the input is an instance of FmlObj, it returns the result of its get() method.
 * If the input is not an FmlObj, it simply returns the input value.
 *
 * @param {FmlObj | *} value - The input value which may be an FmlObj.
 * @returns {*} - The value of the FmlObj or the input itself if not an FmlObj.
 */
function getFmlOrValue(value) {
  return value instanceof FmlObj ? value.get() : value;
}

/**
 * Returns the value of the parameter passed converted to Decimal.
 * If the input is an instance of FmlObj, it returns the result of its get() method then convert it to Decimal.
 * If the input is not an FmlObj, it simply returns the input value converted to Decimal.
 * @param { * } value
 * @return {bigint}
 */
function getFmlOrValueToDSB(value) {
  return ensureBigIntScaled(getFmlOrValue(value));
}
