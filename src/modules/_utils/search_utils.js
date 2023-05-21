export { xlookup };

import { lowerCaseCompare, sanitization as sanitizationUtils } from '../../deps.js';

// inspired to https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
/**
 * Search a value in a column, return the value of another column in the same row. Sanitize the result if needed.
 * @param {{lookup_value: *, lookup_array: *[], return_array: *[], return_first_match?: boolean, sanitization?: string, sanitizationOptions?: Object }} p
 * return_first_match default = true;
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions if missing, no sanitizationOptions are passed to sanitization.
 * @returns {*}
 * */
function xlookup ({ lookup_value, lookup_array, return_array, sanitization, return_first_match, sanitizationOptions }) {
  if (lookup_value == null) return undefined;
  if (!Array.isArray(lookup_array)) return undefined;
  if (!Array.isArray(return_array)) return undefined;
  if (lookup_array.length !== return_array.length) return undefined;

  if (return_first_match == null) return_first_match = true;

  let _ret = undefined;

  // loop lookup_array
  for (let i = 0; i < lookup_array.length; i++) {
    // if lookup_value == lookup_array[i], return return_array[i]
    if (lookup_value === lookup_array[i]) {
      if (return_first_match === true) {
        _ret = return_array[i];
        break;  // exit loop
      }
      _ret = return_array[i];
    }
  }

  if (sanitization != null)
    return sanitizationUtils.sanitize({
      value: _ret,
      sanitization: sanitization,
      options: sanitizationOptions
    });

  return _ret;
}
