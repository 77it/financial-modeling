export { SimObject_Metadata };

import { simObject_Metadata_Schema } from './simobject_metadata.schema.js';
import { validate } from '../../../lib/schema_validation_utils.js';

// SimObject_Metadata class. This class can be used to store the metadata part of a SimObject
class SimObject_Metadata {
  //#region public fields
  /** @type {string[]} */
  metadata__Name;
  /** @type {string[]} */
  metadata__Value;
  /** @type {number[]} */
  metadata__PercentageWeight;

  //#endregion

  /**
   * SimObject_Metadata class
   * @param {Object} p
   * @param {string[]} p.metadata__Name
   * @param {string[]} p.metadata__Value
   * @param {number[]} p.metadata__PercentageWeight
   */
  constructor (p) {
    validate({ value: p, validation: simObject_Metadata_Schema, strict: true });

    // length of metadata arrays must be equal
    if (p.metadata__Name.length !== p.metadata__Value.length || p.metadata__Name.length !== p.metadata__PercentageWeight.length)
      throw new Error(`length of metadata arrays must be equal, got name = ${p.metadata__Name.length}, value = ${p.metadata__Value.length}, weight= ${p.metadata__PercentageWeight.length}`);

    // save arrays
    this.metadata__Name = p.metadata__Name;
    this.metadata__Value = p.metadata__Value;
    this.metadata__PercentageWeight = p.metadata__PercentageWeight;
  }
}
