import { simObject_Metadata_Schema } from './simobject_metadata.schema.js';
import { validateObj } from '../../../lib/schema_validation_utils.js';

export { SimObject_Metadata };

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
    validateObj({ obj: p, validation: simObject_Metadata_Schema, strict: true });

    // create arrays
    this.metadata__Name = p.metadata__Name;
    this.metadata__Value = p.metadata__Value;
    this.metadata__PercentageWeight = p.metadata__PercentageWeight;
  }
}
