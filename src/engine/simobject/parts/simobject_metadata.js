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
   *
   * Save the metadata arrays after validating them.
   * The length of the 3 arrays must be equal.
   * Validation schema is read from ACTIVE_METADATA setting.
   *
   * Weights are in percentage; if ANY weight is > 1, ALL weights are considered as percentage (e.g. 20 = 20%) then are / 100.
   * If a single weight is < 0 or > 100 an error is thrown.
   *
   * @param {Object} p
   * @param {string[]} p.name
   * @param {string[]} p.value
   * @param {number[]} p.weight
   * @throws {Error} if validation fails
   */
  constructor (p) {
    // read validation from ACTIVE_METADATA setting schema
    const validation = SettingsSchemas[Simulation.ACTIVE_METADATA];
    validate({ value: p, validation, strict: true });

    // length of metadata arrays must be equal
    if (p.name.length !== p.value.length || p.name.length !== p.weight.length)
      throw new Error(`length of metadata arrays must be equal, got name = ${p.name.length}, value = ${p.value.length}, weight= ${p.weight.length}`);

    // If a weight is < 0 or > 100 throw an error
    for (let i = 0; i < p.weight.length; i++) {
      if (p.weight[i] < 0 || p.weight[i] > 100) {
        throw new Error(`metadata weight must be >= 0 and <= 100, got ${p.weight[i]} at index ${i}`);
      }
    }

    // save arrays after cloning them
    this.metadata__Name = [...p.name];
    this.metadata__Value = [...p.value];
    this.metadata__PercentageWeight = [...p.weight];

    // Normalize weights to be in range 0-1. If ANY weight is > 1, ALL are considered as percentage (e.g. 20 = 20%) then are / 100.
    // We don't need to manipulate the number string because integer are well represented as floating point numbers
    // then dividing by 100 won't cause loss of precision.
    const anyWeightGreaterThanOne = this.metadata__PercentageWeight.some(w => w > 1);
    if (anyWeightGreaterThanOne) {
      for (let i = 0; i < this.metadata__PercentageWeight.length; i++) {
        this.metadata__PercentageWeight[i] = this.metadata__PercentageWeight[i] / 100;
      }
    }
  }
}
