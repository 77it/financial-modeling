export { eqObj, _extractKeys };
import { eq2 } from '../../src/lib/obj_utils.js';

/**
 * Equality of two objects by content, with deep comparison of objects and arrays.<p>
 * <p>
 * Equality by content can be used also between plain objects and classes instances;<p>
 * to do this comparison we have this method, otherwise we would have used simply the eq2 method.<p>
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function eqObj (a, b) {
  try {
    // if a and b are null or undefined, compare them with eq2()
    if (a == null || b == null)
      return eq2(a, b);

    // if a or b are arrays, compare them with eq2()
    if (Array.isArray(a) || Array.isArray(b))
      return eq2(a, b);

    // if a or b are dates, compare them with eq2()
    if (a instanceof Date || b instanceof Date)
      return eq2(a, b);

    // if a or b are functions, compare them with eq2()
    if (typeof a === 'function' || typeof b === 'function')
      return eq2(a, b);

    // if a or b are regex, compare them with eq2()
    if (a instanceof RegExp || b instanceof RegExp)
      return eq2(a, b);

    // if a and b are objects, extract keys then compare them
    if (typeof a === 'object' && typeof b === 'object')
      return eq2(_extractKeys(a), _extractKeys(b));

    // fallback, compare them with eq2()
    return eq2(a, b);
  }
  catch (e) {
    return eq2(a, b);
  }
}

/**
 * Function used by 'eqObj' to compare classes and objects.
 *
 * Extract keys from a class or another object to a plain object, also additional properties for the object that are inherited from the base object class contained in the object's prototype.
 * Can be used also on a plain object, but is not useful because it returns a similar object, shallow cloned.
 * Key values are NOT cloned.
 * If errors occur, returns an empty object.
 * @param {Object} obj
 * @returns {any}
 */
function _extractKeys (obj) {
  // catch errors, if any returns empty object
  try {
    // if source is null or not an object, return empty object
    if (obj == null || !(typeof obj === 'object' || typeof obj === 'function'))
      return {};

    // if source is an array, return empty object
    if (Array.isArray(obj))
      return {};

    // loop object keys and copy them to a plain object.
    // loop also on additional properties for the object that are inherited from the base object class contained in the object's prototype.
    const _keys = {};
    for (const key in obj) {
      //@ts-ignore - ignore that obj[key] can be a function
      _keys[key] = obj[key];
    }

    return _keys;
  } catch (e) {
    return {};
  }
}
