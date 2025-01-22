export { xlookup };

import { sanitize, eq2 } from '../../../deps.js';

// inspired to https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
/**
 * Search value `lookup_value` in `lookup_array`, then return the value of `return_array` in the same row.
 * Sanitize the result if needed.
 * If `string_insensitive_match` is true: `lookup_value` (if string) is matched in a case insensitive & trim way,
 * @param {{lookup_value: *, lookup_array: *[], return_array: *[], return_first_match?: boolean, string_insensitive_match?: boolean, sanitization?: string, sanitizationOptions?: Object }} p
 * return_first_match default = true;
 * string_insensitive_match default = true;
 * sanitization if missing, no sanitization is performed;
 * sanitizationOptions is optional.
 * @returns {*}
 * */
function xlookup (
  {
    lookup_value,
    lookup_array,
    return_array,
    return_first_match,
    string_insensitive_match,
    sanitizationOptions,
    sanitization
  }) {
  if (lookup_value == null) return undefined;
  if (!Array.isArray(lookup_array)) return undefined;
  if (!Array.isArray(return_array)) return undefined;
  if (lookup_array.length !== return_array.length) return undefined;

  if (return_first_match == null) return_first_match = true;
  if (string_insensitive_match == null) string_insensitive_match = true;

  let _ret = undefined;

  // loop lookup_array
  for (let i = 0; i < lookup_array.length; i++) {
    // compare lookup_value with lookup_array[i] (case-insensitive or not)
    let _match = false;
    if (string_insensitive_match)
      _match = eq2(lookup_value, lookup_array[i]);
    else
      _match = lookup_value === lookup_array[i];

    if (_match) {
      if (return_first_match) {
        _ret = return_array[i];
        break;  // exit loop
      }
      _ret = return_array[i];
    }
  }

  if (sanitization != null)
    return sanitize({
      value: _ret,
      sanitization: sanitization,
      options: sanitizationOptions
    });

  return _ret;
}
