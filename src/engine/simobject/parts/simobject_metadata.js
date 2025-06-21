export { SimObject_Metadata };

import { validate } from '../../../lib/schema_validation_utils.js';
import { Simulation } from '../../../config/settings_names.js';
import { SettingsSchemas } from '../../../config/settings.schemas.js';

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
   * @param {string[]} p.name
   * @param {string[]} p.value
   * @param {number[]} p.weight
   */
  constructor (p) {
    // read validation from ACTIVE_METADATA setting schema
    const validation = SettingsSchemas[Simulation.ACTIVE_METADATA];
    validate({ value: p, validation, strict: true });

    // length of metadata arrays must be equal
    if (p.name.length !== p.value.length || p.name.length !== p.weight.length)
      throw new Error(`length of metadata arrays must be equal, got name = ${p.name.length}, value = ${p.value.length}, weight= ${p.weight.length}`);

    // save arrays
    this.metadata__Name = p.name;
    this.metadata__Value = p.value;
    this.metadata__PercentageWeight = p.weight;
  }
}
