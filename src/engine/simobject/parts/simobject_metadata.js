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
  constructor ({ metadata__Name, metadata__Value, metadata__PercentageWeight }) {
    // create arrays
    this.metadata__Name = metadata__Name;
    this.metadata__Value = metadata__Value;
    this.metadata__PercentageWeight = metadata__PercentageWeight;
  }
}
