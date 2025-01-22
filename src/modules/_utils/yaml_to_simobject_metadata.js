export { YAMLtoSimObject_Metadata };

import { SimObject_Metadata } from '../../engine/simobject/parts/simobject_metadata.js';
import { schema, sanitize, parseYAML, isNullOrWhiteSpace } from '../../deps.js';

/** Get a string, parse it as YAML, return an instance of SimObject_Metadata.
 * The string will be probably read from settings, and must be in YAML format (object or array of objects):
 *   [{ type: c/c, value: bank, weight: 0.2}, {type: line of business, value: canteen, weight: 0.3 }]
 *   { type: c/c, value: bank, weight: 0.2}
 * If the creation of `SimObject_Metadata` class fails, is set to empty arrays.
 * @param {string} source
 * @returns {SimObject_Metadata}
 */
function YAMLtoSimObject_Metadata (source) {
  // parse source as YAML
  const _parsed = parseYAML(source);

  // create arrays
  const _types = [];
  const _values = [];
  const _weights = [];

  // catch errors, and return empty arrays
  try {
    // if _parsed is an array, loop it
    if (Array.isArray(_parsed)) {
      for (const _item of _parsed) {
        const _type = sanitize({ value: _item.type, sanitization: schema.STRING_TYPE });
        const _value = sanitize({ value: _item.value, sanitization: schema.STRING_TYPE });
        const _weight = sanitize({ value: _item.weight, sanitization: schema.NUMBER_TYPE });

        // if _type or _value are null or whitespace, skip this item
        if (isNullOrWhiteSpace(_type) || isNullOrWhiteSpace(_value)) continue;

        // add to arrays
        _types.push(_type);
        _values.push(_value);
        _weights.push(_weight);
      }
    }
    // if _parsed is an object, check it and if is valid, add it to arrays
    else if (typeof _parsed === 'object') {
      const _type = sanitize({ value: _parsed.type, sanitization: schema.STRING_TYPE });
      const _value = sanitize({ value: _parsed.value, sanitization: schema.STRING_TYPE });
      const _weight = sanitize({ value: _parsed.weight, sanitization: schema.NUMBER_TYPE });

      // if _type or _value are null or whitespace, skip this item
      if (!isNullOrWhiteSpace(_type) && !isNullOrWhiteSpace(_value)) {
        _types.push(_type);
        _values.push(_value);
        _weights.push(_weight);
      }
    }

    return new SimObject_Metadata({
      metadata__Name: _types,
      metadata__Value: _values,
      metadata__PercentageWeight: _weights
    });
  } catch (e) {
    return new SimObject_Metadata({
      metadata__Name: [],
      metadata__Value: [],
      metadata__PercentageWeight: []
    });
  }
}
