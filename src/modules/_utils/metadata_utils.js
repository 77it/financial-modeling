export { ActiveMetadata };

import { schema, sanitize, parseYAML, isNullOrWhiteSpace } from '../../deps.js';

// ActiveMetadata class.
// Init set the class from a string.
// The string will be probably read from settings, and must be in YAML format (object or array of objects):
//   [{ type: c/c, value: bank, weight: 0.2}, {type: line of business, value: canteen, weight: 0.3 }]
//   { type: c/c, value: bank, weight: 0.2}
class ActiveMetadata {
  //#region public fields
  /** @type {string[]} */
  types;
  /** @type {string[]} */
  values;
  /** @type {number[]} */
  weights;

  //#endregion

  /**
   * ActiveMetadata class
   * @param {string} source
   */
  constructor (source) {
    // parse source as YAML
    const _parsed = parseYAML(source);

    // create arrays
    this.types = [];
    this.values = [];
    this.weights = [];

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
          this.types.push(_type);
          this.values.push(_value);
          this.weights.push(_weight);
        }
      }
      // if _parsed is an object, check it and if is valid, add it to arrays
      else if (typeof _parsed === 'object') {
        const _type = sanitize({ value: _parsed.type, sanitization: schema.STRING_TYPE });
        const _value = sanitize({ value: _parsed.value, sanitization: schema.STRING_TYPE });
        const _weight = sanitize({ value: _parsed.weight, sanitization: schema.NUMBER_TYPE });

        // if _type or _value are null or whitespace, skip this item
        if (!isNullOrWhiteSpace(_type) && !isNullOrWhiteSpace(_value)) {
          this.types.push(_type);
          this.values.push(_value);
          this.weights.push(_weight);
        }
      }
    } catch (e) {
      this.types = [];
      this.values = [];
      this.weights = [];
    }
  }
}
